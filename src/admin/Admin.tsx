import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  BRANCH,
  IMG_DIR,
  MD_DIR,
  OWNER,
  REPO,
  commitChanges,
  listDir,
  readText,
  utf8ToB64,
  verifyToken,
  type Change,
} from "./github";
import { SLUG_RE, composePost, parsePost, parseTags, type PostDraft } from "./postFormat";
import styles from "./Admin.module.css";
import GalleryAdmin from "./GalleryAdmin";
import { KEY_FILE, MIN_PASSWORD, decryptToken, encryptToken, loadVault, type Vault } from "./vault";
import { usePageMeta } from "../seo/usePageMeta";

const TOKEN_KEY = "blogAdminToken";
const DRAFT_KEY = "blogAdminDraft";
const TAB_KEY = "adminTab";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// Contents: write を事前入力したトークン作成ページ（リポジトリの選択だけは手動）
const TOKEN_URL =
  "https://github.com/settings/personal-access-tokens/new?name=blog-admin&description=wahoij.github.io+blog+admin&expires_in=366&contents=write";

const emptyDraft: PostDraft = { slug: "", title: "", tags: "", body: "" };

// localStorage はプライベートモード等で例外を投げることがあるので包む
const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  remove: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

type PendingImage = { repoPath: string; base64: string; url: string };
type Status = { type: "success" | "error" | "info"; text: string } | null;

const loadSavedDraft = (): { draft: PostDraft; isNew: boolean } => {
  try {
    const saved = JSON.parse(storage.get(DRAFT_KEY) ?? "null");
    if (saved?.draft) return { draft: { ...emptyDraft, ...saved.draft }, isNew: saved.isNew ?? true };
  } catch {
    /* ignore */
  }
  return { draft: emptyDraft, isNew: true };
};

