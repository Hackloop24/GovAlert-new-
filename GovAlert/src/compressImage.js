// Shrinks large photos in the browser before upload (max 1600 px, JPEG ~80% quality).
// Keeps uploads small enough for serverless hosting limits and saves mobile data.
const MAX_DIMENSION = 1600;
const COMPRESS_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function compressImage(file, { minBytes = 500 * 1024 } = {}) {
  if (!COMPRESS_TYPES.includes(file.type) || file.size < minBytes) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // transparent PNG areas become white instead of black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return file; // keep the original if it isn't smaller
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file; // unsupported image - upload as-is
  }
}
