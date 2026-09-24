export interface ExtractedColors {
  primary: string;     // Hex color e.g. #3b82f6
  secondary: string;   // Hex color e.g. #8b5cf6
  darkAmbient: string; // RGB string for background tint
  glow: string;        // Soft glow rgba string
}

// Default luxury midnight palette
export const DEFAULT_COLORS: ExtractedColors = {
  primary: '#6366f1',
  secondary: '#a855f7',
  darkAmbient: '10, 12, 20',
  glow: 'rgba(99, 102, 241, 0.25)',
};

/**
 * Extracts dominant palette from an image using off-screen HTML5 Canvas
 */
export async function extractDominantColors(imageUrl: string): Promise<ExtractedColors> {
  if (!imageUrl) return DEFAULT_COLORS;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(DEFAULT_COLORS);

        // Downsample image for rapid performance (32x32 pixels)
        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);

        const imgData = ctx.getImageData(0, 0, 32, 32).data;
        let rTotal = 0;
        let gTotal = 0;
        let bTotal = 0;
        let count = 0;

        const colorBuckets: { r: number; g: number; b: number; score: number }[] = [];

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue; // ignore transparent
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          // Avoid pure black or pure white for dominant color
          if (brightness < 20 || brightness > 240) continue;

          // Saturation
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;

          rTotal += r;
          gTotal += g;
          bTotal += b;
          count++;

          colorBuckets.push({
            r,
            g,
            b,
            score: saturation * 1.5 + (brightness > 60 && brightness < 180 ? 1 : 0),
          });
        }

        if (count === 0 || colorBuckets.length === 0) {
          return resolve(DEFAULT_COLORS);
        }

        // Sort by vibrant score
        colorBuckets.sort((a, b) => b.score - a.score);
        const top = colorBuckets[0];
        const secondaryCandidate = colorBuckets[Math.min(5, colorBuckets.length - 1)];

        const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
        const primary = `#${toHex(top.r)}${toHex(top.g)}${toHex(top.b)}`;
        const secondary = `#${toHex(secondaryCandidate.r)}${toHex(secondaryCandidate.g)}${toHex(secondaryCandidate.b)}`;

        // Deep dark ambient background derived from primary
        const darkR = Math.max(8, Math.min(22, Math.round(top.r * 0.12)));
        const darkG = Math.max(9, Math.min(24, Math.round(top.g * 0.12)));
        const darkB = Math.max(14, Math.min(32, Math.round(top.b * 0.14)));
        const darkAmbient = `${darkR}, ${darkG}, ${darkB}`;

        const glow = `rgba(${top.r}, ${top.g}, ${top.b}, 0.22)`;

        resolve({ primary, secondary, darkAmbient, glow });
      } catch (err) {
        // In case of CORS or canvas taint, return graceful default
        resolve(DEFAULT_COLORS);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_COLORS);
    };
  });
}

/**
 * Injects extracted dynamic environment colors into document CSS variables
 */
export function applyDynamicThemeVariables(colors: ExtractedColors) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--aura-primary', colors.primary);
  root.style.setProperty('--aura-secondary', colors.secondary);
  root.style.setProperty('--aura-dark-ambient', colors.darkAmbient);
  root.style.setProperty('--aura-glow', colors.glow);
}
