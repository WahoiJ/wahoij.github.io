// パスキー（WebAuthn の PRF 拡張）でトークンを暗号化する仕組み。
// PRF はパスキーごとに決まった 32 バイトの秘密を返すので、それを鍵にして AES-GCM で暗号化する。
// サーバーが無くても、パスキーを持っている人だけがトークンを取り出せる。
import { rawUrl } from "./github";

export const PASSKEY_FILE = "public/admin-passkeys.json";

export type PasskeyEntry = {
  id: string; // credential ID（base64url）
  name: string;
  salt: string; // PRF に渡す値（base64url）
  iv: string;
  data: string; // 暗号化したトークン
  createdAt: string;
};
export type PasskeyFile = { v: 1; entries: PasskeyEntry[] };

const b64u = (buf: ArrayBuffer | Uint8Array) => {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64u = (s: string) => {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b + "=".repeat((4 - (b.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
const random = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export const passkeySupported = () =>
  typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;

async function aesKey(prfOutput: ArrayBuffer) {
  const base = await crypto.subtle.importKey("raw", prfOutput, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(), info: new TextEncoder().encode("wahoij-admin-token") },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

type PrfResults = { enabled?: boolean; results?: { first?: ArrayBuffer } };
const prfOf = (cred: PublicKeyCredential) =>
  (cred.getClientExtensionResults() as { prf?: PrfResults }).prf;

const NOT_SUPPORTED =
  "このパスキーの保存先は PRF に対応していません（iCloud キーチェーン / Google パスワードマネージャー / 1Password などを使ってください）";

/** PRF の値を取り出す（登録直後に値が返らない認証器もあるので、そのときは改めて認証してもらう） */
async function evaluatePrf(credId: Uint8Array, salt: Uint8Array): Promise<ArrayBuffer> {
  const cred = (await navigator.credentials.get({
    publicKey: {
      challenge: random(32),
      rpId: location.hostname,
      allowCredentials: [{ type: "public-key", id: credId }],
      userVerification: "required",
      extensions: { prf: { eval: { first: salt } } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  const first = cred && prfOf(cred)?.results?.first;
  if (!first) throw new Error(NOT_SUPPORTED);
  return first;
}

/** 登録の途中（PRF の値を取るためにもう一度パスキーを使ってもらう必要がある状態） */
export type PendingPasskey = { credId: Uint8Array; salt: Uint8Array; name: string };

async function makeEntry(token: string, p: PendingPasskey, output: ArrayBuffer): Promise<PasskeyEntry> {
  const iv = random(12);
  const key = await aesKey(output);
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token));
  return {
    id: b64u(p.credId),
    name: p.name,
    salt: b64u(p.salt),
    iv: b64u(iv),
    data: b64u(data),
    createdAt: new Date().toISOString(),
  };
}

/**
 * パスキーを新しく作る。作成と同時に PRF の値が返ればそのまま完成（entry）。
 * Safari などは作成時に値を返さず、続けての認証もボタン操作が必要なので pending を返す
 * → finishPasskey() をボタンのクリックから呼ぶ。
 */
export async function createPasskey(
  token: string,
  name: string
): Promise<{ entry: PasskeyEntry } | { pending: PendingPasskey }> {
  const salt = random(32);
  const cred = (await navigator.credentials.create({
    publicKey: {
      rp: { name: "wahoij.github.io 管理画面", id: location.hostname },
      user: { id: random(16), name: `admin-${name}`, displayName: `管理者 ${name}` },
      challenge: random(32),
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
      extensions: { prf: { eval: { first: salt } } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("パスキーの作成がキャンセルされました");

  const prf = prfOf(cred);
  const pending: PendingPasskey = { credId: new Uint8Array(cred.rawId), salt, name };
  if (prf?.results?.first) return { entry: await makeEntry(token, pending, prf.results.first) };
  if (prf?.enabled === false) throw new Error(NOT_SUPPORTED);
  // enabled: true（値は後で取れる）か、enabled が不明（対応状況を返さない環境）→ 認証して確かめる
  return { pending };
}

/** 登録の仕上げ（ボタンのクリックから呼ぶ） */
export async function finishPasskey(token: string, pending: PendingPasskey): Promise<PasskeyEntry> {
  return makeEntry(token, pending, await evaluatePrf(pending.credId, pending.salt));
}

/** ブラウザが PRF に対応しているか（判定できなければ null） */
export async function prfCapability(): Promise<boolean | null> {
  try {
    const pkc = PublicKeyCredential as unknown as {
      getClientCapabilities?: () => Promise<Record<string, boolean>>;
    };
    const caps = await pkc.getClientCapabilities?.();
    return caps && "extension:prf" in caps ? !!caps["extension:prf"] : null;
  } catch {
    return null;
  }
}

/** 登録済みのパスキーのどれかで認証し、トークンを取り出す */
export async function loginWithPasskey(file: PasskeyFile): Promise<string> {
  const evalByCredential: Record<string, { first: Uint8Array }> = {};
  file.entries.forEach((e) => (evalByCredential[e.id] = { first: fromB64u(e.salt) }));
  const cred = (await navigator.credentials.get({
    publicKey: {
      challenge: random(32),
      rpId: location.hostname,
      allowCredentials: file.entries.map((e) => ({ type: "public-key" as const, id: fromB64u(e.id) })),
      userVerification: "required",
      extensions: { prf: { evalByCredential } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("認証がキャンセルされました");

  const entry = file.entries.find((e) => e.id === b64u(cred.rawId));
  if (!entry) throw new Error("登録されていないパスキーです");
  const first = prfOf(cred)?.results?.first;
  if (!first) throw new Error(NOT_SUPPORTED);
  try {
    const key = await aesKey(first);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64u(entry.iv) }, key, fromB64u(entry.data));
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("トークンを復号できませんでした");
  }
}

const isFile = (x: unknown): x is PasskeyFile =>
  !!x && typeof x === "object" && (x as PasskeyFile).v === 1 && Array.isArray((x as PasskeyFile).entries);

/** 登録済みパスキーの一覧を読む（無ければ null）。設定直後はデプロイ前なのでリポジトリの生ファイルも見る */
export async function loadPasskeys(): Promise<PasskeyFile | null> {
  for (const url of ["/admin-passkeys.json", `${rawUrl(PASSKEY_FILE)}?t=${Date.now()}`]) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const json = await res.json();
      if (isFile(json) && json.entries.length) return json;
    } catch {
      /* 次を試す */
    }
  }
  return null;
}
