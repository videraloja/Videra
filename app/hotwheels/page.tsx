// app/hotwheels/page.tsx - VERSÃO SEM FILTROS
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Carousel from '../components/Carousel';
import { supabase } from '../../lib/supabaseClient';
import { carouselService } from '../lib/carouselService';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Product, CartItem, CarouselConfig } from '../types';
import { useCartContext } from '../contexts/CartContext';
import HeroSectionWrapper from '../components/HeroSectionWrapper';

export default function HotWheelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const { addToCart: addToCartGlobal } = useCartContext();

  // 🆕 STATES PARA CARROSSÉIS
  const [carouselConfigs, setCarouselConfigs] = useState<CarouselConfig[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [viewAllType, setViewAllType] = useState<'all' | 'bestsellers' | 'new_arrivals'>('all');
  const [carouselsLoading, setCarouselsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<CarouselConfig | null>(null);

  // 🆕 SIMPLES: Apenas busca por texto
  const [searchTerm, setSearchTerm] = useState('');

  const productsRef = useRef<HTMLDivElement>(null);

  // HOOK DE TEMAS
  const { 
    colors, 
    emojis, 
    applyThemeStyles, 
    getGradient, 
    getShadow,
    getCategoryConfig 
  } = useThemeColors();

  // CONFIGURAÇÃO ESPECÍFICA PARA HOT WHEELS
  const hotWheelsConfig = getCategoryConfig('hotwheels');

  // 🆕 FUNÇÃO: Sincronizar estoque com carrinho
  const syncProductsWithCart = (products: Product[]): Product[] => {
    const savedCart = localStorage.getItem('cart');
    let cartItems: CartItem[] = [];
    
    if (savedCart) {
      try {
        cartItems = JSON.parse(savedCart) as CartItem[];
      } catch {
        cartItems = [];
      }
    }

    return products.map(product => {
      const inCart = cartItems.find(item => String(item.id) === String(product.id));
      if (inCart) {
        return { ...product, stock: Math.max(product.stock - inCart.quantity, 0) };
      }
      return product;
    });
  };

  // 🆕 FUNÇÃO SIMPLES DE BUSCA
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // 🆕 FUNÇÃO: Filtrar produtos baseado apenas no searchTerm
  const getFilteredProducts = () => {
    if (!searchTerm.trim()) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.collection?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const handleAddToCart = (product: Product) => {
    const productId = String(product.id);
    
    const findCurrentStock = (): number => {
      const inProducts = products.find(p => String(p.id) === productId);
      const inBestsellers = bestsellers.find(p => String(p.id) === productId);
      const inNewArrivals = newArrivals.find(p => String(p.id) === productId);
      
      return inProducts?.stock || inBestsellers?.stock || inNewArrivals?.stock || product.stock;
    };
    
    const currentStock = findCurrentStock();
    
    if (currentStock <= 0) {
      console.warn(`❌ ${product.name} sem estoque (${currentStock})`);
      return;
    }
    
    console.log(`🛒 Adicionando ${product.name} ao carrinho. Estoque atual: ${currentStock}`);
    
    addToCartGlobal(product);
    
    window.dispatchEvent(new CustomEvent('cartItemAdded', {
      detail: { 
        productId,
        productName: product.name,
        timestamp: Date.now()
      }
    }));
    
    console.log(`✅ ${product.name} adicionado ao carrinho`);
  };

  // CARREGAR PRODUTOS
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'hot-wheels')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar Hot Wheels:', error);
          return;
        }

        if (data) {
          const adjustedProducts = syncProductsWithCart(data as Product[]);
          setProducts(adjustedProducts);
          localStorage.setItem('products_hotwheels', JSON.stringify(adjustedProducts));
        }
      } catch (err) {
        console.error('Erro ao acessar Supabase:', err);
      }

      setReady(true);
    };

    load();
  }, []);

  // CARREGAR CARROSSÉIS
  useEffect(() => {
    const loadCarousels = async () => {
      if (!ready) return;
      
      setCarouselsLoading(true);
      try {
        const configs = await carouselService.getCarouselConfigs('hotwheels');
        setCarouselConfigs(configs);
        
        if (configs.length > 0) {
          setCurrentConfig(configs[0]);
        }
        
        const best = await carouselService.getBestsellers('hot-wheels', 10);
        const syncedBest = syncProductsWithCart(best);
        setBestsellers(syncedBest);
        
        const arrivals = await carouselService.getNewArrivals('hot-wheels', 10);
        const syncedArrivals = syncProductsWithCart(arrivals);
        setNewArrivals(syncedArrivals);
        
      } catch (error) {
        console.error('Erro ao carregar carrosséis:', error);
      } finally {
        setCarouselsLoading(false);
      }
    };

    loadCarousels();
  }, [ready]);

  const handleCarouselSelect = (type: 'all' | 'bestsellers' | 'new_arrivals') => {
    const config = carouselConfigs.find(c => c.carousel_type === type);
    if (config) {
      setCurrentConfig(config);
    }
  };

  // 🆕 Produtos filtrados apenas pela busca
  const filteredProducts = getFilteredProducts();
  const hasActiveSearch = searchTerm.length > 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: colors.background,
      color: colors.text
    }}>
      <Header 
        onSearch={handleSearch}
        searchTerm={searchTerm}
      />

      <main style={{ 
        maxWidth: '1400px',
        margin: '0 auto', 
        padding: '40px 20px' 
      }}>
        {!ready && (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px' 
          }}>
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '16px',
              animation: 'pulse 2s infinite'
            }}>{emojis.search}</div>
            <p style={{ 
              fontSize: '18px', 
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              Carregando Hot Wheels...
            </p>
          </div>
        )}

        {ready && (
          <>
            {/* Hero Section Global */}
<HeroSectionWrapper 
  showHero={!hasActiveSearch && !showAllProducts}
/>

            {/* 🆕 Seção simples de busca ativa */}
            {hasActiveSearch && !showAllProducts && (
              <section style={{
                marginBottom: '40px',
                padding: '20px',
                background: colors.cardBg,
                borderRadius: '16px',
                boxShadow: getShadow('medium')
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  🔍 Resultados para: "{searchTerm}"
                  <span style={{
                    background: colors.primary,
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {filteredProducts.length} modelo(s)
                  </span>
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Sistema de filtros avançados em desenvolvimento. Por enquanto, apenas busca por texto.
                </p>
              </section>
            )}

{/* MODOS DE EXIBIÇÃO: Grid ou Carrosséis */}
{showAllProducts ? (
  <div>
    <div 
      className="view-all-header"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        padding: '0 20px'
      }}
    >
      <h2 
        className="view-all-title"
        style={{
          fontSize: `${currentConfig?.view_all_title_font_size || 28}px`,
          fontWeight: currentConfig?.view_all_title_font_weight || '700',
          color: currentConfig?.view_all_title_color || colors.text,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '70%'
        }}
      >
        <span style={{ flexShrink: 0 }}>
          {viewAllType === 'all' && '📦'}
          {viewAllType === 'bestsellers' && '🔥'}
          {viewAllType === 'new_arrivals' && '🆕'}
        </span>
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {viewAllType === 'all' && 'Todos os Modelos'}
          {viewAllType === 'bestsellers' && 'Mais Vendidos'}
          {viewAllType === 'new_arrivals' && 'Lançamentos'}
        </span>
      </h2>
      
      <button
        className="view-all-back-btn"
        onClick={() => setShowAllProducts(false)}
        style={{
          padding: '8px 16px',
          background: currentConfig?.view_all_back_button_bg_color || 'transparent',
          color: currentConfig?.view_all_back_button_text_color || colors.primary,
          border: `1px solid ${currentConfig?.view_all_back_button_bg_color || colors.primary}`,
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = currentConfig?.view_all_back_button_hover_bg_color || colors.primary;
          e.currentTarget.style.color = currentConfig?.view_all_back_button_hover_text_color || 'white';
          e.currentTarget.style.borderColor = currentConfig?.view_all_back_button_hover_bg_color || colors.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = currentConfig?.view_all_back_button_bg_color || 'transparent';
          e.currentTarget.style.color = currentConfig?.view_all_back_button_text_color || colors.primary;
          e.currentTarget.style.borderColor = currentConfig?.view_all_back_button_bg_color || colors.primary;
        }}
      >
        ↩ Voltar
      </button>
    </div>
    
    <div 
      className="product-grid-container"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
        padding: '20px'
      }}
    >
      {(viewAllType === 'all' ? products : 
        viewAllType === 'bestsellers' ? bestsellers : newArrivals)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((product) => (
          <ProductCard 
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            categoryConfig={{
              color: colors.primary,
              icon: '🏎️',
              badgeText: 'HOT WHEELS'
            }}
          />
        ))}
    </div>
  </div>
) : (
              <section>
                {carouselsLoading && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    marginBottom: '32px'
                  }}>
                    <div style={{ 
                      fontSize: '48px', 
                      marginBottom: '16px',
                      animation: 'pulse 1.5s infinite'
                    }}>🎠</div>
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#6b7280'
                    }}>
                      Carregando carrosséis...
                    </p>
                  </div>
                )}

                {/* 🆕 Se estiver em busca ativa, mostrar apenas produtos filtrados */}
                {hasActiveSearch ? (
                  <div>
                    <div style={{
                      marginBottom: '32px',
                      padding: '0 20px'
                    }}>
                      <h2 style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                        fontWeight: '700',
                        color: colors.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '28px' }}>
                          {emojis.search}
                        </span>
                        Resultados da busca
                      </h2>
                    </div>

                    {/* Grid de produtos filtrados */}
                    {filteredProducts.length > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '24px',
                        padding: '20px 0'
                      }}>
                        {filteredProducts.map((product) => (
                          <ProductCard 
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToCart}
                            categoryConfig={{
                              color: colors.primary,
                              icon: '🏎️',
                              badgeText: 'HOT WHEELS'
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={applyThemeStyles({ 
                        textAlign: 'center', 
                        padding: '80px 20px',
                        background: colors.cardBg,
                        borderRadius: '20px',
                        boxShadow: getShadow('medium')
                      }, 'card')}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{emojis.search}</div>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          marginBottom: '8px',
                          color: colors.text
                        }}>
                          Nenhum Hot Wheels encontrado para "{searchTerm}"
                        </h3>
                        <p style={{ 
                          fontSize: '16px', 
                          color: '#6b7280',
                          marginBottom: '24px'
                        }}>
                          Tente buscar por outros termos ou verifique a grafia.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // CARROSSÉIS PRINCIPAIS (quando não há busca)
                  <div>
                    <Carousel
                      title="Todos os Modelos"
                      products={products}
                      config={carouselConfigs.find(c => c.carousel_type === 'all') || {
                        page_slug: 'hotwheels',
                        carousel_type: 'all',
                        title_text_color: colors.text,
                        title_font_size: 24,
                        title_font_weight: '700',
                        badge_bg_color: '#dc2626',
                        badge_text_color: '#ffffff',
                        arrow_bg_color: '#dc2626',
                        arrow_text_color: '#ffffff',
                        arrow_hover_bg_color: '#b91c1c',
                        arrow_hover_text_color: '#ffffff',
                        show_arrows: true,
                        show_badges: true,
                        items_per_view: 4,
                        auto_scroll: false,
                        auto_scroll_interval: 5000,
                        view_all_title_color: colors.text,
                        view_all_title_font_size: 28,
                        view_all_title_font_weight: '700',
                        view_all_badge_bg_color: '#dc2626',
                        view_all_badge_text_color: '#ffffff',
                        view_all_button_bg_color: 'transparent',
                        view_all_button_text_color: '#dc2626',
                        view_all_button_border_color: '#dc2626',
                        view_all_button_hover_bg_color: '#dc2626',
                        view_all_button_hover_text_color: '#ffffff',
                        view_all_button_hover_border_color: '#dc2626',
                        view_all_back_button_bg_color: 'transparent',
                        view_all_back_button_text_color: '#dc2626',
                        view_all_back_button_hover_bg_color: '#dc2626',
                        view_all_back_button_hover_text_color: '#ffffff',
                        id: 'temp-hotwheels-all',
                         created_at: new Date().toISOString(),
                         updated_at: new Date().toISOString(),
                      }}
                      showViewAll={products.length > 0}
                      onViewAll={() => {
                        setViewAllType('all');
                        setShowAllProducts(true);
                        handleCarouselSelect('all');
                      }}
                      categoryConfig={{
                        color: colors.primary,
                        icon: '🏎️',
                        badgeText: 'HOT WHEELS'
                      }}
                      onAddToCart={handleAddToCart}
                    />

                    <Carousel
                      title="Mais Vendidos"
                      products={bestsellers}
                      config={carouselConfigs.find(c => c.carousel_type === 'bestsellers') || {
                        page_slug: 'hotwheels',
                        carousel_type: 'bestsellers',
                        title_text_color: colors.text,
                        title_font_size: 24,
                        title_font_weight: '700',
                        badge_bg_color: '#7c3aed',
                        badge_text_color: '#ffffff',
                        arrow_bg_color: '#7c3aed',
                        arrow_text_color: '#ffffff',
                        arrow_hover_bg_color: '#6d28d9',
                        arrow_hover_text_color: '#ffffff',
                        show_arrows: true,
                        show_badges: true,
                        items_per_view: 4,
                        auto_scroll: false,
                        auto_scroll_interval: 5000,
                        view_all_title_color: colors.text,
                        view_all_title_font_size: 28,
                        view_all_title_font_weight: '700',
                        view_all_badge_bg_color: '#7c3aed',
                        view_all_badge_text_color: '#ffffff',
                        view_all_button_bg_color: 'transparent',
                        view_all_button_text_color: '#7c3aed',
                        view_all_button_border_color: '#7c3aed',
                        view_all_button_hover_bg_color: '#7c3aed',
                        view_all_button_hover_text_color: '#ffffff',
                        view_all_button_hover_border_color: '#7c3aed',
                        view_all_back_button_bg_color: 'transparent',
                        view_all_back_button_text_color: '#7c3aed',
                        view_all_back_button_hover_bg_color: '#7c3aed',
                        view_all_back_button_hover_text_color: '#ffffff',
                        id: 'bestsellers',
                         created_at: new Date().toISOString(),
                         updated_at: new Date().toISOString()
                      }}
                      showViewAll={bestsellers.length > 0}
                      onViewAll={() => {
                        setViewAllType('bestsellers');
                        setShowAllProducts(true);
                        handleCarouselSelect('bestsellers');
                      }}
                      categoryConfig={{
                        color: colors.primary,
                        icon: '🔥',
                        badgeText: 'TOP'
                      }}
                      onAddToCart={handleAddToCart}
                    />

                    <Carousel
                      title="Lançamentos"
                      products={newArrivals}
                      config={carouselConfigs.find(c => c.carousel_type === 'new_arrivals') || {
                        page_slug: 'hotwheels',
                        carousel_type: 'new_arrivals',
                        title_text_color: colors.text,
                        title_font_size: 24,
                        title_font_weight: '700',
                        badge_bg_color: '#059669',
                        badge_text_color: '#ffffff',
                        arrow_bg_color: '#059669',
                        arrow_text_color: '#ffffff',
                        arrow_hover_bg_color: '#047857',
                        arrow_hover_text_color: '#ffffff',
                        show_arrows: true,
                        show_badges: true,
                        items_per_view: 4,
                        auto_scroll: false,
                        auto_scroll_interval: 5000,
                        view_all_title_color: colors.text,
                        view_all_title_font_size: 28,
                        view_all_title_font_weight: '700',
                        view_all_badge_bg_color: '#059669',
                        view_all_badge_text_color: '#ffffff',
                        view_all_button_bg_color: 'transparent',
                        view_all_button_text_color: '#059669',
                        view_all_button_border_color: '#059669',
                        view_all_button_hover_bg_color: '#059669',
                        view_all_button_hover_text_color: '#ffffff',
                        view_all_button_hover_border_color: '#059669',
                        view_all_back_button_bg_color: 'transparent',
                        view_all_back_button_text_color: '#059669',
                        view_all_back_button_hover_bg_color: '#059669',
                        view_all_back_button_hover_text_color: '#ffffff',
                        id: 'new_arrivals',
                         created_at: new Date().toISOString(),
                         updated_at: new Date().toISOString()
                      }}
                      showViewAll={newArrivals.length > 0}
                      onViewAll={() => {
                        setViewAllType('new_arrivals');
                        setShowAllProducts(true);
                        handleCarouselSelect('new_arrivals');
                      }}
                      categoryConfig={{
                        color: colors.primary,
                        icon: '🆕',
                        badgeText: 'NEW'
                      }}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}