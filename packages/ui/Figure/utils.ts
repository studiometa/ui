/**
 * Load the given image.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.src = src;
  });
}

/**
 * Normalize a size to the given step.
 */
export function normalizeSize(size:number, step:number): number {
  return Math.ceil(size / step) * step;
}
