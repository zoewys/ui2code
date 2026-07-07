import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export function compareScreenshots({ beforeBase64, afterBase64, threshold = 0.1 }) {
  const img1 = PNG.sync.read(Buffer.from(beforeBase64, "base64"));
  const img2 = PNG.sync.read(Buffer.from(afterBase64, "base64"));

  // Align to smaller dimensions
  const w = Math.min(img1.width, img2.width);
  const h = Math.min(img1.height, img2.height);
  const diff = new PNG({ width: w, height: h });

  // Crop images to aligned size if needed
  const data1 = cropImageData(img1, w, h);
  const data2 = cropImageData(img2, w, h);

  const mismatchedPixels = pixelmatch(data1, data2, diff.data, w, h, {
    threshold,
    includeAA: false,
  });

  const totalPixels = w * h;
  const similarity = totalPixels > 0 ? 1 - mismatchedPixels / totalPixels : 1;

  return {
    similarity: Math.round(similarity * 10000) / 10000,
    mismatchedPixels,
    totalPixels,
    diffImageBase64: PNG.sync.write(diff).toString("base64"),
    width: w,
    height: h,
  };
}

function cropImageData(img, targetW, targetH) {
  if (img.width === targetW && img.height === targetH) {
    return img.data;
  }
  const cropped = Buffer.alloc(targetW * targetH * 4);
  for (let y = 0; y < targetH; y++) {
    const srcOffset = y * img.width * 4;
    const dstOffset = y * targetW * 4;
    img.data.copy(cropped, dstOffset, srcOffset, srcOffset + targetW * 4);
  }
  return cropped;
}
