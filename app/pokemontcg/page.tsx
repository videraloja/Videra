// app/pokemontcg/page.tsx - VERSÃO OTIMIZADA (FILTRO ESGOTADOS + CÓDIGO LIMPO)
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Carousel from '../components/Carousel';
import FiltersBar from '../components/FiltersBar';
import { supabase } from '../../lib/supabaseClient';
import { carouselService } from '../lib/carouselService';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Product, CartItem, CarouselConfig } from '../types';
import { useCartContext } from '../contexts/CartContext';
import { useCategoryFilters } from '../../hooks/useCategoryFilters';
import HeroSectionWrapper from '../components/HeroSectionWrapper';
import { useAvailableStock } from '@/hooks/useAvailableStock';

export default function PokemonTCGPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const { addToCart: addToCartGlobal } = useCartContext();
  const { syncedProducts } = useAvailableStock(products);

  // ✅ Produtos com estoque > 0 (esgotados ocultos)
  const availableProducts = useMemo(() => syncedProducts.filter(p => p.stock > 0), [syncedProducts]);

  // Estados para filtros
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Estados para carrosséis
  const [carouselConfigs, setCarouselConfigs] = useState<CarouselConfig[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [viewAllType, setViewAllType] = useState<'all' | 'bestsellers' | 'new_arrivals'>('all');
  const [carouselsLoading, setCarouselsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<CarouselConfig | null>(null);

  // ✅ Arrays filtrados por estoque (para carrosséis e "Ver todos")
  const filteredBestsellers = useMemo(() => bestsellers.filter(p => p.stock > 0), [bestsellers]);
  const filteredNewArrivals = useMemo(() => newArrivals.filter(p => p.stock > 0), [newArrivals]);

  // Hook de tema
  const { colors, emojis, applyThemeStyles, getShadow, getCategoryConfig } = useThemeColors();

  // Hook de filtros
  const { filterPokemon, getPokemonCollections } = useCategoryFilters();

  // Sincronizar estoque dos carrosséis com syncedProducts
  useEffect(() => {
    if (syncedProducts.length > 0) {
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

  // Função para sincronizar estoque com carrinho
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

  // Função para alternar filtros
  const handleFilterToggle = (filterId: string) => {
    setActiveFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(f => f !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  // Função para selecionar coleção específica
  const handleCollectionSelect = (collectionName: string) => {
    const collectionId = collectionName
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    const collectionFilterId = `colecao:${collectionId}`;
    handleFilterToggle(collectionFilterId);
  };

  // Produtos filtrados via useMemo (sem debugs)
  const filteredProducts = useMemo(() => {
    if (products.length === 0) return [];
    if (activeFilters.length === 0) return products;
    return filterPokemon(products, activeFilters);
  }, [products, activeFilters, filterPokemon]);

  // Coleções Pokémon para a barra de filtros
  const pokemonCollections = useMemo(() => {
    if (products.length === 0) return [];
    return getPokemonCollections(products);
  }, [products, getPokemonCollections]);

  const handleCarouselSelect = (type: 'all' | 'bestsellers' | 'new_arrivals') => {
    const config = carouselConfigs.find(c => c.carousel_type === type);
    if (config) setCurrentConfig(config);
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
    if (currentStock <= 0) return;
    addToCartGlobal(product);
  };

  // Carregar produtos Pokémon
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'pokemon')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar produtos Pokémon:', error);
          return;
        }

        if (data) {
          const adjustedProducts = syncProductsWithCart(data as Product[]);
          setProducts(adjustedProducts);
          localStorage.setItem('products', JSON.stringify(adjustedProducts));
        }
      } catch (err) {
        console.error('Erro ao acessar Supabase:', err);
      }
      setReady(true);
    };

    load();
  }, []);

  // Carregar carrosséis (dados reais) – mesmo padrão da Home
  useEffect(() => {
    const loadCarousels = async () => {
      if (!ready) return;
      setCarouselsLoading(true);
      try {
        const configs = await carouselService.getCarouselConfigs('pokemontcg');
        setCarouselConfigs(configs);
        if (configs.length > 0) setCurrentConfig(configs[0]);

        const { getProductsWithAvailableStock } = await import('@/lib/productService');
        const productsWithStock = await getProductsWithAvailableStock();

        // Mais vendidos (categoria pokemon – o serviço filtra por categoria)
        const best = await carouselService.getBestsellers('pokemon', 10);
        const syncedBest = best.map(product => {
          const stockInfo = productsWithStock.find(p => p.id === product.id);
          const availableStock = stockInfo?.available_stock ?? product.stock;
          return { ...product, stock: availableStock };
        });
        setBestsellers(syncedBest);

        // Lançamentos (categoria pokemon)
        const arrivals = await carouselService.getNewArrivals('pokemon', 10);
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

  // Estado de busca
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Produtos filtrados por busca e filtros
  const getFinalFilteredProducts = useMemo(() => {
    let result = filteredProducts;
    // Remover esgotados
    result = result.filter(p => p.stock > 0);
    if (searchTerm.trim()) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.card_set?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return result;
  }, [filteredProducts, searchTerm]);

  const finalFilteredProducts = getFinalFilteredProducts;
  const hasActiveSearch = searchTerm.length > 0 || activeFilters.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: colors.background, color: colors.text }}>
      <Header onSearch={handleSearch} searchTerm={searchTerm} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {!ready && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>{emojis.search}</div>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>Carregando produtos Pokémon...</p>
          </div>
        )}

        {ready && (
          <>
            <HeroSectionWrapper showHero={!hasActiveSearch && !showAllProducts} />

            {/* Barra de filtros */}
            {!showAllProducts && (
              <FiltersBar
                category="pokemon"
                activeFilters={activeFilters}
                onFilterToggle={handleFilterToggle}
                collections={pokemonCollections}
                onCollectionSelect={handleCollectionSelect}
                isExpanded={isFiltersExpanded}
                onToggle={() => setIsFiltersExpanded(!isFiltersExpanded)}
              />
            )}

            {/* Resultados da busca/filtros */}
            {hasActiveSearch && !showAllProducts && (
              <section style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 20px' }}>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: '700', color: colors.text, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{emojis.search}</span>
                    Resultados
                    {activeFilters.length > 0 && (
                      <span style={{ background: colors.primary, color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>
                        {activeFilters.length} filtros
                      </span>
                    )}
                  </h2>
                  {searchTerm && <p style={{ color: '#6b7280', fontSize: '14px' }}>Buscando: <strong>"{searchTerm}"</strong></p>}
                </div>

                {finalFilteredProducts.length > 0 ? (
                  <div className="product-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', padding: '20px 0' }}>
                    {finalFilteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} categoryConfig={{ color: colors.primary, icon: '🎴', badgeText: 'POKÉMON' }} />
                    ))}
                  </div>
                ) : (
                  <div style={applyThemeStyles({ textAlign: 'center', padding: '80px 20px', background: colors.cardBg, borderRadius: '20px', boxShadow: getShadow('medium') }, 'card')}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>{emojis.search}</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: colors.text }}>Nenhum produto encontrado</h3>
                    <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px', maxWidth: '400px', margin: '0 auto' }}>
                      {searchTerm ? `Nenhum resultado para "${searchTerm}" com os filtros atuais.` : 'Nenhum produto corresponde aos filtros selecionados.'}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Modos de exibição: Grid ou Carrosséis */}
            {showAllProducts ? (
              <div>
                <div className="view-all-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '0 20px' }}>
                  <h2 className="view-all-title" style={{ fontSize: `${currentConfig?.view_all_title_font_size || 28}px`, fontWeight: currentConfig?.view_all_title_font_weight || '700', color: currentConfig?.view_all_title_color || colors.text, display: 'flex', alignItems: 'center', gap: '12px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                    <span style={{ flexShrink: 0 }}>{viewAllType === 'all' ? '📦' : viewAllType === 'bestsellers' ? '🔥' : '🆕'}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {viewAllType === 'all' && 'Todos os Produtos'}
                      {viewAllType === 'bestsellers' && 'Mais Vendidos'}
                      {viewAllType === 'new_arrivals' && 'Lançamentos'}
                    </span>
                  </h2>
                  <button
                    className="view-all-back-btn"
                    onClick={() => setShowAllProducts(false)}
                    style={{ padding: '8px 16px', background: currentConfig?.view_all_back_button_bg_color || 'transparent', color: currentConfig?.view_all_back_button_text_color || colors.primary, border: `1px solid ${currentConfig?.view_all_back_button_bg_color || colors.primary}`, borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    ↩ Voltar
                  </button>
                </div>
                <div className="product-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', padding: '20px' }}>
                  {(viewAllType === 'all' ? availableProducts : viewAllType === 'bestsellers' ? filteredBestsellers : filteredNewArrivals)
                    .map((product) => (
                      <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} categoryConfig={{ color: colors.primary, icon: '🎴', badgeText: 'POKÉMON' }} />
                    ))}
                </div>
              </div>
            ) : (
              // Modo carrosséis (quando não há busca/filtros ativos)
              !hasActiveSearch && (
                <section>
                  {carouselsLoading && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', marginBottom: '32px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>🎠</div>
                      <p style={{ fontSize: '16px', color: '#6b7280' }}>Carregando carrosséis...</p>
                    </div>
                  )}

                  <div>
                    <Carousel
                      title="Todos os Produtos"
                      products={availableProducts}
                      config={carouselConfigs.find(c => c.carousel_type === 'all') || {
                        page_slug: 'pokemontcg', carousel_type: 'all',
                        title_text_color: colors.text, title_font_size: 24, title_font_weight: '700',
                        badge_bg_color: '#ef4444', badge_text_color: '#ffffff',
                        arrow_bg_color: '#ef4444', arrow_text_color: '#ffffff', arrow_hover_bg_color: '#dc2626', arrow_hover_text_color: '#ffffff',
                        show_arrows: true, show_badges: true, items_per_view: 4, auto_scroll: false, auto_scroll_interval: 5000,
                        view_all_title_color: colors.text, view_all_title_font_size: 28, view_all_title_font_weight: '700',
                        view_all_badge_bg_color: '#ef4444', view_all_badge_text_color: '#ffffff',
                        view_all_button_bg_color: 'transparent', view_all_button_text_color: '#ef4444', view_all_button_border_color: '#ef4444',
                        view_all_button_hover_bg_color: '#ef4444', view_all_button_hover_text_color: '#ffffff', view_all_button_hover_border_color: '#ef4444',
                        view_all_back_button_bg_color: 'transparent', view_all_back_button_text_color: '#ef4444',
                        view_all_back_button_hover_bg_color: '#ef4444', view_all_back_button_hover_text_color: '#ffffff',
                        id: 'temp-pokemontcg-all', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                      }}
                      showViewAll={availableProducts.length > 0}
                      onViewAll={() => { setViewAllType('all'); setShowAllProducts(true); handleCarouselSelect('all'); }}
                      categoryConfig={{ color: colors.primary, icon: '🎴', badgeText: 'POKÉMON' }}
                      onAddToCart={handleAddToCart}
                    />

                    <Carousel
                      title="Mais Vendidos"
                      products={filteredBestsellers}
                      config={carouselConfigs.find(c => c.carousel_type === 'bestsellers') || {
                        page_slug: 'pokemontcg', carousel_type: 'bestsellers',
                        title_text_color: colors.text, title_font_size: 24, title_font_weight: '700',
                        badge_bg_color: '#059669', badge_text_color: '#ffffff',
                        arrow_bg_color: '#059669', arrow_text_color: '#ffffff', arrow_hover_bg_color: '#047857', arrow_hover_text_color: '#ffffff',
                        show_arrows: true, show_badges: true, items_per_view: 4, auto_scroll: false, auto_scroll_interval: 5000,
                        view_all_title_color: colors.text, view_all_title_font_size: 28, view_all_title_font_weight: '700',
                        view_all_badge_bg_color: '#059669', view_all_badge_text_color: '#ffffff',
                        view_all_button_bg_color: 'transparent', view_all_button_text_color: '#059669', view_all_button_border_color: '#059669',
                        view_all_button_hover_bg_color: '#059669', view_all_button_hover_text_color: '#ffffff', view_all_button_hover_border_color: '#059669',
                        view_all_back_button_bg_color: 'transparent', view_all_back_button_text_color: '#059669',
                        view_all_back_button_hover_bg_color: '#059669', view_all_back_button_hover_text_color: '#ffffff',
                        id: 'bestsellers', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                      }}
                      showViewAll={filteredBestsellers.length > 0}
                      onViewAll={() => { setViewAllType('bestsellers'); setShowAllProducts(true); handleCarouselSelect('bestsellers'); }}
                      categoryConfig={{ color: colors.primary, icon: '🔥', badgeText: 'TOP' }}
                      onAddToCart={handleAddToCart}
                    />

                    <Carousel
                      title="Lançamentos"
                      products={filteredNewArrivals}
                      config={carouselConfigs.find(c => c.carousel_type === 'new_arrivals') || {
                        page_slug: 'pokemontcg', carousel_type: 'new_arrivals',
                        title_text_color: colors.text, title_font_size: 24, title_font_weight: '700',
                        badge_bg_color: '#7c3aed', badge_text_color: '#ffffff',
                        arrow_bg_color: '#7c3aed', arrow_text_color: '#ffffff', arrow_hover_bg_color: '#6d28d9', arrow_hover_text_color: '#ffffff',
                        show_arrows: true, show_badges: true, items_per_view: 4, auto_scroll: false, auto_scroll_interval: 5000,
                        view_all_title_color: colors.text, view_all_title_font_size: 28, view_all_title_font_weight: '700',
                        view_all_badge_bg_color: '#7c3aed', view_all_badge_text_color: '#ffffff',
                        view_all_button_bg_color: 'transparent', view_all_button_text_color: '#7c3aed', view_all_button_border_color: '#7c3aed',
                        view_all_button_hover_bg_color: '#7c3aed', view_all_button_hover_text_color: '#ffffff', view_all_button_hover_border_color: '#7c3aed',
                        view_all_back_button_bg_color: 'transparent', view_all_back_button_text_color: '#7c3aed',
                        view_all_back_button_hover_bg_color: '#7c3aed', view_all_back_button_hover_text_color: '#ffffff',
                        id: 'new_arrivals', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                      }}
                      showViewAll={filteredNewArrivals.length > 0}
                      onViewAll={() => { setViewAllType('new_arrivals'); setShowAllProducts(true); handleCarouselSelect('new_arrivals'); }}
                      categoryConfig={{ color: colors.primary, icon: '🆕', badgeText: 'NEW' }}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                </section>
              )
            )}
          </>
        )}
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}