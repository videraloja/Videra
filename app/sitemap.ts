import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { SITE_URL } from '@/lib/siteConfig';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/pokemontcg`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/acessorios`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/hotwheels`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/jogosdetabuleiro`, changeFrequency: 'daily', priority: 0.8 },
  ];

  const { data: promotionalPages } = await supabase
    .from('promotional_pages')
    .select('slug, created_at')
    .eq('is_active', true);

  const promoRoutes: MetadataRoute.Sitemap = (promotionalPages || []).map((page) => ({
    url: `${SITE_URL}/promocao/${page.slug}`,
    lastModified: page.created_at ? new Date(page.created_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .not('slug', 'is', null)
      .eq('is_preorder', false)
      .gt('stock', 0);

    productRoutes = (products || []).map((product) => ({
      url: `${SITE_URL}/produto/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch {
    // Coluna slug ainda não existe no banco (migração não rodada) — sitemap não quebra.
  }

  return [...staticRoutes, ...promoRoutes, ...productRoutes];
}