function TokenSetup({ onSaved }: { onSaved: (token: string) => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await verifyToken(input.trim());
      storage.set(TOKEN_KEY, input.trim());
      onSaved(input.trim());
    } catch (e) {
      setError(`トークンを確認できませんでした: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className={styles.narrow}>
      <Typography variant="h5" gutterBottom>
        ブログ管理
      </Typography>
      <Typography variant="body2" paragraph>
        GitHub の fine-grained Personal Access Token を入力してください。トークンはこのブラウザにだけ保存されます。
      </Typography>
      <ol className={styles.steps}>
        <li>
          <a href={TOKEN_URL} target="_blank" rel="noreferrer">
            トークン作成ページ
          </a>
          を開く（Contents の書き込み権限が入った状態で開きます）
        </li>
        <li>「Repository access」で「Only select repositories」を選び、{REPO} を選ぶ</li>
        <li>
          Permissions に「Contents: Read and write」があることを確認する（無ければ「Add permissions」から Contents
          を追加して Read and write に）
        </li>
        <li>「Generate token」を押し、表示されたトークン（github_pat_…）を下に貼る</li>
      </ol>
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          type="password"
          label="Personal Access Token"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && input && save()}
        />
        <Button variant="contained" onClick={save} disabled={!input || busy}>
          {busy ? <CircularProgress size={20} /> : "保存"}
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

function PasswordLogin({
  vault,
  onLogin,
  onUseToken,
}: {
  vault: Vault;
  onLogin: (token: string) => void;
  onUseToken: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    setError("");
    try {
      const token = await decryptToken(vault, password);
      try {
        await verifyToken(token);
      } catch (e) {
        throw new Error(
          `パスワードは合っていますが、保存されているトークンが使えません（期限切れの可能性）: ${(e as Error).message}`
        );
      }
      storage.set(TOKEN_KEY, token);
      onLogin(token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className={styles.narrow}>
      <Typography variant="h5" gutterBottom>
        管理画面ログイン
      </Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          type="password"
          label="パスワード"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && password && !busy && login()}
        />
        <Button variant="contained" onClick={login} disabled={!password || busy}>
          {busy ? <CircularProgress size={20} /> : "ログイン"}
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Button size="small" sx={{ mt: 2 }} onClick={onUseToken}>
        トークンで設定し直す
      </Button>
    </Box>
  );
}

function PasswordDialog({
  token,
  hasVault,
  onClose,
  onChanged,
}: {
  token: string;
  hasVault: boolean;
  onClose: () => void;
  onChanged: (v: Vault | null) => void;
}) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const tooShort = pw.length < MIN_PASSWORD;
  const mismatch = pw !== pw2;

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const vault = await encryptToken(token, pw);
      await commitChanges(
        token,
        [{ path: KEY_FILE, base64: utf8ToB64(JSON.stringify(vault, null, 2) + "\n") }],
        "admin: ログイン用パスワードを設定"
      );
      onChanged(vault);
      setPw("");
      setPw2("");
      setStatus({ type: "success", text: "設定しました。次回から他の端末でもパスワードでログインできます。" });
    } catch (e) {
      setStatus({ type: "error", text: `設定に失敗しました: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("パスワードログインを解除します。よろしいですか？")) return;
    setBusy(true);
    setStatus(null);
    try {
      await commitChanges(token, [{ path: KEY_FILE, base64: null }], "admin: ログイン用パスワードを解除");
      onChanged(null);
      setStatus({ type: "success", text: "解除しました。" });
    } catch (e) {
      setStatus({ type: "error", text: `解除に失敗しました: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>ログイン用パスワード</DialogTitle>
      <DialogContent>
        <Typography variant="body2" paragraph>
          今のトークンをパスワードで暗号化してサイトに置きます。他の端末ではパスワードだけでログインできます。
          暗号化されたデータは誰でも取得できるため、{MIN_PASSWORD}文字以上で他で使っていないパスワードにしてください。
          トークンの期限が切れたら、新しいトークンでログインし直して再設定してください。
        </Typography>
        <Stack spacing={2}>
          <TextField
            size="small"
            type="password"
            label={`新しいパスワード（${MIN_PASSWORD}文字以上）`}
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            error={!!pw && tooShort}
          />
          <TextField
            size="small"
            type="password"
            label="もう一度入力"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            error={!!pw2 && mismatch}
            helperText={pw2 && mismatch ? "一致しません" : " "}
          />
        </Stack>
        {status && <Alert severity={status.type}>{status.text}</Alert>}
      </DialogContent>
      <DialogActions>
        {hasVault && (
          <Button color="error" onClick={remove} disabled={busy} sx={{ mr: "auto" }}>
            解除
          </Button>
        )}
        <Button onClick={onClose} disabled={busy}>
          閉じる
        </Button>
        <Button variant="contained" onClick={save} disabled={busy || tooShort || mismatch}>
          {busy ? <CircularProgress size={20} /> : hasVault ? "変更" : "設定"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BlogEditor({ token }: { token: string }) {
  const initial = useMemo(loadSavedDraft, []);
  const [draft, setDraft] = useState<PostDraft>(initial.draft);
  const [isNew, setIsNew] = useState(initial.isNew);
  const [dirty, setDirty] = useState(false);
  const [posts, setPosts] = useState<string[] | null>(null);
  const [images, setImages] = useState<Record<string, PendingImage>>({});
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshPosts = useCallback(async () => {
    try {
      const items = await listDir(token, MD_DIR);
      setPosts(
        items
          .filter((i) => i.type === "file" && i.name.endsWith(".md"))
          .map((i) => i.name.replace(/\.md$/, ""))
          .sort()
      );
    } catch (e) {
      setStatus({ type: "error", text: `記事一覧の取得に失敗しました: ${(e as Error).message}` });
      setPosts([]);
    }
  }, [token]);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  // 下書きの自動保存
  useEffect(() => {
    storage.set(DRAFT_KEY, JSON.stringify({ draft, isNew }));
  }, [draft, isNew]);

  // 未公開の変更があるときはページ離脱を確認
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = (patch: Partial<PostDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const confirmDiscard = () => !dirty || window.confirm("未公開の変更は破棄されます。よろしいですか？");

  const resetImages = () => {
    Object.values(images).forEach((img) => URL.revokeObjectURL(img.url));
    setImages({});
  };

  const newPost = () => {
    if (!confirmDiscard()) return;
    resetImages();
    setDraft(emptyDraft);
    setIsNew(true);
    setDirty(false);
    setStatus(null);
  };

  const openPost = async (slug: string) => {
    if (!confirmDiscard()) return;
    setBusy(true);
    setStatus(null);
    try {
      const text = await readText(token, `${MD_DIR}/${slug}.md`);
      resetImages();
      setDraft(parsePost(slug, text));
      setIsNew(false);
      setDirty(false);
    } catch (e) {
      setStatus({ type: "error", text: `読み込みに失敗しました: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const insertAtCursor = (text: string) => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? draft.body.length;
    const end = el?.selectionEnd ?? draft.body.length;
    update({ body: draft.body.slice(0, start) + text + draft.body.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const onImages = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!SLUG_RE.test(draft.slug)) {
      setStatus({ type: "error", text: "画像を追加する前にファイル名（URL）を入力してください" });
      return;
    }
    const added: Record<string, PendingImage> = {};
    const lines: string[] = [];
    for (const [i, file] of [...files].entries()) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_IMAGE_BYTES) {
        setStatus({ type: "error", text: `${file.name} は10MBを超えているため追加できません` });
        continue;
      }
      const ext = (file.name.match(/\.([A-Za-z0-9]+)$/)?.[1] ?? "png").toLowerCase();
      const name = `${Date.now()}${i ? `-${i}` : ""}.${ext}`;
      const publicPath = `/blog/img/${draft.slug}/${name}`;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      added[publicPath] = {
        repoPath: `${IMG_DIR}/${draft.slug}/${name}`,
        base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
        url: URL.createObjectURL(file),
      };
      lines.push(`![${file.name.replace(/\.[^.]+$/, "")}](${publicPath})`);
    }
    if (!lines.length) return;
    setImages((prev) => ({ ...prev, ...added }));
    insertAtCursor(`\n${lines.join("\n")}\n`);
  };

  const validate = () => {
    if (!SLUG_RE.test(draft.slug)) return "ファイル名（URL）は半角英数字・-・_ で入力してください";
    if (!draft.title.trim()) return "タイトルを入力してください";
    if (isNew && posts?.includes(draft.slug)) return `「${draft.slug}」は既に存在します。別のファイル名にしてください`;
    return null;
  };

  const publish = async () => {
    const err = validate();
    if (err) {
      setStatus({ type: "error", text: err });
      return;
    }
    setBusy(true);
    setStatus({ type: "info", text: "公開しています…" });
    try {
      // 本文から削除された画像はアップロードしない
      const usedImages = Object.entries(images).filter(([publicPath]) => draft.body.includes(publicPath));
      const changes: Change[] = [
        { path: `${MD_DIR}/${draft.slug}.md`, base64: utf8ToB64(composePost(draft)) },
        ...usedImages.map(([, img]) => ({ path: img.repoPath, base64: img.base64 })),
      ];
      await commitChanges(token, changes, `blog: 「${draft.title.trim()}」を${isNew ? "追加" : "更新"}`);
      resetImages();
      setIsNew(false);
      setDirty(false);
      setStatus({
        type: "success",
        text: "公開しました。サイトへの反映には1〜3分ほどかかります。",
      });
      refreshPosts();
    } catch (e) {
      setStatus({ type: "error", text: `公開に失敗しました: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const deletePost = async () => {
    if (isNew) return;
    if (!window.confirm(`「${draft.title || draft.slug}」を削除します。元に戻せません。よろしいですか？`)) return;
    setBusy(true);
    setStatus({ type: "info", text: "削除しています…" });
    try {
      const imgs = await listDir(token, `${IMG_DIR}/${draft.slug}`);
      await commitChanges(
        token,
        [
          { path: `${MD_DIR}/${draft.slug}.md`, base64: null },
          ...imgs.filter((i) => i.type === "file").map((i) => ({ path: i.path, base64: null })),
        ],
        `blog: 「${draft.title || draft.slug}」を削除`
      );
      resetImages();
      setDraft(emptyDraft);
      setIsNew(true);
      setDirty(false);
      setStatus({ type: "success", text: "削除しました。" });
      refreshPosts();
    } catch (e) {
      setStatus({ type: "error", text: `削除に失敗しました: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const tags = parseTags(draft.tags);

  return (
    <div className={styles.admin}>
      <aside className={styles.sidebar}>
        <Button variant="contained" fullWidth onClick={newPost} disabled={busy}>
          ＋ 新しい記事
        </Button>
        <Typography variant="subtitle2" sx={{ mt: 2 }}>
          公開済みの記事
        </Typography>
        {posts === null ? (
          <CircularProgress size={20} />
        ) : posts.length === 0 ? (
          <Typography variant="body2">なし</Typography>
        ) : (
          <List dense disablePadding>
            {posts.map((slug) => (
              <ListItemButton
                key={slug}
                selected={!isNew && draft.slug === slug}
                onClick={() => openPost(slug)}
                disabled={busy}
              >
                <ListItemText primary={slug} />
              </ListItemButton>
            ))}
          </List>
        )}
        <Stack spacing={1} sx={{ mt: 3 }}>
          <Link to="/Blog/">ブログを見る</Link>
          <a href={`https://github.com/${OWNER}/${REPO}/actions`} target="_blank" rel="noreferrer">
            デプロイ状況（GitHub Actions）
          </a>
          <a href="https://analytics.google.com/" target="_blank" rel="noreferrer">
            アクセス解析（Google Analytics）
          </a>
        </Stack>
      </aside>

      <section className={styles.main}>
        {status && (
          <Alert severity={status.type} onClose={() => setStatus(null)} sx={{ mb: 2 }}>
            {status.text}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="タイトル"
            size="small"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="ファイル名（URL）"
              size="small"
              value={draft.slug}
              onChange={(e) => update({ slug: e.target.value.trim() })}
              disabled={!isNew}
              error={!!draft.slug && !SLUG_RE.test(draft.slug)}
              helperText={
                isNew ? `半角英数字・-・_ （例: my-first-post → /Blog/my-first-post/）` : "公開済みの記事は変更できません"
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="タグ（カンマ区切り）"
              size="small"
              value={draft.tags}
              onChange={(e) => update({ tags: e.target.value })}
              helperText={tags.length ? tags.map((t) => `#${t}`).join(" ") : "例: 自転車, 日記"}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
            >
              画像を追加
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                onImages(e.target.files);
                e.target.value = "";
              }}
            />
            <Typography variant="caption" color="text.secondary">
              本文へのドラッグ＆ドロップ・貼り付けでも追加できます
            </Typography>
          </Stack>

          <div className={styles.split}>
            <textarea
              ref={bodyRef}
              className={styles.body}
              value={draft.body}
              placeholder="本文を Markdown で書く"
              onChange={(e) => update({ body: e.target.value })}
              onDrop={(e) => {
                if (e.dataTransfer.files.length) {
                  e.preventDefault();
                  onImages(e.dataTransfer.files);
                }
              }}
              onPaste={(e) => {
                if (e.clipboardData.files.length) {
                  e.preventDefault();
                  onImages(e.clipboardData.files);
                }
              }}
            />
            <div className={styles.preview}>
              {tags.length > 0 && (
                <div className={styles.tags}>
                  {tags.map((t) => (
                    <span key={t} className={styles.tag}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {draft.title && <h1>{draft.title}</h1>}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // 未公開の画像はローカルの画像で表示
                  img: ({ src, ...props }) => (
                    <img {...props} src={(typeof src === "string" && images[src]?.url) || src} />
                  ),
                }}
              >
                {draft.body}
              </ReactMarkdown>
            </div>
          </div>

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button variant="contained" onClick={publish} disabled={busy}>
              {busy ? <CircularProgress size={20} color="inherit" /> : isNew ? "公開する" : "更新する"}
            </Button>
            {!isNew && (
              <Button color="error" onClick={deletePost} disabled={busy}>
                この記事を削除
              </Button>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            公開すると {BRANCH} ブランチにコミットされ、自動でデプロイされます。下書きはこのブラウザに自動保存されます（未公開の画像は保存されません）。
          </Typography>
        </Stack>
      </section>
    </div>
  );
}

export default function Admin() {
  usePageMeta({ title: "管理画面", noindex: true });
  const [token, setToken] = useState<string | null>(() => storage.get(TOKEN_KEY));
  const [tab, setTab] = useState<"blog" | "gallery">(() =>
    storage.get(TAB_KEY) === "gallery" ? "gallery" : "blog"
  );
  // undefined = 読み込み中, null = パスワード未設定
  const [vault, setVault] = useState<Vault | null | undefined>(undefined);
  const [useToken, setUseToken] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  useEffect(() => {
    loadVault().then(setVault);
  }, []);

  const logout = () => {
    if (!window.confirm("このブラウザからログイン情報を削除します。よろしいですか？")) return;
    storage.remove(TOKEN_KEY);
    setToken(null);
  };

  if (!token) {
    if (vault === undefined)
      return (
        <Box className={styles.narrow}>
          <CircularProgress />
        </Box>
      );
    if (vault && !useToken)
      return <PasswordLogin vault={vault} onLogin={setToken} onUseToken={() => setUseToken(true)} />;
    return <TokenSetup onSaved={setToken} />;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.tabBar}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            storage.set(TAB_KEY, v);
          }}
        >
          <Tab value="blog" label="ブログ" />
          <Tab value="gallery" label="ギャラリー" />
        </Tabs>
        <Stack direction="row" spacing={1}>
          <Button size="small" color="inherit" onClick={() => setPwOpen(true)}>
            パスワード{vault ? "変更" : "設定"}
          </Button>
          <Button size="small" color="inherit" onClick={logout}>
            ログアウト
          </Button>
        </Stack>
      </div>
      {tab === "blog" ? <BlogEditor token={token} /> : <GalleryAdmin token={token} />}
      {pwOpen && (
        <PasswordDialog
          token={token}
          hasVault={!!vault}
          onClose={() => setPwOpen(false)}
          onChanged={setVault}
        />
      )}
    </div>
  );
}
