// ブラウザ内で写真を縮小して JPEG にする（EXIF の位置情報なども消える）
export type ProcessedImage = { base64: string; width: number; height: number };

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  try {
    // EXIF の向きを反映して読み込む
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function encode(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  maxSize: number,
  quality: number
): ProcessedImage {
  const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // 透過PNGの背景を白に
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { base64: dataUrl.slice(dataUrl.indexOf(",") + 1), width, height };
}

/** 表示用（長辺2048px）とサムネイル（長辺640px）を作る */
export async function processPhoto(file: File) {
  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new Error(`${file.name} を読み込めませんでした（HEIC など未対応の形式の可能性があります）`);
  }
  try {
    const photo = encode(decoded.source, decoded.width, decoded.height, 2048, 0.85);
    const thumb = encode(decoded.source, decoded.width, decoded.height, 640, 0.8);
    return { photo, thumb };
  } finally {
    decoded.close();
  }
}

export const base64ToBlobUrl = (base64: string) => {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
};
