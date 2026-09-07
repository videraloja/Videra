import { supabase } from '@/lib/supabaseClient';
import { SITE_URL } from '@/lib/siteConfig';
import { resolveBrand } from '@/lib/productBrand';
import { Product } from '@/app/types';

// Feed no formato RSS 2.0 + namespace g: (spec do Google Merchant Center),
// aceito também pelo catálogo de produtos do Meta.
//
// IMPORTANTE: um Route Handler (route.ts) com GET simples, sem usar nenhuma API
// dinâmica, é tratado como ESTÁTICO por padrão pelo Next.js — ele roda a consulta
// UMA VEZ no build e serve esse resultado congelado depois (era isso que estava
// fazendo o feed sair sempre vazio: a consulta falhou no build por causa da coluna
// `gtin` que ainda não existia, e o resultado vazio ficou congelado em cache).
// app/sitemap.ts nunca teve esse problema porque a convenção de arquivo de sitemap
// do Next.js já roda a cada requisição por padrão, sem precisar de config extra.
// force-dynamic replica esse comportamento aqui: consulta sempre fresca.
export const dynamic = 'force-dynamic';

const FEED_COLUMNS = 'id, name, slug, price, original_price, sale_price, on_sale, image_url, category, stock, description, brand, gtin, is_preorder';

const CATEGORY_LABELS: Record<string, string> = {
  pokemon: 'Pokémon TCG',
  'board-games': 'Jogos de Tabuleiro',
  acessorios: 'Acessórios',
  'hot-wheels': 'Hot Wheels',
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function availabilityFor(product: Pick<Product, 'stock' | 'is_preorder'>): string {
  if (product.is_preorder) return 'preorder';
  return product.stock > 0 ? 'in stock' : 'out of stock';
}

function itemXml(product: Product): string {
  const link = `${SITE_URL}/produto/${product.slug}`;
  const regularPrice = product.on_sale && product.original_price ? product.original_price : product.price;
  const brand = resolveBrand(product);

  const fields = [
    `<g:id>${xmlEscape(String(product.id))}</g:id>`,
    `<title>${xmlEscape(product.name)}</title>`,
    `<description>${xmlEscape(product.description || product.name)}</description>`,
    `<link>${xmlEscape(link)}</link>`,
    `<g:image_link>${xmlEscape(product.image_url || '')}</g:image_link>`,
    `<g:condition>new</g:condition>`,
    `<g:availability>${availabilityFor(product)}</g:availability>`,
    `<g:price>${regularPrice.toFixed(2)} BRL</g:price>`,
  ];

  if (product.on_sale && product.sale_price) {
    fields.push(`<g:sale_price>${product.sale_price.toFixed(2)} BRL</g:sale_price>`);
  }

  // Produtos industrializados sempre têm identificador de fabricante (GTIN
  // impresso na embalagem) — não usar identifier_exists:no aqui, isso é só
  // pra artesanato/sob encomenda/vintage e é violação de política declarar
  // errado. Sem brand/gtin preenchidos, os campos ficam simplesmente ausentes.
  if (product.gtin && product.gtin.trim()) {
    fields.push(`<g:gtin>${xmlEscape(product.gtin.trim())}</g:gtin>`);
  }
  if (brand) {
    fields.push(`<g:brand>${xmlEscape(brand)}</g:brand>`);
  }

  if (product.category && CATEGORY_LABELS[product.category]) {
    fields.push(`<g:product_type>${xmlEscape(CATEGORY_LABELS[product.category])}</g:product_type>`);
  }

  return `    <item>\n      ${fields.join('\n      ')}\n    </item>`;
}

export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select(FEED_COLUMNS)
    .not('slug', 'is', null);

  if (error) {
    // Sem isso, uma falha na consulta produzia um feed vazio sem nenhum rastro
    // nos logs — visível só no efeito (feed sem <item>), nunca na causa.
    console.error('Erro ao buscar produtos para o feed.xml:', error);
  }

  const products = (error || !data) ? [] : (data as Product[]);

  const itemsXml = products.map(itemXml).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Videra Store - Catálogo de Produtos</title>
    <link>${xmlEscape(SITE_URL)}</link>
    <description>Feed de produtos da Videra Store para Google Merchant Center e catálogo Meta.</description>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
