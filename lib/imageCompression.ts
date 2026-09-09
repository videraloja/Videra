// lib/imageCompression.ts
// Redimensiona e comprime imagens NO NAVEGADOR antes do upload pro Supabase
// Storage. O plano gratuito do Supabase não tem "Storage Image Transformations"
// (não redimensiona nada no servidor) e o Storage é limitado a 1GB — por isso
// o corte tem que acontecer aqui, antes do arquivo sair do navegador.
export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  skipped: boolean;
}

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 0.8;

export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  if (!file.type.startsWith('image/')) {
    return { file, originalSize, compressedSize: originalSize, skipped: true };
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const largerSide = Math.max(width, height);

  // Já está dentro do alvo — não reprocessa (evita perda de qualidade à toa e
  // trabalho de CPU desnecessário num arquivo que já está pequeno).
  if (largerSide <= MAX_DIMENSION) {
    bitmap.close();
    return { file, originalSize, compressedSize: originalSize, skipped: true };
  }

  const scale = MAX_DIMENSION / largerSide;
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Sem preencher o fundo antes de desenhar: o canvas 2D já nasce transparente,
  // então PNG com alpha continua transparente no WebP (WebP suporta alpha).
  // Preencher com branco/preto aqui é o erro clássico que "mata" a transparência.
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return { file, originalSize, compressedSize: originalSize, skipped: true };
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY);
  });

  if (!blob) {
    return { file, originalSize, compressedSize: originalSize, skipped: true };
  }

  const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';
  const compressedFile = new File([blob], newName, { type: 'image/webp' });

  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
    skipped: false
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
