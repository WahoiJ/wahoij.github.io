import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { GitHubError, commitChanges, rawUrl, readText, utf8ToB64, type Change } from "./github";
import { base64ToBlobUrl, processPhoto, type ProcessedImage } from "./imageProcess";
import {
  GALLERY_JSON,
  PHOTO_DIR,
  THUMB_DIR,
  albumsOf,
  sortPhotos,
  type GalleryData,
  type Photo,
} from "../gallery/types";
import styles from "./GalleryAdmin.module.css";

type Pending = {
  key: string;
  name: string;
  photo: ProcessedImage;
  thumb: ProcessedImage;
  previewUrl: string;
  caption: string;
  album: string;
  takenAt: string;
};

type Status = { type: "success" | "error" | "info"; text: string } | null;

const toDateInput = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const newId = (takenAt: string) =>
  `${takenAt.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8)}`;

const repoPathOf = (publicPath: string) => `public${publicPath}`;

async function loadGallery(token: string): Promise<GalleryData> {
  try {
    const data = JSON.parse(await readText(token, GALLERY_JSON));
    return { photos: Array.isArray(data.photos) ? data.photos : [] };
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return { photos: [] };
    throw e;
  }
}

const jsonChange = (data: GalleryData): Change => ({
  path: GALLERY_JSON,
  base64: utf8ToB64(JSON.stringify({ photos: sortPhotos(data.photos) }, null, 2) + "\n"),
});

