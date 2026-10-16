import { appError } from '../../i18n/errors.js';

const MAX_OCR_DIMENSION = 2200;

export async function loadImageSource(fileOrBlob) {
  if (globalThis.createImageBitmap) return createImageBitmap(fileOrBlob);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(appError('IMAGE_READ')); };
    image.src = url;
  });
}

function rotatedSize(width, height, rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  return normalized === 90 || normalized === 270 ? { width: height, height: width } : { width, height };
}

export async function preprocessImage(fileOrBlob, { rotation = 0, grayscale = true, contrast = 1.25, maxDimension = MAX_OCR_DIMENSION } = {}) {
  const image = await loadImageSource(fileOrBlob);
  const sourceWidth = image.width || image.naturalWidth;
  const sourceHeight = image.height || image.naturalHeight;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const size = rotatedSize(width, height, rotation);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw appError('IMAGE_PROCESS');
  context.save();
  context.translate(size.width / 2, size.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
  image.close?.();

  if (grayscale || contrast !== 1) {
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = data.data;
    const factor = Math.max(0.5, Math.min(2.5, Number(contrast) || 1));
    for (let index = 0; index < pixels.length; index += 4) {
      let red = pixels[index];
      let green = pixels[index + 1];
      let blue = pixels[index + 2];
      if (grayscale) {
        const gray = red * 0.299 + green * 0.587 + blue * 0.114;
        red = green = blue = gray;
      }
      pixels[index] = Math.max(0, Math.min(255, (red - 128) * factor + 128));
      pixels[index + 1] = Math.max(0, Math.min(255, (green - 128) * factor + 128));
      pixels[index + 2] = Math.max(0, Math.min(255, (blue - 128) * factor + 128));
    }
    context.putImageData(data, 0, 0);
  }
  return canvas;
}

export function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(appError('IMAGE_EXPORT')), type, quality);
  });
}
