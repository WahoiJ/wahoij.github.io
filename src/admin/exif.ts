// JPEG の Exif から撮影日（YYYY-MM-DD）を取り出す最小限のパーサー。
// 優先順位: DateTimeOriginal（撮影日時）→ DateTimeDigitized → DateTime（ファイル更新日時）
// 日時はカメラのローカル時刻のまま書かれているので、タイムゾーンの変換はしない。

const TAG_DATETIME = 0x0132;
const TAG_EXIF_IFD = 0x8769;
const TAG_DATETIME_ORIGINAL = 0x9003;
const TAG_DATETIME_DIGITIZED = 0x9004;

// APP1 セグメントは最大 64KB。余裕を見て先頭 256KB だけ読む
const HEAD_BYTES = 256 * 1024;

/** "2023:08:15 14:03:27" → "2023-08-15"（不正な値・0000:00:00 は null） */
export function parseExifDate(s: string): string | null {
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1990 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let s = "";
  for (let i = 0; i < length && offset + i < view.byteLength; i++) {
    const c = view.getUint8(offset + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

/** IFD を走査して、指定したタグの値（ASCII 文字列 or 数値）を集める */
function readIfd(view: DataView, tiff: number, ifdOffset: number, little: boolean, want: number[]) {
  const found = new Map<number, string | number>();
  const start = tiff + ifdOffset;
  if (start + 2 > view.byteLength) return found;
  const count = view.getUint16(start, little);
  for (let i = 0; i < count; i++) {
    const entry = start + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, little);
    if (!want.includes(tag)) continue;
    const type = view.getUint16(entry + 2, little);
    const n = view.getUint32(entry + 4, little);
    if (type === 2) {
      // ASCII: 4 バイト以下なら値そのもの、それより長ければオフセット
      const valueAt = n <= 4 ? entry + 8 : tiff + view.getUint32(entry + 8, little);
      found.set(tag, readAscii(view, valueAt, n));
    } else if (type === 4 || type === 3) {
      found.set(tag, type === 3 ? view.getUint16(entry + 8, little) : view.getUint32(entry + 8, little));
    }
  }
  return found;
}

/** JPEG のバイト列から撮影日を取り出す。Exif が無ければ null */
export function exifDateFromJpeg(buffer: ArrayBuffer): string | null {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // JPEG ではない

  let pos = 2;
  while (pos + 4 <= view.byteLength) {
    if (view.getUint8(pos) !== 0xff) return null;
    const marker = view.getUint8(pos + 1);
    if (marker === 0xff) {
      pos++; // パディング
      continue;
    }
    if (marker === 0xda || marker === 0xd9) return null; // 画像データに到達（Exif なし）
    const size = view.getUint16(pos + 2);
    if (marker === 0xe1 && readAscii(view, pos + 4, 6) === "Exif") {
      const tiff = pos + 10;
      const order = view.getUint16(tiff);
      if (order !== 0x4949 && order !== 0x4d4d) return null;
      const little = order === 0x4949;
      if (view.getUint16(tiff + 2, little) !== 0x2a) return null;

      const ifd0 = readIfd(view, tiff, view.getUint32(tiff + 4, little), little, [TAG_DATETIME, TAG_EXIF_IFD]);
      const exifPtr = ifd0.get(TAG_EXIF_IFD);
      const exif =
        typeof exifPtr === "number"
          ? readIfd(view, tiff, exifPtr, little, [TAG_DATETIME_ORIGINAL, TAG_DATETIME_DIGITIZED])
          : new Map<number, string | number>();

      for (const v of [exif.get(TAG_DATETIME_ORIGINAL), exif.get(TAG_DATETIME_DIGITIZED), ifd0.get(TAG_DATETIME)]) {
        if (typeof v === "string") {
          const date = parseExifDate(v);
          if (date) return date;
        }
      }
      return null;
    }
    pos += 2 + size;
  }
  return null;
}

/** 写真ファイルから撮影日を読む（JPEG 以外・Exif なし・壊れたデータは null） */
export async function readExifDate(file: File): Promise<string | null> {
  try {
    const buf = await file.slice(0, HEAD_BYTES).arrayBuffer();
    return exifDateFromJpeg(buf);
  } catch {
    return null;
  }
}