export default function GalleryAdmin({ token }: { token: string }) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [bulkAlbum, setBulkAlbum] = useState("");
  const [editing, setEditing] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setPhotos(sortPhotos((await loadGallery(token)).photos));
    } catch (e) {
      setStatus({ type: "error", text: `写真一覧の取得に失敗しました: ${(e as Error).message}` });
      setPhotos([]);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 未アップロードの写真があるときはページ離脱を確認
  useEffect(() => {
    if (!pending.length) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pending.length]);

  const albums = photos ? albumsOf(photos).map(([a]) => a) : [];

  const addFiles = async (files: FileList | File[] | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!list.length) return;
    setBusy(true);
    setStatus(null);
    const errors: string[] = [];
    for (const [i, file] of list.entries()) {
      setProgress({ label: "写真を縮小しています", done: i, total: list.length });
      try {
        const { photo, thumb } = await processPhoto(file);
        const item: Pending = {
          key: `${Date.now()}-${i}-${file.name}`,
          name: file.name,
          photo,
          thumb,
          previewUrl: base64ToBlobUrl(thumb.base64),
          caption: "",
          album: bulkAlbum,
          takenAt: toDateInput(file.lastModified || Date.now()),
        };
        setPending((prev) => [...prev, item]);
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    setProgress(null);
    setBusy(false);
    if (errors.length) setStatus({ type: "error", text: errors.join("\n") });
  };

  const updatePending = (key: string, patch: Partial<Pending>) =>
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const removePending = (key: string) =>
    setPending((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });

  const applyBulkAlbum = (album: string) => {
    setBulkAlbum(album);
    setPending((prev) => prev.map((p) => ({ ...p, album })));
  };

  const upload = async () => {
    if (!pending.length) return;
    setBusy(true);
    setStatus(null);
    const total = pending.length * 2 + 1;
    let done = 0;
    setProgress({ label: "アップロードしています", done, total });
    try {
      const now = new Date().toISOString();
      const added: Photo[] = pending.map((p) => {
        const id = newId(p.takenAt);
        return {
          id,
          src: `/gallery/photos/${id}.jpg`,
          thumb: `/gallery/thumbs/${id}.jpg`,
          width: p.photo.width,
          height: p.photo.height,
          caption: p.caption.trim(),
          album: p.album.trim(),
          takenAt: p.takenAt,
          uploadedAt: now,
        };
      });
      // 直前の最新状態に追加する
      const current = await loadGallery(token);
      const changes: Change[] = [
        ...pending.flatMap((p, i) => [
          { path: `${PHOTO_DIR}/${added[i].id}.jpg`, base64: p.photo.base64 },
          { path: `${THUMB_DIR}/${added[i].id}.jpg`, base64: p.thumb.base64 },
        ]),
        jsonChange({ photos: [...current.photos, ...added] }),
      ];
      await commitChanges(token, changes, `gallery: 写真を${added.length}枚追加`, () =>
        setProgress({ label: "アップロードしています", done: ++done, total })
      );
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPending([]);
      setPhotos(sortPhotos([...current.photos, ...added]));
      setStatus({
        type: "success",
        text: `${added.length}枚アップロードしました。サイトへの反映には1〜3分ほどかかります。`,
      });
    } catch (e) {
      setStatus({ type: "error", text: `アップロードに失敗しました: ${(e as Error).message}` });
    } finally {
      setProgress(null);
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    setStatus(null);
    try {
      const current = await loadGallery(token);
      const next = current.photos.map((p) =>
        p.id === editing.id
          ? { ...p, caption: editing.caption.trim(), album: editing.album.trim(), takenAt: editing.takenAt }
          : p
      );
      await commitChanges(token, [jsonChange({ photos: next })], `gallery: 写真 ${editing.id} を更新`);
      setPhotos(sortPhotos(next));
      setEditing(null);
      setStatus({ type: "success", text: "保存しました。" });
    } catch (e) {
      setStatus({ type: "error", text: `保存に失敗しました: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const deletePhoto = async () => {
    if (!editing || !window.confirm("この写真を削除します。元に戻せません。よろしいですか？")) return;
    setBusy(true);
    setStatus(null);
    try {
      const current = await loadGallery(token);
      const target = current.photos.find((p) => p.id === editing.id) ?? editing;
      const next = current.photos.filter((p) => p.id !== editing.id);
      await commitChanges(
        token,
        [
          { path: repoPathOf(target.src), base64: null },
          { path: repoPathOf(target.thumb), base64: null },
          jsonChange({ photos: next }),
        ],
        `gallery: 写真 ${editing.id} を削除`
      );
      setPhotos(sortPhotos(next));
      setEditing(null);
      setStatus({ type: "success", text: "削除しました。" });
    } catch (e) {
      setStatus({ type: "error", text: `削除に失敗しました: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <datalist id="gallery-albums">
        {albums.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      {status && (
        <Alert severity={status.type} onClose={() => setStatus(null)} sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
          {status.text}
        </Alert>
      )}

      <Typography variant="h6">写真を追加</Typography>
      <div
        className={`${styles.drop} ${dragOver ? styles.dropActive : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !busy && fileRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        ここに写真をドラッグ、またはクリックして選択（複数可）
        <div className={styles.dropNote}>長辺2048pxに縮小してアップロードします。位置情報などの撮影データは削除されます。</div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {progress && (
        <Box sx={{ my: 2 }}>
          <Typography variant="body2">
            {progress.label}… {progress.done} / {progress.total}
          </Typography>
          <LinearProgress variant="determinate" value={(progress.done / progress.total) * 100} />
        </Box>
      )}

      {pending.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
            <TextField
              size="small"
              label="アルバム（全部に適用）"
              value={bulkAlbum}
              onChange={(e) => applyBulkAlbum(e.target.value)}
              slotProps={{ htmlInput: { list: "gallery-albums" } }}
            />
            <Button variant="contained" onClick={upload} disabled={busy}>
              {busy ? <CircularProgress size={20} color="inherit" /> : `${pending.length}枚をアップロード`}
            </Button>
          </Stack>
          <div className={styles.pendingGrid}>
            {pending.map((p) => (
              <div key={p.key} className={styles.pendingCard}>
                <div className={styles.pendingThumb}>
                  <img src={p.previewUrl} alt={p.name} />
                  <button
                    className={styles.remove}
                    onClick={() => removePending(p.key)}
                    aria-label="取り消す"
                    disabled={busy}
                  >
                    ×
                  </button>
                </div>
                <TextField
                  size="small"
                  label="キャプション"
                  multiline
                  minRows={1}
                  value={p.caption}
                  onChange={(e) => updatePending(p.key, { caption: e.target.value })}
                />
                <TextField
                  size="small"
                  label="アルバム"
                  value={p.album}
                  onChange={(e) => updatePending(p.key, { album: e.target.value })}
                  slotProps={{ htmlInput: { list: "gallery-albums" } }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="撮影日"
                  value={p.takenAt}
                  onChange={(e) => updatePending(p.key, { takenAt: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>
            ))}
          </div>
        </Box>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 4, mb: 1 }}>
        <Typography variant="h6">公開済みの写真 {photos ? `(${photos.length})` : ""}</Typography>
        <Link to="/Gallery">ギャラリーを見る</Link>
      </Stack>
      {photos === null ? (
        <CircularProgress size={20} />
      ) : photos.length === 0 ? (
        <Typography variant="body2">まだありません</Typography>
      ) : (
        <div className={styles.grid}>
          {photos.map((p) => (
            <button
              key={p.id}
              className={`${styles.cell} ${editing?.id === p.id ? styles.cellActive : ""}`}
              onClick={() => setEditing({ ...p })}
              title={p.caption}
            >
              <img src={rawUrl(repoPathOf(p.thumb))} alt={p.caption || p.id} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {editing && (
        <div className={styles.editor}>
          <img src={rawUrl(repoPathOf(editing.thumb))} alt="" className={styles.editorThumb} />
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              size="small"
              label="キャプション"
              multiline
              value={editing.caption}
              onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                size="small"
                label="アルバム"
                value={editing.album}
                onChange={(e) => setEditing({ ...editing, album: e.target.value })}
                slotProps={{ htmlInput: { list: "gallery-albums" } }}
              />
              <TextField
                size="small"
                type="date"
                label="撮影日"
                value={editing.takenAt}
                onChange={(e) => setEditing({ ...editing, takenAt: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" onClick={saveEdit} disabled={busy}>
                保存
              </Button>
              <Button onClick={() => setEditing(null)} disabled={busy}>
                閉じる
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button color="error" onClick={deletePhoto} disabled={busy}>
                削除
              </Button>
            </Stack>
          </Stack>
        </div>
      )}
    </div>
  );
}
