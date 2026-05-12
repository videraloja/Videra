// app/page.tsx - VERSÃO FINAL OTIMIZADA (DADOS REAIS, SEM FALLBACKS)
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import Carousel from './components/Carousel';
import { supabase } from '../lib/supabaseClient';
import { useThemeColors } from '../hooks/useThemeColors';
import { Product, CartItem, CarouselConfig } from './types';
import HeroSectionWrapper from './components/HeroSectionWrapper';
import { carouselService } from './lib/carouselService';
import { useCartContext } from './contexts/CartContext';
import { useAvailableStock } from '@/hooks/useAvailableStock';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart: addToCartGlobal } = useCartContext();
  const { syncedProducts } = useAvailableStock(products);

  // ✅ Produtos com estoque > 0
  const availableProducts = useMemo(() => syncedProducts.filter(p => p.stock > 0), [syncedProducts]);

  // Estados para carrosséis editáveis
  const [carouselConfigs, setCarouselConfigs] = useState<CarouselConfig[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [viewAllType, setViewAllType] = useState<'all' | 'bestsellers' | 'new_arrivals'>('all');
  const [carouselsLoading, setCarouselsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<CarouselConfig | null>(null);

  // ✅ Filtrar esgotados em tempo real nos dados reais
  const filteredBestsellers = useMemo(() => bestsellers.filter(p => p.stock > 0), [bestsellers]);
  const filteredNewArrivals = useMemo(() => newArrivals.filter(p => p.stock > 0), [newArrivals]);

  // Sincronizar allProducts, bestsellers e newArrivals com estoque disponível
  useEffect(() => {
    if (syncedProducts.length > 0) {
      setAllProducts(prevAll => {
        const updated = prevAll.map(product => {
          const synced = syncedProducts.find(p => p.id === product.id);
          return synced ? { ...product, stock: synced.stock } : product;
        });
        return updated;
      });
      
      setBestsellers(prev => {
        const updated = prev.map(product => {
          const synced = syncedProducts.find(p => p.id === product.id);
          return synced ? { ...product, stock: synced.stock } : product;
        });
        return updated;
      });
      
      setNewArrivals(prev => {
        const updated = prev.map(product => {
          const synced = syncedProducts.find(p => p.id === product.id);
          return synced ? { ...product, stock: synced.stock } : product;
        });
        return updated;
      });
    }
  }, [syncedProducts]);

  const { colors, emojis, applyThemeStyles, getShadow, getCategoryConfig } = useThemeColors();

  // Função para sincronizar estoque com carrinho
  const syncProductsWithCart = (productsList: Product[]): Product[] => {
    const savedCart = localStorage.getItem('cart');
    let cartItems: CartItem[] = [];
    if (savedCart) {
      try {
        cartItems = JSON.parse(savedCart) as CartItem[];
      } catch {
        cartItems = [];
      }
    }
    return productsList.map(product => {
      const inCart = cartItems.find(item => String(item.id) === String(product.id));
      if (inCart) {
        return { ...product, stock: Math.max(product.stock - inCart.quantity, 0) };
      }
      return product;
    });
  };

  // Carrega produtos e carrinho do Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar produtos no Supabase:', error);
          return;
        }

        if (data) {
          const adjustedProducts = syncProductsWithCart(data as Product[]);
          setProducts(adjustedProducts);
          setAllProducts(adjustedProducts);
          localStorage.setItem('products', JSON.stringify(adjustedProducts));
        }
      } catch (err) {
        console.error('Erro ao acessar Supabase:', err);
      }

      setReady(true);
    };

    load();
  }, []);

  // CARREGAR CARROSSÉIS (dados reais garantidos)
  useEffect(() => {
    const loadCarousels = async () => {
      if (!ready) return;
      
      setCarouselsLoading(true);
      try {
        const configs = await carouselService.getCarouselConfigs('home');
        setCarouselConfigs(configs);
        
        if (configs.length > 0) {
          setCurrentConfig(configs[0]);
        }
        
        const { getProductsWithAvailableStock } = await import('@/lib/productService');
        const productsWithStock = await getProductsWithAvailableStock();
        
        // Mais vendidos: agora a categoria 'home' faz busca global, retornando vendas reais de qualquer categoria
        const best = await carouselService.getBestsellers('home', 10);
        const syncedBest = best.map(product => {
          const stockInfo = productsWithStock.find(p => p.id === product.id);
          const availableStock = stockInfo?.available_stock ?? product.stock;
          return { ...product, stock: availableStock };
        });
        setBestsellers(syncedBest);
        
        // Lançamentos: idem, busca global
        const arrivals = await carouselService.getNewArrivals('home', 10);
        const syncedArrivals = arrivals.map(product => {
          const stockInfo = productsWithStock.find(p => p.id === product.id);
          const availableStock = stockInfo?.available_stock ?? product.stock;
          return { ...product, stock: availableStock };
        });
        setNewArrivals(syncedArrivals);
        
      } catch (error) {
        console.error('Erro ao carregar carrosséis:', error);
      } finally {
        setCarouselsLoading(false);
      }
    };

    loadCarousels();
  }, [ready]);

  const handleAddToCart = (product: Product) => {
    const productId = String(product.id);
    
    const findCurrentStock = (): number => {
      const inProducts = products.find(p => String(p.id) === productId);
      const inBestsellers = bestsellers.find(p => String(p.id) === productId);
      const inNewArrivals = newArrivals.find(p => String(p.id) === productId);
      
      return inProducts?.stock || inBestsellers?.stock || inNewArrivals?.stock || product.stock;
    };
    
    const currentStock = findCurrentStock();
    if (currentStock <= 0) return;
    
    addToCartGlobal(product);
  };

  // BUSCA GLOBAL
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return availableProducts;
    return availableProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableProducts]);

  const hasActiveSearch = searchTerm.length > 0;

  // Produtos para "Ver todos"
  const getViewAllProducts = useMemo(() => {
    switch (viewAllType) {
      case 'bestsellers': return filteredBestsellers;
      case 'new_arrivals': return filteredNewArrivals;
      default: return allProducts.filter(p => p.stock > 0);
    }
  }, [viewAllType, filteredBestsellers, filteredNewArrivals, allProducts]);

  const viewAllProductsList = getViewAllProducts;

  const handleCarouselSelect = (type: 'all' | 'bestsellers' | 'new_arrivals') => {
    const config = carouselConfigs.find(c => c.carousel_type === type);
    if (config) setCurrentConfig(config);
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.text }}>
      <Header onSearch={setSearchTerm} searchTerm={searchTerm} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {!ready && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>{emojis.category}</div>
            <p style={{ fontSize: '18px', color: colors.text, opacity: 0.7 }}>Carregando produtos...</p>
          </div>
        )}

        <HeroSectionWrapper showHero={!hasActiveSearch && !showAllProducts} />

        {/* SEÇÃO DE RESULTADOS DA BUSCA */}
        {hasActiveSearch && !showAllProducts && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ marginBottom: '24px', padding: '0 20px' }}>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: '700',
                color: colors.text,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '28px' }}>{emojis.search}</span>
                Resultados para &quot;{searchTerm}&quot;
              </h2>
            </div>

            {filteredProducts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', padding: '20px' }}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} categoryConfig={getCategoryConfig(product.category || 'default')} />
                ))}
              </div>
            ) : (
              <div style={applyThemeStyles({ textAlign: 'center', padding: '80px 20px', background: colors.cardBg, borderRadius: '20px', boxShadow: getShadow('small') }, 'card')}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>{emojis.search}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: colors.text }}>Nenhum produto encontrado</h3>
                <p style={{ fontSize: '16px', color: colors.text, opacity: 0.7 }}>Tente ajustar os termos da busca ou explorar nossas categorias.</p>
              </div>
            )}
          </section>
        )}

        {/* MODO CARROSSÉIS (quando não há busca) */}
        {!hasActiveSearch && (
          <>
            {carouselsLoading && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>🎠</div>
                <p style={{ fontSize: '16px', color: '#6b7280' }}>Carregando carrosséis...</p>
              </div>
            )}

            {!showAllProducts ? (
              <div>
                <Carousel
                  title="Todos os Produtos"
                  products={availableProducts}
                  config={carouselConfigs.find(c => c.carousel_type === 'all') || {
                    page_slug: 'home', carousel_type: 'all',
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
                    id: 'home-all-temp', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                  }}
                  showViewAll={availableProducts.length > 0}
                  onViewAll={() => { setViewAllType('all'); setShowAllProducts(true); handleCarouselSelect('all'); }}
                  categoryConfig={getCategoryConfig('default')}
                  onAddToCart={handleAddToCart}
                />

                <Carousel
                  title="Mais Vendidos"
                  products={filteredBestsellers}
                  config={carouselConfigs.find(c => c.carousel_type === 'bestsellers') || {
                    page_slug: 'home', carousel_type: 'bestsellers',
                    title_text_color: colors.text, title_font_size: 24, title_font_weight: '700',
                    badge_bg_color: '#f59e0b', badge_text_color: '#ffffff',
                    arrow_bg_color: '#f59e0b', arrow_text_color: '#ffffff', arrow_hover_bg_color: '#d97706', arrow_hover_text_color: '#ffffff',
                    show_arrows: true, show_badges: true, items_per_view: 4, auto_scroll: false, auto_scroll_interval: 5000,
                    view_all_title_color: colors.text, view_all_title_font_size: 28, view_all_title_font_weight: '700',
                    view_all_badge_bg_color: '#f59e0b', view_all_badge_text_color: '#ffffff',
                    view_all_button_bg_color: 'transparent', view_all_button_text_color: '#f59e0b', view_all_button_border_color: '#f59e0b',
                    view_all_button_hover_bg_color: '#f59e0b', view_all_button_hover_text_color: '#ffffff', view_all_button_hover_border_color: '#f59e0b',
                    view_all_back_button_bg_color: 'transparent', view_all_back_button_text_color: '#f59e0b',
                    view_all_back_button_hover_bg_color: '#f59e0b', view_all_back_button_hover_text_color: '#ffffff',
                    id: 'home-bestsellers-temp', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                  }}
                  showViewAll={filteredBestsellers.length > 0}
                  onViewAll={() => { setViewAllType('bestsellers'); setShowAllProducts(true); handleCarouselSelect('bestsellers'); }}
                  categoryConfig={getCategoryConfig('default')}
                  onAddToCart={handleAddToCart}
                />

                <Carousel
                  title="Lançamentos"
                  products={filteredNewArrivals}
                  config={carouselConfigs.find(c => c.carousel_type === 'new_arrivals') || {
                    page_slug: 'home', carousel_type: 'new_arrivals',
                    title_text_color: colors.text, title_font_size: 24, title_font_weight: '700',
                    badge_bg_color: '#8b5cf6', badge_text_color: '#ffffff',
                    arrow_bg_color: '#8b5cf6', arrow_text_color: '#ffffff', arrow_hover_bg_color: '#7c3aed', arrow_hover_text_color: '#ffffff',
                    show_arrows: true, show_badges: true, items_per_view: 4, auto_scroll: false, auto_scroll_interval: 5000,
                    view_all_title_color: colors.text, view_all_title_font_size: 28, view_all_title_font_weight: '700',
                    view_all_badge_bg_color: '#8b5cf6', view_all_badge_text_color: '#ffffff',
                    view_all_button_bg_color: 'transparent', view_all_button_text_color: '#8b5cf6', view_all_button_border_color: '#8b5cf6',
                    view_all_button_hover_bg_color: '#8b5cf6', view_all_button_hover_text_color: '#ffffff', view_all_button_hover_border_color: '#8b5cf6',
                    view_all_back_button_bg_color: 'transparent', view_all_back_button_text_color: '#8b5cf6',
                    view_all_back_button_hover_bg_color: '#8b5cf6', view_all_back_button_hover_text_color: '#ffffff',
                    id: 'home-new-temp', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                  }}
                  showViewAll={filteredNewArrivals.length > 0}
                  onViewAll={() => { setViewAllType('new_arrivals'); setShowAllProducts(true); handleCarouselSelect('new_arrivals'); }}
                  categoryConfig={getCategoryConfig('default')}
                  onAddToCart={handleAddToCart}
                />
              </div>
            ) : (
              // Modo "Ver todos"
              <div>
                <div className="view-all-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '0 20px' }}>
                  <h2 className="view-all-title" style={{ fontSize: currentConfig?.view_all_title_font_size || 28, fontWeight: currentConfig?.view_all_title_font_weight || '700', color: currentConfig?.view_all_title_color || colors.text, display: 'flex', alignItems: 'center', gap: '12px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                    <span style={{ flexShrink: 0 }}>
                      {viewAllType === 'all' && ''}
                      {viewAllType === 'bestsellers' && ''}
                      {viewAllType === 'new_arrivals' && ''}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {viewAllType === 'all' && 'Todos os Produtos'}
                      {viewAllType === 'bestsellers' && 'Mais Vendidos'}
                      {viewAllType === 'new_arrivals' && 'Lançamentos'}
                    </span>
                  </h2>
                  <button className="view-all-back-btn" onClick={() => setShowAllProducts(false)} style={{ padding: '8px 16px', background: currentConfig?.view_all_back_button_bg_color || 'transparent', color: currentConfig?.view_all_back_button_text_color || colors.primary, border: `1px solid ${currentConfig?.view_all_back_button_bg_color || colors.primary}`, borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ↩ Voltar
                  </button>
                </div>
                <div className="product-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', padding: '20px' }}>
                  {viewAllProductsList.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} categoryConfig={getCategoryConfig(product.category || 'default')} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}