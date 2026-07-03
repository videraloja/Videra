// app/promocao/[slug]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { PromotionalPage } from '@/lib/promotionalPagesService';
import { Product } from '@/app/types';
import Header from '@/app/components/Header';
import ProductCard from '@/app/components/ProductCard';
import { useCartContext } from '@/app/contexts/CartContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePageTheme } from '@/app/contexts/PageThemeContext';

export default function PromotionalDisplayPage() {
  const [page, setPage] = useState<PromotionalPage | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { addToCart } = useCartContext();
  const { colors, getCategoryConfig } = useThemeColors();
  const { setPageTheme, clearPageTheme } = usePageTheme();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const PROMO_PAGE_ID = '__PROMOTIONAL_PAGE__'; // ID especial para páginas de promoção
    const controller = new AbortController();

    const loadPageData = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        // 1. Fetch a página promocional pelo slug
        const { data: pageData, error: pageError } = await supabase
          .from('promotional_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .abortSignal(controller.signal)
          .single();

        if (pageError || !pageData) {          
          if (pageError && pageError.name !== 'AbortError' && !(pageError.message && pageError.message.includes('AbortError'))) {
            console.error('Página promocional não encontrada ou inativa:', pageError);
          }
          setPage(null);
          setProducts([]);
          clearPageTheme(PROMO_PAGE_ID); // Limpa o tema da página se não encontrar
          return;
        }
        setPage(pageData);
        setPageTheme(PROMO_PAGE_ID, pageData.theme_id); // Define o tema da página

        // 2. Construir a query de produtos com base nos filtros
        let query = supabase.from('products').select('*');

        const filters = pageData.filters || {};
        const productIds = pageData.product_ids || [];

        // Lógica de filtro
        if (productIds.length > 0) {
          query = query.in('id', productIds);
        } else {
          if (filters.category) {
            query = query.eq('category', filters.category);
          }
          if (filters.collection) {
            query = query.eq('collection', filters.collection);
          }
          if (filters.product_type) {
            query = query.eq('product_type', filters.product_type);
          }
          if (filters.max_price) {
            query = query.lte('price', filters.max_price);
          }
          if (filters.on_sale) {
            query = query.eq('on_sale', true);
          }
          if (filters.in_stock) {
            query = query.gt('stock', 0);
          }
          // ✅ CORREÇÃO: Aplica o filtro de pré-venda
          if (filters.is_preorder) {
            query = query.eq('is_preorder', true);
          } else {
            // Garante que produtos de pré-venda não apareçam em promoções normais
            query = query.eq('is_preorder', false);
          }
        }

        const { data: productData, error: productError } = await query.order('name').abortSignal(controller.signal);

        if (productError) throw productError;
        
        setProducts(productData || []);

      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao carregar dados da página:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPageData();

    // Limpar o tema ao sair da página
    return () => {
      controller.abort();
      clearPageTheme(PROMO_PAGE_ID);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <div className="global-loading-container" style={{ padding: '80px 20px' }}>
        <div className="global-spinner"></div>
        <p className="global-loading-text">Carregando promoção...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <>
        <Header hideSearch />
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h2>Promoção não encontrada</h2>
          <p>Esta página de promoção pode ter sido desativada ou não existe.</p>
        </div>
      </>
    );
  }

  const imageUrl = isMobile && page.hero_image_mobile_url
    ? page.hero_image_mobile_url 
    : page.hero_image_url;

  // Define o aspect ratio baseado no dispositivo para comportar as imagens
  const heroAspectRatio = isMobile ? '750 / 600' : '1920 / 600';

  return (
    <>
      <Header hideSearch />

      {/* Seção Hero da Página Promocional */}
      {imageUrl && (
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: heroAspectRatio,
          maxHeight: '600px', // Limita a altura máxima em telas muito largas
          marginBottom: '40px',
          background: `url(${imageUrl}) no-repeat center center`,
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'white',
          textShadow: '0 2px 8px rgba(0,0,0,0.7)'
        }}>
          {page.show_overlay !== false && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)'
            }} />
          )}
          <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: '800', margin: 0 }}>
              {page.title}
            </h1>
            {page.description && (
              <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '700px', margin: '16px auto 0' }}>
                {page.description}
              </p>
            )}
          </div>
        </div>
      )}

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 40px' }}>
        {products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                categoryConfig={getCategoryConfig(product.category || 'default')}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h3>Nenhum produto encontrado para esta promoção.</h3>
          </div>
        )}
      </main>
    </>
  );
}