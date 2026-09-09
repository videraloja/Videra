import { Product } from '@/app/types';

// Só categorias em que o fabricante é conhecido com certeza. Usado tanto no
// JSON-LD (app/produto/[slug]/page.tsx) quanto no feed de produtos (app/feed.xml).
const CATEGORY_BRANDS: Record<string, string> = {
  // Copag, não "Pokémon": todo Pokémon TCG vendido aqui é da edição nacional
  // da Copag. Um importado de outra marca se resolve preenchendo a coluna
  // `brand` daquele produto no admin, que tem prioridade sobre este mapa.
  pokemon: 'Copag',
  'hot-wheels': 'Hot Wheels',
};

export function resolveBrand(product: Pick<Product, 'brand' | 'category'>): string | undefined {
  // A coluna `brand` do produto (preenchida manualmente no admin) tem prioridade
  // sobre o mapeamento por categoria. Sem nenhuma das duas, retorna undefined —
  // acessórios de terceiros e jogos de tabuleiro variados não têm fabricante certo
  // só pela categoria, e declarar a Videra como marca deles seria informação errada.
  if (product.brand && product.brand.trim()) return product.brand.trim();
  return (product.category && CATEGORY_BRANDS[product.category]) || undefined;
}
