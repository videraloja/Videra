'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/app/components/Header';
import Carousel from '@/app/components/Carousel';
import { Product } from '@/app/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useStock } from '@/hooks/useStock';
import { useCartContext } from '@/app/contexts/CartContext';
import { useAvailableStock } from '@/hooks/useAvailableStock';
import { trackViewItem, trackAddToCart } from '@/lib/analytics';

const CATEGORY_ROUTES: Record<string, { path: string; label: string }> = {
  pokemon: { path: '/pokemontcg', label: 'Pokémon TCG' },
  'board-games': { path: '/jogosdetabuleiro', label: 'Jogos de Tabuleiro' },
  acessorios: { path: '/acessorios', label: 'Acessórios' },
  'hot-wheels': { path: '/hotwheels', label: 'Hot Wheels' },
};

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { colors, getCategoryConfig, getCardStyles, applyCardStyles, getShadow } = useThemeColors();
  const { stockLabel } = useStock();
  const { addToCart, isInCart, getItemQuantity } = useCartContext();
  const { syncedProducts } = useAvailableStock([product]);
  const { syncedProducts: syncedRelated } = useAvailableStock(relatedProducts);

  const currentProduct = syncedProducts[0] || product;

  useEffect(() => {
    const price = product.on_sale && product.sale_price ? product.sale_price : product.price;
    trackViewItem({ id: product.id, name: product.name, price, category: product.category });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isAdded, setIsAdded] = useState(false);
  const [quantityInCart, setQuantityInCart] = useState(0);
  const [currentStock, setCurrentStock] = useState(currentProduct.stock);

  useEffect(() => {
    const productId = String(currentProduct.id);

    const checkCartStatus = () => {
      const inCart = isInCart(productId);
      const quantity = getItemQuantity(productId);
      setIsAdded(inCart);
      setQuantityInCart(quantity);
      setCurrentStock(Math.max(currentProduct.stock - quantity, 0));
    };

    checkCartStatus();

    const handleCartUpdate = (e: CustomEvent) => {
      if (e.detail && String(e.detail.productId) === productId) checkCartStatus();
    };

    const handleCartCleared = () => {
      setIsAdded(false);
      setQuantityInCart(0);
      setCurrentStock(currentProduct.stock);
    };

    window.addEventListener('cartStateUpdated', handleCartUpdate as EventListener);
    window.addEventListener('cart-updated', checkCartStatus);
    window.addEventListener('storage', checkCartStatus);
    window.addEventListener('cartCleared', handleCartCleared);

    return () => {
      window.removeEventListener('cartStateUpdated', handleCartUpdate as EventListener);
      window.removeEventListener('cart-updated', checkCartStatus);
      window.removeEventListener('storage', checkCartStatus);
      window.removeEventListener('cartCleared', handleCartCleared);
    };
  }, [currentProduct.id, currentProduct.stock, isInCart, getItemQuantity]);

  const stockInfo = stockLabel(currentStock);
  const displayPrice = currentProduct.on_sale ? currentProduct.sale_price! : currentProduct.price;
  const originalPrice = currentProduct.on_sale ? currentProduct.original_price : undefined;
  const cardStyles = getCardStyles();
  const categoryRoute = currentProduct.category ? CATEGORY_ROUTES[currentProduct.category] : undefined;
  const isPreorder = (currentProduct as any).is_preorder;

  const handleAddToCart = () => {
    if (currentStock <= 0) return;
    addToCart(currentProduct);
    trackAddToCart({ id: currentProduct.id, name: currentProduct.name, price: displayPrice, category: currentProduct.category });
    setIsAdded(true);
    setQuantityInCart(prev => prev + 1);
    setCurrentStock(prev => Math.max(prev - 1, 0));
  };

  const getButtonContent = () => {
    if (isPreorder) return currentStock > 0 ? 'Reservar!' : 'Esgotado';
    if (currentStock === 0) return 'Esgotado';
    if (isAdded) return `✓ Adicionado (${quantityInCart})`;
    return 'Adicionar ao Carrinho';
  };

  const getButtonColor = () => {
    if (currentStock === 0) return cardStyles.addToCart.disabledBackgroundColor;
    return cardStyles.addToCart.backgroundColor;
  };

  const getButtonHoverColor = () => {
    if (currentStock === 0) return cardStyles.addToCart.disabledBackgroundColor;
    return cardStyles.addToCart.hoverBackgroundColor;
  };

  const relatedAvailable = syncedRelated.filter(p => p.stock > 0);

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.text }}>
      <Header />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '14px', color: colors.text, opacity: 0.75, marginBottom: '24px' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Início</Link>
          {categoryRoute && (
            <>
              <span>›</span>
              <Link href={categoryRoute.path} style={{ color: 'inherit', textDecoration: 'none' }}>{categoryRoute.label}</Link>
            </>
          )}
          <span>›</span>
          <span style={{ opacity: 0.6 }}>{currentProduct.name}</span>
        </nav>

        {/* Detalhe do produto */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 480px) 1fr',
          gap: '40px',
          marginBottom: '48px',
        }}
        className="product-detail-grid"
        >
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: '20px',
            overflow: 'hidden',
            background: cardStyles.imageOverlay,
            boxShadow: getShadow('medium'),
          }}>
            {currentProduct.on_sale && originalPrice && (
              <div style={{
                ...applyCardStyles('badgeDiscount', {
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  zIndex: 2,
                })
              }}>
                🔥 {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
              </div>
            )}
            <Image
              src={currentProduct.image_url || '/placeholder.png'}
              alt={currentProduct.name}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{
              // Aplica o tema primeiro (pega a COR), depois sobrescreve o tamanho:
              // applyCardStyles usa o fontSize do tema pensado pro card pequeno,
              // que aqui precisa ser bem maior por ser o título da página.
              ...applyCardStyles('productName', { lineHeight: '1.3', marginBottom: '16px' }),
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: '700',
            }}>
              {currentProduct.name}
            </h1>

            <div style={{ marginBottom: '20px' }}>
              {currentProduct.on_sale && originalPrice ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ ...applyCardStyles('originalPrice', {}), fontSize: '18px', fontWeight: '500' }}>
                    R$ {originalPrice.toFixed(2)}
                  </span>
                  <span style={{ ...applyCardStyles('salePrice', {}), fontSize: '32px', fontWeight: '700' }}>
                    R$ {displayPrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span style={{ ...applyCardStyles('price', {}), fontSize: '32px', fontWeight: '700' }}>
                  R$ {displayPrice.toFixed(2)}
                </span>
              )}
            </div>

            {isPreorder ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', background: '#f3e8ff', color: '#7c3aed', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e9d5ff', width: 'fit-content' }}>
                <span style={{ fontSize: '16px' }}>📦</span>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Pré-venda</span>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', width: 'fit-content' }}>
                <span style={{ fontSize: '16px' }}>{stockInfo.icon}</span>
                <span style={{ ...applyCardStyles('stockInfo', {}), fontSize: '15px', fontWeight: '500' }}>
                  {stockInfo.text}
                </span>
              </div>
            )}

            {currentProduct.description && (
              <p style={{ ...applyCardStyles('description', { lineHeight: '1.6', marginBottom: '24px' }), fontSize: '15px' }}>
                {currentProduct.description}
              </p>
            )}

            <button
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              style={{
                ...applyCardStyles('addToCart', {
                  width: '100%',
                  maxWidth: '360px',
                  height: '52px',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: currentStock === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: getButtonColor(),
                  marginTop: 'auto',
                })
              }}
              onMouseEnter={(e) => {
                if (currentStock > 0) e.currentTarget.style.background = getButtonHoverColor();
              }}
              onMouseLeave={(e) => {
                if (currentStock > 0) e.currentTarget.style.background = getButtonColor();
              }}
            >
              {getButtonContent()}
            </button>
          </div>
        </div>

        {relatedAvailable.length > 0 && (
          <Carousel
            title="Produtos Relacionados"
            products={relatedAvailable}
            config={{
              page_slug: 'produto', carousel_type: 'all',
              title_text_color: colors.text, title_font_size: 24, title_font_weight: '700',
              badge_bg_color: colors.primary, badge_text_color: '#ffffff',
              arrow_bg_color: colors.primary, arrow_text_color: '#ffffff', arrow_hover_bg_color: colors.primary, arrow_hover_text_color: '#ffffff',
              show_arrows: true, show_badges: true, items_per_view: 4, auto_scroll: false, auto_scroll_interval: 5000,
              view_all_title_color: colors.text, view_all_title_font_size: 28, view_all_title_font_weight: '700',
              view_all_badge_bg_color: colors.primary, view_all_badge_text_color: '#ffffff',
              view_all_button_bg_color: 'transparent', view_all_button_text_color: colors.primary, view_all_button_border_color: colors.primary,
              view_all_button_hover_bg_color: colors.primary, view_all_button_hover_text_color: '#ffffff', view_all_button_hover_border_color: colors.primary,
              view_all_back_button_bg_color: 'transparent', view_all_back_button_text_color: colors.primary,
              view_all_back_button_hover_bg_color: colors.primary, view_all_back_button_hover_text_color: '#ffffff',
              id: 'produto-relacionados-temp', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            }}
            categoryConfig={getCategoryConfig(currentProduct.category || 'default')}
            onAddToCart={addToCart}
          />
        )}
      </main>

      <style jsx>{`
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
