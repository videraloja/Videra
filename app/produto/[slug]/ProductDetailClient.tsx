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
import { carouselService } from '@/app/lib/carouselService';
import { CarouselConfig } from '@/app/types';
import { getCollectionName } from '@/lib/collections';

const CATEGORY_ROUTES: Record<string, { path: string; label: string }> = {
  pokemon: { path: '/pokemontcg', label: 'Pokémon TCG' },
  'board-games': { path: '/jogosdetabuleiro', label: 'Jogos de Tabuleiro' },
  acessorios: { path: '/acessorios', label: 'Acessórios' },
  'hot-wheels': { path: '/hotwheels', label: 'Hot Wheels' },
};

// Fallback usado enquanto a config de aparência não chegou do banco (ou pra quando
// ainda não existe uma linha salva) — mesmos valores que já estavam hardcoded aqui.
// Os PRODUTOS do carrossel nunca vêm dessa config: são sempre calculados no server
// component pela categoria do produto atual (getRelatedProducts), então trocar de
// produto sempre mostra os relacionados certos, independente do que está salvo aqui.
const RELATED_CAROUSEL_FALLBACK = (colors: { text: string; primary: string }): CarouselConfig => ({
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
  id: 'produto-relacionados-fallback', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
});

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  brandName?: string;
}

export default function ProductDetailClient({ product, relatedProducts, brandName }: ProductDetailClientProps) {
  const { colors, getCategoryConfig, applyDetailStyles, getDetailStyles, getShadow } = useThemeColors();
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselConfigs, setCarouselConfigs] = useState<CarouselConfig[]>([]);

  useEffect(() => {
    carouselService.getCarouselConfigs('produto').then(setCarouselConfigs);
  }, []);

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
  const detailStyles = getDetailStyles();
  const categoryRoute = currentProduct.category ? CATEGORY_ROUTES[currentProduct.category] : undefined;
  const isPreorder = (currentProduct as any).is_preorder;
  const backHref = categoryRoute?.path || '/';

  // Capa sempre em primeiro — é o que alimenta vitrine/feed/carrinho/og:image, e
  // aqui também é sempre a primeira imagem mostrada. As extras (gallery_urls) só
  // aparecem como miniaturas; produto sem elas fica idêntico a antes (sem galeria).
  const galleryExtras = currentProduct.gallery_urls || [];
  const images = [currentProduct.image_url, ...galleryExtras].filter(Boolean) as string[];
  const hasGallery = galleryExtras.length > 0;
  const mainImage = images[selectedImageIndex] || currentProduct.image_url || '/placeholder.png';

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
    if (currentStock === 0) return detailStyles.addToCart.disabledBackgroundColor;
    return detailStyles.addToCart.backgroundColor;
  };

  const getButtonHoverColor = () => {
    if (currentStock === 0) return detailStyles.addToCart.disabledBackgroundColor;
    return detailStyles.addToCart.hoverBackgroundColor;
  };

  const relatedAvailable = syncedRelated.filter(p => p.stock > 0);
  const relatedConfig = carouselConfigs.find(c => c.carousel_type === 'all') || RELATED_CAROUSEL_FALLBACK(colors);

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.text }}>
      <Header />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* Voltar + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Link
            href={backHref}
            aria-label="Voltar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: detailStyles.backButton.size,
              height: detailStyles.backButton.size,
              minWidth: detailStyles.backButton.size,
              borderRadius: '50%',
              background: detailStyles.backButton.backgroundColor,
              color: detailStyles.backButton.textColor,
              textDecoration: 'none',
              boxShadow: getShadow('small'),
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            ←
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '14px', color: colors.text, opacity: 0.75 }}>
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
        </div>

        {/* Detalhe do produto */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 480px) 1fr',
          gap: '40px',
          marginBottom: '48px',
        }}
        className="product-detail-grid"
        >
          <div>
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'transparent',
              boxShadow: getShadow('medium'),
            }}>
              {currentProduct.on_sale && originalPrice && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  zIndex: 2,
                  background: '#dc2626',
                  color: '#ffffff',
                }}>
                  🔥 {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
                </div>
              )}
              <Image
                src={mainImage}
                alt={currentProduct.name}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>

            {/* Galeria — só existe quando há imagens extras. Sem elas, nada aqui. */}
            {hasGallery && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                {images.map((url, index) => (
                  <button
                    key={url + index}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Ver imagem ${index + 1}`}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      padding: 0,
                      background: 'none',
                      border: `2px solid ${index === selectedImageIndex ? detailStyles.galleryThumbnailActiveBorderColor : detailStyles.galleryThumbnailBorderColor}`,
                      flexShrink: 0,
                    }}
                  >
                    <Image src={url} alt={`${currentProduct.name} ${index + 1}`} fill sizes="64px" style={{ objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {brandName && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  ...applyDetailStyles('brandBadge', {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    width: 'fit-content',
                  })
                }}>
                  ✓ {brandName}
                </span>
              </div>
            )}

            <h1 style={{
              ...applyDetailStyles('productName', { lineHeight: '1.3', marginBottom: '8px' }),
              fontSize: `clamp(1.5rem, 3vw, ${detailStyles.productName.fontSize || '36px'})`,
            }}>
              {currentProduct.name}
            </h1>

            {currentProduct.collection && (
              <p style={{ ...applyDetailStyles('collectionName', { marginBottom: '16px' }) }}>
                {getCollectionName(currentProduct.collection)}
              </p>
            )}

            <div style={{ marginBottom: '20px' }}>
              {currentProduct.on_sale && originalPrice ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={applyDetailStyles('originalPrice', {})}>
                    R$ {originalPrice.toFixed(2)}
                  </span>
                  <span style={applyDetailStyles('salePrice', {})}>
                    R$ {displayPrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span style={applyDetailStyles('price', {})}>
                  R$ {displayPrice.toFixed(2)}
                </span>
              )}
            </div>

            {isPreorder ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px',
                background: detailStyles.preorderBadge.backgroundColor,
                color: detailStyles.preorderBadge.textColor,
                border: `1px solid ${detailStyles.preorderBadge.borderColor}`,
                padding: '10px 16px', borderRadius: '10px', width: 'fit-content'
              }}>
                <span style={{ fontSize: '16px' }}>📦</span>
                <span style={{ fontSize: '15px', fontWeight: '600' }}>Pré-venda</span>
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', width: 'fit-content' }}>
                <span style={{ fontSize: '16px' }}>{stockInfo.icon}</span>
                <span style={applyDetailStyles('stockInfo', {})}>
                  {stockInfo.text}
                </span>
              </div>
            )}

            {currentProduct.description && (
              <p style={applyDetailStyles('description', { lineHeight: '1.6', marginBottom: '24px' })}>
                {currentProduct.description}
              </p>
            )}

            <button
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              style={{
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
                color: detailStyles.addToCart.textColor,
                marginTop: 'auto',
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
            config={relatedConfig}
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
