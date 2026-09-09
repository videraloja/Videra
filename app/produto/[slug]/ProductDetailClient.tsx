'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { CATEGORY_ROUTES } from '@/lib/categoryRoutes';
import { usePageTheme } from '@/app/contexts/PageThemeContext';

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
  const { setPageIdOverride } = usePageTheme();
  const { stockLabel } = useStock();
  const { addToCart, isInCart, getItemQuantity } = useCartContext();
  // [product] cru recriava um array novo a cada render, quebrando a comparação
  // de dependência do useEffect dentro de useAvailableStock e disparando um
  // loop de fetch a cada ~200-300ms (achado ao medir o polling de tema — ver
  // resposta sobre o item 1). useMemo trava a referência ao id do produto.
  const productArray = useMemo(() => [product], [product.id]);
  const { syncedProducts } = useAvailableStock(productArray);
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
  const [descExpanded, setDescExpanded] = useState(false);
  const [descTruncated, setDescTruncated] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  // Estado sólido/translúcido da barra fixa mobile (Problema 4) — troca depois
  // de ~100px de rolagem, com uma pequena folga pra não "piscar" no limiar.
  const [isBarSolid, setIsBarSolid] = useState(false);
  useEffect(() => {
    // O <body> do site tem overflow-x:hidden, o que força overflow-y:auto
    // (regra do CSS) — ele vira o próprio contêiner de rolagem, não a
    // window/viewport. Por isso escuta no body (com fallback pra window,
    // caso esse comportamento mude), em vez de só window.scrollY.
    const getScrollTop = () => Math.max(document.body.scrollTop, document.documentElement.scrollTop, window.scrollY);
    const handleScroll = () => setIsBarSolid(getScrollTop() > 100);
    handleScroll();
    document.body.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.body.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Mede se as 2 linhas colapsadas cortam o texto de verdade — só aí mostra
  // "Ver mais". Roda com a descrição ainda colapsada (descExpanded começa
  // false), então clientHeight reflete o clamp de 2 linhas nesse momento.
  useEffect(() => {
    const el = descRef.current;
    if (!el) { setDescTruncated(false); return; }
    const check = () => setDescTruncated(el.scrollHeight > el.clientHeight + 1);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [currentProduct.description]);
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

  // A página de produto não tem PAGE_ID próprio, então sem isso ela sempre caía
  // no tema global — um produto de Jogos de Tabuleiro tem que parecer que está
  // em /jogosdetabuleiro pra fins de tema (Header, botões, carrossel incluídos,
  // já que todos leem do mesmo PageThemeContext). Sem categoria reconhecida,
  // não define override nenhum e cai no tema global, como sempre foi.
  // useLayoutEffect (não useEffect): precisa aplicar o override ANTES do
  // primeiro efeito passivo do PageThemeContext rodar, senão ele calcula
  // currentPageId uma vez sem o override (mostra o tema global por um
  // instante) e só corrige depois — ficando visível como um flash.
  useLayoutEffect(() => {
    setPageIdOverride(categoryRoute?.path || null);
    return () => setPageIdOverride(null);
  }, [categoryRoute?.path, setPageIdOverride]);

  const isPreorder = (currentProduct as any).is_preorder;
  const backHref = categoryRoute?.path || '/';
  // Nome digitado no admin (com acento/maiúsculas) tem prioridade; a lista fixa de
  // lib/collections só cobre produtos antigos que nunca tiveram collection_name salvo.
  const collectionDisplayName = currentProduct.collection_name
    || (currentProduct.collection ? getCollectionName(currentProduct.collection) : undefined);

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

  // Não é a mensagem de pedido do carrinho — é só um "compartilhar produto"
  // que abre o WhatsApp com o nome e o link da página, sem número fixo (o
  // cliente escolhe pra quem manda). Calculado num efeito, não inline no
  // render, pra garantir window.location.href definitivamente pronto.
  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => {
    const text = `${currentProduct.name} — ${window.location.href}`;
    setShareUrl(`https://wa.me/?text=${encodeURIComponent(text)}`);
  }, [currentProduct.name]);

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.text, display: 'flex', flexDirection: 'column' }}>
      {/* Barra fixa — só mobile (ver CSS .pd-mobile-bar). Some acima de tudo,
          translúcida sobre a imagem no topo e sólida (cor do tema da
          categoria) depois de rolar — ver handleScroll/isBarSolid. */}
      <div
        className="pd-mobile-bar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: isBarSolid ? colors.background : 'rgba(0,0,0,0.32)',
          boxShadow: isBarSolid ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
          transition: 'background 0.25s ease, box-shadow 0.25s ease',
        }}
      >
        <Link
          href={backHref}
          aria-label="Voltar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '50%',
            background: isBarSolid ? 'transparent' : 'rgba(0,0,0,0.35)',
            color: isBarSolid ? colors.text : '#ffffff',
            textDecoration: 'none', fontSize: '20px', flexShrink: 0,
          }}
        >
          ←
        </Link>
        <Link
          href="/"
          aria-label="Buscar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '50%',
            background: isBarSolid ? 'transparent' : 'rgba(0,0,0,0.35)',
            color: isBarSolid ? colors.text : '#ffffff',
            textDecoration: 'none', fontSize: '18px', flexShrink: 0,
          }}
        >
          🔍
        </Link>
        <a
          href={shareUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar no WhatsApp"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '50%',
            background: isBarSolid ? 'transparent' : 'rgba(0,0,0,0.35)',
            color: isBarSolid ? colors.text : '#ffffff',
            textDecoration: 'none', fontSize: '18px', flexShrink: 0,
          }}
        >
          ↗️
        </a>
      </div>

      <div className="pd-header-wrap">
        <Header />
      </div>

      <main className="pd-main-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', width: '100%' }}>
        {/* Voltar — pílula alinhada à direita. Só desktop: no mobile a barra
            fixa acima já cobre a volta pra categoria. */}
        <div className="pd-desktop-back" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <Link
            href={backHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              padding: '8px 16px',
              background: detailStyles.backButton.backgroundColor,
              color: detailStyles.backButton.textColor,
              border: `1px solid ${detailStyles.backButton.borderColor}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            ↩ Voltar
          </Link>
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

            {/* Galeria — só existe quando há imagens extras. Sem elas, nada aqui.
                Faixa única rolável na horizontal (não quebra linha) — a rolagem
                fica contida aqui dentro, nunca vaza pra página. */}
            {hasGallery && (
              <div className="gallery-strip" style={{ display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto', overflowY: 'hidden' }}>
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
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <Image src={url} alt={`${currentProduct.name} ${index + 1}`} fill sizes="64px" style={{ objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{
              ...applyDetailStyles('productName', { lineHeight: '1.3', marginBottom: '8px' }),
              fontSize: `clamp(1.5rem, 3vw, ${detailStyles.productName.fontSize || '36px'})`,
            }}>
              {currentProduct.name}
            </h1>

            {(collectionDisplayName || brandName) && (
              <div style={{ marginBottom: '16px' }}>
                {collectionDisplayName && (
                  <p style={{
                    margin: 0,
                    fontSize: detailStyles.collectionLine.fontSize || '14px',
                    fontWeight: (detailStyles.collectionLine.fontWeight as any) || '500',
                  }}>
                    <span style={{ color: detailStyles.collectionLine.labelColor }}>Coleção: </span>
                    <span style={{ color: detailStyles.collectionLine.valueColor }}>{collectionDisplayName}</span>
                  </p>
                )}
                {brandName && (
                  <p style={{
                    margin: collectionDisplayName ? '2px 0 0 0' : 0,
                    fontSize: detailStyles.brandLine.fontSize || '14px',
                    fontWeight: (detailStyles.brandLine.fontWeight as any) || '500',
                  }}>
                    <span style={{ color: detailStyles.brandLine.labelColor }}>Marca: </span>
                    <span style={{ color: detailStyles.brandLine.valueColor }}>{brandName}</span>
                  </p>
                )}
              </div>
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
              <div style={{ marginBottom: '24px' }}>
                <p
                  ref={descRef}
                  style={{
                    ...applyDetailStyles('description', { lineHeight: '1.6', margin: 0 }),
                    whiteSpace: 'pre-line',
                    ...(descExpanded ? {} : {
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }),
                  }}
                >
                  {currentProduct.description}
                </p>
                {descTruncated && (
                  <button
                    onClick={() => setDescExpanded(prev => !prev)}
                    style={{
                      marginTop: '4px',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: colors.primary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {descExpanded ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </div>
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
        .pd-header-wrap { order: 0; }
        .pd-main-content { order: 1; }
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
          }
          /* Produto primeiro, Header depois — a barra fixa já cobre voltar/buscar/compartilhar */
          .pd-header-wrap { order: 2; }
          .pd-main-content { order: 1; }
          .pd-mobile-bar { display: flex !important; }
          .pd-desktop-back { display: none !important; }
        }
        .gallery-strip {
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        .gallery-strip::-webkit-scrollbar {
          height: 4px;
        }
        .gallery-strip::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
