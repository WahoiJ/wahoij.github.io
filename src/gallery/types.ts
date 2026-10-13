// public/gallery/gallery.json の形式
export type Photo = {
  id: string;
  src: string; // 表示用（長辺2048px） 例: /gallery/photos/<id>.jpg
  thumb: string; // サムネイル（長辺640px） 例: /gallery/thumbs/<id>.jpg
  width: number;
  height: number;
  caption: string;
  album: string;
  takenAt: string; // YYYY-MM-DD
  uploadedAt: string; // ISO8601
};

export type GalleryData = { photos: Photo[] };

export const GALLERY_JSON = "public/gallery/gallery.json";
export const PHOTO_DIR = "public/gallery/photos";
export const THUMB_DIR = "public/gallery/thumbs";

// 撮影日の新しい順（同日ならアップロードの新しい順）
export const sortPhotos = (photos: Photo[]) =>
  [...photos].sort(
    (a, b) => b.takenAt.localeCompare(a.takenAt) || b.uploadedAt.localeCompare(a.uploadedAt)
  );

export const albumsOf = (photos: Photo[]) => {
  const count = new Map<string, number>();
  photos.forEach((p) => p.album && count.set(p.album, (count.get(p.album) ?? 0) + 1));
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};
