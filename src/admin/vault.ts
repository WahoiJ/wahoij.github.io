// パスワードでトークンを暗号化して公開リポジトリに置くための仕組み。
// PBKDF2(SHA-256, 60万回) で鍵を作り AES-GCM で暗号化する。
// 暗号文は誰でも読めるので、総当たりされても破られない長いパスワードが前提。
import { rawUrl } from "./github";

export const KEY_FILE = "public/admin-key.json";
export const MIN_PASSWORD = 12;
const ITERATIONS = 600_000;

export type Vault = { v: 1; iter: number; salt: string; iv: string; data: string };

const toB64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array, iter: number) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iter },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptToken(token: string, password: string): Promise<Vault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token)));
  return { v: 1, iter: ITERATIONS, salt: toB64(salt), iv: toB64(iv), data: toB64(data) };
}

/** パスワードが違えば例外 */
export async function decryptToken(vault: Vault, password: string): Promise<string> {
  const key = await deriveKey(password, fromB64(vault.salt), vault.iter);
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(vault.iv) }, key, fromB64(vault.data));
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("パスワードが違います");
  }
}

const isVault = (x: unknown): x is Vault =>
  !!x && typeof x === "object" && (x as Vault).v === 1 && typeof (x as Vault).data === "string";

/** 公開中の鍵ファイルを読む（無ければ null）。設定直後はデプロイ前なのでリポジトリの生ファイルも見る */
export async function loadVault(): Promise<Vault | null> {
  for (const url of ["/admin-key.json", `${rawUrl(KEY_FILE)}?t=${Date.now()}`]) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const json = await res.json();
      if (isVault(json)) return json;
    } catch {
      /* 次を試す */
    }
  }
  return null;
}
