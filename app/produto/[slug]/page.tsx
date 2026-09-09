import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { SITE_URL } from '@/lib/siteConfig';
import { Product } from '@/app/types';
import { resolveBrand } from '@/lib/productBrand';
import { CATEGORY_ROUTES } from '@/lib/categoryRoutes';
import ProductDetailClient from './ProductDetailClient';

export const revalidate = 300;

const PRODUCT_COLUMNS = 'id, name, slug, price, original_price, sale_price, on_sale, image_url, gallery_urls, category, product_type, stock, collection, collection_name, is_preorder, description, brand';
const RELATED_LIMIT = 10;

async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Product;
}

// Relevância em 3 níveis, só completando com o próximo quando o anterior não
// preenche o limite: mesma coleção primeiro (é o critério mais específico —
// dois produtos da mesma coleção são o "relacionado" mais óbvio), depois
// mesmo tipo de produto (ETB, Deck, Booster...), e só por último a categoria
// inteira (comportamento antigo), como complemento genérico.
async function getRelatedProducts(product: Product, excludeId: number): Promise<Product[]> {
  const results: Product[] = [];
  const seenIds = new Set<number>([excludeId]);

  async function fetchTier(applyFilter: (q: any) => any) {
    const remaining = RELATED_LIMIT - results.length;
    if (remaining <= 0) return;

    let query = supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('is_preorder', false)
      .gt('stock', 0);
    query = applyFilter(query);
    query = query.not('id', 'in', `(${Array.from(seenIds).join(',')})`);

    const { data } = await query.limit(remaining);
    (data || []).forEach((p: any) => {
      seenIds.add(p.id);
      results.push(p as Product);
    });
  }

  if (product.collection) {
    await fetchTier((q) => q.eq('collection', product.collection));
  }
  if (product.product_type) {
    await fetchTier((q) => q.eq('product_type', product.product_type));
  }
  if (product.category) {
    await fetchTier((q) => q.eq('category', product.category));
  }

  return results;
}

export async function generateStaticParams() {
  try {
    const { data, error } = await supabase.from('products').select('slug').not('slug', 'is', null);
    if (error || !data) return [];
    return data.map((p) => ({ slug: p.slug as string }));
  } catch {
    // Coluna slug ainda não existe no banco (migração não rodada) — build não quebra.
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Produto não encontrado — Videra Store' };
  }

  const price = product.on_sale && product.sale_price ? product.sale_price : product.price;
  const priceFormatted = `R$ ${price.toFixed(2).replace('.', ',')}`;
  const title = `${product.name} — Videra Store`;
  const description = `${product.name} por ${priceFormatted}. Compre online e retire em Manaus.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/produto/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/produto/${slug}`,
      siteName: 'Videra Store',
      images: product.image_url ? [{ url: product.image_url }] : undefined,
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product, product.id);
  const price = product.on_sale && product.sale_price ? product.sale_price : product.price;
  const brandName = resolveBrand(product);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url ? [product.image_url] : undefined,
    description: product.description || `${product.name} — Videra Store`,
    sku: String(product.id),
    // Só inclui brand quando a marca é conhecida (coluna preenchida no admin ou
    // categoria com fabricante certo). Marca errada (ex.: a loja como marca de um
    // produto de terceiro) reprova no Google Merchant Center — melhor omitir.
    ...(brandName ? { brand: { '@type': 'Brand', name: brandName } } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/produto/${slug}`,
      priceCurrency: 'BRL',
      price: price.toFixed(2),
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Videra Store',
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      ...(product.category && CATEGORY_ROUTES[product.category]
        ? [{
            '@type': 'ListItem',
            position: 2,
            name: CATEGORY_ROUTES[product.category].label,
            item: `${SITE_URL}${categoryPath(product.category)}`,
          }]
        : []),
      {
        '@type': 'ListItem',
        position: product.category && CATEGORY_ROUTES[product.category] ? 3 : 2,
        name: product.name,
        item: `${SITE_URL}/produto/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} brandName={brandName} />
    </>
  );
}

function categoryPath(category: string): string {
  return CATEGORY_ROUTES[category]?.path || '/';
}
