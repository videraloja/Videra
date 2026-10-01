// lib/imageLoader.ts
// Loader do next/image. Com images.loader = 'custom' no next.config, NENHUMA
// imagem passa por /_next/image — que é o otimizador da Vercel, cuja cota do
// plano Hobby estourou e começou a devolver 402.
//
// Foto de produto (Supabase Storage) vai pro wsrv.nl, que redimensiona e
// entrega em WebP de graça. Qualquer outra coisa (logo e ícone de /public,
// placeholder) é devolvida como está: são arquivos pequenos, servidos pela
// própria Vercel, e mandar pro wsrv quebraria em localhost — ele não enxerga
// a máquina de desenvolvimento.

const SUPABASE_HOST = 'synudoglvwbogfzbcdii.supabase.co';

// Mesma conversão, para imagem aplicada por CSS (background-image), que não
// passa pelo next/image e por isso não chega no loader abaixo.
export function wsrvUrl(src: string | undefined, width: number, quality = 75): string | undefined {
  if (!src || !src.includes(SUPABASE_HOST)) return src;
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
    output: 'webp',
  });
  return `https://wsrv.nl/?${params.toString()}`;
}

export default function wsrvImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.includes(SUPABASE_HOST)) return src;

  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality ?? 75),
    output: 'webp',
  });

  return `https://wsrv.nl/?${params.toString()}`;
}
