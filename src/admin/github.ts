// ブラウザから GitHub REST API を叩くための最小ヘルパー
export const OWNER = "WahoiJ";
export const REPO = "wahoij.github.io";
export const BRANCH = "master";
export const MD_DIR = "public/blog/md";
export const IMG_DIR = "public/blog/img";

const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

export class GitHubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function gh<T = unknown>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      msg += ` ${(await res.json()).message ?? ""}`;
    } catch {
      /* ignore */
    }
    throw new GitHubError(res.status, msg);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

// UTF-8 文字列 <-> base64
export const utf8ToB64 = (s: string) => {
  let bin = "";
  new TextEncoder().encode(s).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
export const b64ToUtf8 = (b64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

/** トークンが有効で、このリポジトリに書き込めるか確認 */
export async function verifyToken(token: string) {
  const repo = await gh<{ permissions?: { push?: boolean } }>(token, "");
  if (!repo.permissions?.push) throw new Error("このトークンにはリポジトリへの書き込み権限がありません");
}

type ContentItem = { name: string; path: string; sha: string; type: string };

/** ディレクトリ内のファイル一覧（存在しなければ空） */
export async function listDir(token: string, dir: string): Promise<ContentItem[]> {
  try {
    const items = await gh<ContentItem[]>(token, `/contents/${encodeURI(dir)}?ref=${BRANCH}`);
    return Array.isArray(items) ? items : [];
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return [];
    throw e;
  }
}

export async function readText(token: string, path: string) {
  const file = await gh<{ content: string }>(token, `/contents/${encodeURI(path)}?ref=${BRANCH}`);
  return b64ToUtf8(file.content);
}

export type Change = { path: string; base64: string | null }; // null = 削除

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * 複数ファイルの追加・更新・削除を 1 コミットで master に反映する。
 * （ファイルごとにコミットするとデプロイが何回も走るため Git Data API を使う）
 */
export async function commitChanges(
  token: string,
  changes: Change[],
  message: string,
  onProgress?: () => void
) {
  for (let attempt = 0; ; attempt++) {
    const ref = await gh<{ object: { sha: string } }>(token, `/git/ref/heads/${BRANCH}`);
    const parent = ref.object.sha;
    const parentCommit = await gh<{ tree: { sha: string } }>(token, `/git/commits/${parent}`);

    // 写真をまとめて送るときに API 制限に当たらないよう、同時に 4 件まで
    const tree = await mapLimit(changes, 4, async (c) => {
      if (c.base64 === null) return { path: c.path, mode: "100644", type: "blob", sha: null };
      const blob = await gh<{ sha: string }>(token, "/git/blobs", {
        method: "POST",
        body: JSON.stringify({ content: c.base64, encoding: "base64" }),
      });
      onProgress?.();
      return { path: c.path, mode: "100644", type: "blob", sha: blob.sha };
    });
    const newTree = await gh<{ sha: string }>(token, "/git/trees", {
      method: "POST",
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
    });
    const commit = await gh<{ sha: string }>(token, "/git/commits", {
      method: "POST",
      body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }),
    });
    try {
      await gh(token, `/git/refs/heads/${BRANCH}`, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha }),
      });
      return commit.sha;
    } catch (e) {
      // 直前に Actions が JSON をコミットした等で先に進まれていたら作り直す
      if (e instanceof GitHubError && e.status === 422 && attempt < 2) continue;
      throw e;
    }
  }
}

// デプロイ前でもすぐ表示できるよう、リポジトリの生ファイルURLを使う（公開リポジトリのため可能）
export const rawUrl = (repoPath: string) =>
  `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${repoPath}`;
