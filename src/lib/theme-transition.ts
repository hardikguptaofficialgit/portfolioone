const THEME_PIXEL_DURATION_MS = 720;
const THEME_PIXEL_FRAMES = 20;

type ThemeOrigin = { x: number; y: number };

type ViewTransition = { finished: Promise<void> };

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => ViewTransition;
};

let themeTransitioning = false;

function pixelHash(x: number, y: number) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function pixelGrid() {
  const width = Math.max(window.innerWidth, 1);
  const height = Math.max(window.innerHeight, 1);
  const tile = width < 720 ? 12 : 10;
  const cols = Math.max(24, Math.min(64, Math.round(width / tile)));
  const rows = Math.max(16, Math.min(40, Math.round(cols * (height / width))));
  return { cols, rows };
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function buildPixelSprite(origin: ThemeOrigin, cols: number, rows: number, frames: number) {
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows * frames;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return '';

  const image = context.createImageData(cols, rows * frames);
  const data = image.data;
  const originX = origin.x / Math.max(window.innerWidth, 1);
  const originY = origin.y / Math.max(window.innerHeight, 1);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const nx = (x + 0.5) / cols;
      const ny = (y + 0.5) / rows;
      const distance = Math.hypot(nx - originX, ny - originY);
      const threshold = Math.min(0.985, distance * 0.58 + pixelHash(x, y) * 0.42);

      for (let frame = 0; frame < frames; frame += 1) {
        const progress = frames === 1 ? 1 : frame / (frames - 1);
        const index = ((frame * rows + y) * cols + x) * 4;
        data[index] = 255;
        data[index + 1] = 255;
        data[index + 2] = 255;
        data[index + 3] = threshold <= progress ? 255 : 0;
      }
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function transitionPortfolioTheme(
  nextDarkMode: boolean,
  applyTheme: () => void,
  origin?: ThemeOrigin,
) {
  if (typeof document === 'undefined' || themeTransitioning) {
    applyTheme();
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startViewTransition = (document as DocumentWithViewTransition).startViewTransition;

  if (reducedMotion || !startViewTransition) {
    applyTheme();
    return;
  }

  const root = document.documentElement;
  const { cols, rows } = pixelGrid();
  const source = origin ?? { x: window.innerWidth - 72, y: 36 };
  await nextFrame();
  const sprite = buildPixelSprite(source, cols, rows, THEME_PIXEL_FRAMES);
  if (!sprite) {
    applyTheme();
    return;
  }

  themeTransitioning = true;
  root.style.setProperty('--theme-transition-duration', `${THEME_PIXEL_DURATION_MS}ms`);
  root.style.setProperty('--theme-pixel-sprite', `url("${sprite}")`);
  root.style.setProperty('--theme-pixel-frames', String(THEME_PIXEL_FRAMES));
  root.style.setProperty('--theme-pixel-steps', String(Math.max(1, THEME_PIXEL_FRAMES - 1)));
  root.classList.add('theme-pixelating');

  try {
    await startViewTransition.call(document, applyTheme).finished;
  } catch {
    applyTheme();
  } finally {
    root.classList.remove('theme-pixelating');
    root.style.removeProperty('--theme-pixel-sprite');
    root.style.removeProperty('--theme-pixel-frames');
    root.style.removeProperty('--theme-pixel-steps');
    themeTransitioning = false;
  }
}
