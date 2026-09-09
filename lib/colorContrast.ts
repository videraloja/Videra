// lib/colorContrast.ts
// Checagem de contraste WCAG — usada onde uma cor de destaque do tema
// (colors.primary, etc.) só pode aparecer sobre um fundo se realmente for
// legível ali. Sem isso, um tema com primary escuro sobre background escuro
// (ex.: o tema roxo) produz texto invisível — foi o que aconteceu com o
// "Ver mais" antes de existir essa checagem.

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Razão de contraste WCAG entre duas cores hex. Retorna null se alguma cor
// não for um hex válido (ex.: 'transparent', uma var CSS não resolvida).
export function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Devolve `preferred` só se ela realmente for legível contra `background`
// (contraste >= minRatio, 4.5:1 é o mínimo WCAG AA pra texto normal);
// senão cai em `fallback` (que deve ser uma cor que o próprio tema já
// garante legível, tipicamente colors.text).
export function accessibleColor(preferred: string, fallback: string, background: string, minRatio = 4.5): string {
  const ratio = contrastRatio(preferred, background);
  if (ratio !== null && ratio >= minRatio) return preferred;
  return fallback;
}
