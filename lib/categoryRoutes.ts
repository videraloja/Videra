// Mapeamento único category -> rota da página de categoria. Usado pela página
// de produto tanto pro link/breadcrumb estruturado quanto pra resolver de qual
// página ela "herda" o tema (ver ProductDetailClient.tsx).
export const CATEGORY_ROUTES: Record<string, { path: string; label: string }> = {
  pokemon: { path: '/pokemontcg', label: 'Pokémon TCG' },
  'board-games': { path: '/jogosdetabuleiro', label: 'Jogos de Tabuleiro' },
  acessorios: { path: '/acessorios', label: 'Acessórios' },
  'hot-wheels': { path: '/hotwheels', label: 'Hot Wheels' },
};
