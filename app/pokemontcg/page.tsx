// app/pokemontcg/page.tsx - VERSÃO CORRIGIDA (sem declaração duplicada)
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react'; // 🆕 Adicione useMemo
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


export default function PokemonTCGPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false); // 🆕 REMOVIDO: const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { addToCart: addToCartGlobal } = useCartContext();

  // 🆕 STATES PARA FILTROS
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // STATES PARA CARROSSÉIS
  const [carouselConfigs, setCarouselConfigs] = useState<CarouselConfig[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [viewAllType, setViewAllType] = useState<'all' | 'bestsellers' | 'new_arrivals'>('all');
  const [carouselsLoading, setCarouselsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<CarouselConfig | null>(null);

  // 🆕 HOOK DE FILTROS
  const { filterPokemon, getPokemonCollections } = useCategoryFilters();

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

  // CONFIGURAÇÃO ESPECÍFICA PARA POKÉMON
  const pokemonConfig = getCategoryConfig('pokemon');

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

  // 🆕 FUNÇÃO: Alternar filtros
  const handleFilterToggle = (filterId: string) => {
    setActiveFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(f => f !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  // 🆕 FUNÇÃO: Selecionar coleção específica (VERSÃO CORRIGIDA)
const handleCollectionSelect = (collectionName: string) => {
  console.log('🎯 [FILTRO] Coleção selecionada:', collectionName);
  
  // Remove acentos e formata para ID compatível com o banco
  const collectionId = collectionName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos: "domínio" → "dominio"
    .replace(/\s+/g, '-') // Espaços para hífens: "domínio dracônico" → "dominio-draconico"
    .trim();
  
  console.log('🎯 [FILTRO] ID normalizado:', collectionId);
  
  const collectionFilterId = `colecao:${collectionId}`;
  console.log('🎯 [FILTRO] Filtro criado:', collectionFilterId);
  
  // Aplica o filtro
  handleFilterToggle(collectionFilterId);
  
  // Debug adicional
  setTimeout(() => {
    const produto = products.find(p => {
      const prodCollection = (p.collection || '').toLowerCase();
      return prodCollection === collectionId || 
             prodCollection.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === collectionId;
    });
    
    console.log('🔍 [FILTRO] Produto correspondente:', {
      filtro: collectionFilterId,
      produtoEncontrado: !!produto,
      detalhesProduto: produto ? {
        id: produto.id,
        name: produto.name,
        collection: produto.collection
      } : null
    });
  }, 50);
};

  // 🆕 PRODUTOS FILTRADOS - useMemo para evitar loops
  const filteredProducts = useMemo(() => {
    if (products.length === 0) return [];
    if (activeFilters.length === 0) return products;
    
    return filterPokemon(products, activeFilters);
  }, [products, activeFilters, filterPokemon]);

  // 🆕 COLEÇÕES POKÉMON - useMemo para evitar loops
  const pokemonCollections = useMemo(() => {
    if (products.length === 0) return [];
    return getPokemonCollections(products);
  }, [products, getPokemonCollections]);

  const handleCarouselSelect = (type: 'all' | 'bestsellers' | 'new_arrivals') => {
    const config = carouselConfigs.find(c => c.carousel_type === type);
    if (config) {
      setCurrentConfig(config);
    }
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

  // CARREGAR CARROSSÉIS
  useEffect(() => {
    const loadCarousels = async () => {
      if (!ready) return;
      
      setCarouselsLoading(true);
      try {
        const configs = await carouselService.getCarouselConfigs('pokemontcg');
        setCarouselConfigs(configs);
        
        if (configs.length > 0) {
          setCurrentConfig(configs[0]);
        }
        
        const best = await carouselService.getBestsellers('pokemon', 10);
        const syncedBest = syncProductsWithCart(best);
        setBestsellers(syncedBest);
        
        const arrivals = await carouselService.getNewArrivals('pokemon', 10);
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

  // 🆕 Estado de busca
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

// Substitua o useEffect de debug por ESTE (mais detalhado ainda):
useEffect(() => {
  if (activeFilters.length > 0) {
    console.log('🔍🔥 DEBUG SUPER DETALHADO:', {
      // 1. FILTROS ATIVOS (EXATO CONTEÚDO)
      filtrosAtivos: activeFilters,
      primeiroFiltro: activeFilters[0],
      tipoFiltro: activeFilters[0]?.startsWith('colecao:') ? 'colecao' : 'outro',
      
      // 2. VALOR EXATO DO FILTRO
      filtroId: activeFilters[0]?.replace('colecao:', ''),
      filtroIdLowerCase: activeFilters[0]?.replace('colecao:', '').toLowerCase(),
      
      // 3. PRODUTO NO BANCO
      produtoNoBanco: products.find(p => p.id === 15), // ID do Charizard
      produtoCollection: products.find(p => p.id === 15)?.collection,
      produtoCollectionLowerCase: products.find(p => p.id === 15)?.collection?.toLowerCase(),
      
      // 4. COMPARAÇÃO DIRETA
      comparacao: {
        filtro: activeFilters[0]?.replace('colecao:', '').toLowerCase(),
        banco: products.find(p => p.id === 15)?.collection?.toLowerCase(),
        saoIguais: activeFilters[0]?.replace('colecao:', '').toLowerCase() === 
                  products.find(p => p.id === 15)?.collection?.toLowerCase()
      },
      
      // 5. TODOS OS PRODUTOS PARA VER
      todosProdutos: products.map(p => ({
        id: p.id,
        name: p.name.substring(0, 20) + '...',
        collection: p.collection,
        collectionLower: p.collection?.toLowerCase()
      }))
    });
  }
}, [activeFilters, products]);

  // 🆕 Produtos filtrados por busca E filtros
  const getFinalFilteredProducts = () => {
    let result = filteredProducts;
    
    // Aplicar busca textual
    if (searchTerm.trim()) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.card_set?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return result;
  };

  const finalFilteredProducts = getFinalFilteredProducts();
  const hasActiveSearch = searchTerm.length > 0 || activeFilters.length > 0;

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
              Carregando produtos Pokémon...
            </p>
          </div>
        )}

        {ready && (
          <>
            {/* Hero Section Pokémon */}
            {!hasActiveSearch && !showAllProducts && (
              <section style={applyThemeStyles({
                textAlign: 'center',
                padding: '80px 20px',
                marginBottom: '40px',
                background: getGradient('hero'),
                borderRadius: '24px',
                color: 'white',
                boxShadow: getShadow('large'),
                position: 'relative',
                overflow: 'hidden'
              }, 'hero')}>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  fontSize: '80px',
                  opacity: '0.1',
                  transform: 'rotate(15deg)'
                }}>{pokemonConfig.icon}</div>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  fontSize: '60px',
                  opacity: '0.1',
                  transform: 'rotate(-15deg)'
                }}>🔥</div>
                
                <h1 style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: '800',
                  marginBottom: '16px',
                  lineHeight: '1.2'
                }}>
                  <span style={{ fontSize: '48px', marginRight: '12px' }}>{pokemonConfig.icon}</span>
                  Pokémon TCG
                </h1>

                <p style={{
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                  marginBottom: '32px',
                  opacity: '0.9',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}>
                  Descubra cartas raras, decks completos e acessórios exclusivos do universo Pokémon TCG
                </p>
              </section>
            )}

            {/* 🆕 BARRA DE FILTROS */}
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

            {/* 🆕 SEÇÃO DE RESULTADOS DOS FILTROS */}
            {hasActiveSearch && !showAllProducts && (
              <section style={{
                marginBottom: '40px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
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
                    Resultados
                    {activeFilters.length > 0 && (
                      <span style={{
                        background: colors.primary,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {activeFilters.length} filtros
                      </span>
                    )}
                  </h2>
                  
                  {searchTerm && (
                    <p style={{
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      Buscando: <strong>"{searchTerm}"</strong>
                    </p>
                  )}
                </div>



                {/* 🆕 GRID DE PRODUTOS FILTRADOS (2 por linha no mobile) */}
                {finalFilteredProducts.length > 0 ? (
                  <div 
                    className="product-grid-container"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '24px',
                      padding: '20px 0'
                    }}
                  >
                    {finalFilteredProducts.map((product) => (
                      <ProductCard 
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        categoryConfig={{
                          color: colors.primary,
                          icon: '🎴',
                          badgeText: 'POKÉMON'
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
                      Nenhum produto encontrado
                    </h3>
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#6b7280',
                      marginBottom: '24px',
                      maxWidth: '400px',
                      margin: '0 auto'
                    }}>
                      {searchTerm 
                        ? `Nenhum resultado para "${searchTerm}" com os filtros atuais.`
                        : 'Nenhum produto corresponde aos filtros selecionados.'
                      }
                    </p>
                  </div>
                )}
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
          {viewAllType === 'all' && 'Todos os Produtos'}
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
              icon: '🎴',
              badgeText: 'POKÉMON'
            }}
          />
        ))}
    </div>
  </div>
) : (
              // MODO CARROSSÉIS (quando não há busca ou filtros ativos)
              !hasActiveSearch && (
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

                  {/* CARROSSÉIS PRINCIPAIS */}
                  <div>
                    <Carousel
                      title="Todos os Produtos"
                      products={products}
                      config={carouselConfigs.find(c => c.carousel_type === 'all') || {
                        page_slug: 'pokemontcg',
                        carousel_type: 'all',
                        title_text_color: colors.text,
                        title_font_size: 24,
                        title_font_weight: '700',
                        badge_bg_color: '#ef4444',
                        badge_text_color: '#ffffff',
                        arrow_bg_color: '#ef4444',
                        arrow_text_color: '#ffffff',
                        arrow_hover_bg_color: '#dc2626',
                        arrow_hover_text_color: '#ffffff',
                        show_arrows: true,
                        show_badges: true,
                        items_per_view: 4,
                        auto_scroll: false,
                        auto_scroll_interval: 5000,
                        view_all_title_color: colors.text,
                        view_all_title_font_size: 28,
                        view_all_title_font_weight: '700',
                        view_all_badge_bg_color: '#ef4444',
                        view_all_badge_text_color: '#ffffff',
                        view_all_button_bg_color: 'transparent',
                        view_all_button_text_color: '#ef4444',
                        view_all_button_border_color: '#ef4444',
                        view_all_button_hover_bg_color: '#ef4444',
                        view_all_button_hover_text_color: '#ffffff',
                        view_all_button_hover_border_color: '#ef4444',
                        view_all_back_button_bg_color: 'transparent',
                        view_all_back_button_text_color: '#ef4444',
                        view_all_back_button_hover_bg_color: '#ef4444',
                        view_all_back_button_hover_text_color: '#ffffff',
                        id: 'temp-pokemontcg-all',
                         created_at: new Date().toISOString(),
                         updated_at: new Date().toISOString()
                      }}
                      showViewAll={products.length > 0}
                      onViewAll={() => {
                        setViewAllType('all');
                        setShowAllProducts(true);
                        handleCarouselSelect('all');
                      }}
                      categoryConfig={{
                        color: colors.primary,
                        icon: '🎴',
                        badgeText: 'POKÉMON'
                      }}
                      onAddToCart={handleAddToCart}
                    />

                    <Carousel
                      title="Mais Vendidos"
                      products={bestsellers}
                      config={carouselConfigs.find(c => c.carousel_type === 'bestsellers') || {
                        page_slug: 'pokemontcg',
                        carousel_type: 'bestsellers',
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
                        page_slug: 'pokemontcg',
                        carousel_type: 'new_arrivals',
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
                </section>
              )
            )}

            {/* Hero Section Final */}
            {!hasActiveSearch && !showAllProducts && (
              <section style={applyThemeStyles({
                textAlign: 'center',
                padding: '80px 20px',
                marginTop: '80px',
                background: getGradient('secondary'),
                borderRadius: '24px',
                color: 'white',
                boxShadow: getShadow('large'),
                position: 'relative',
                overflow: 'hidden'
              }, 'hero')}>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  fontSize: '80px',
                  opacity: '0.1',
                  transform: 'rotate(15deg)'
                }}>🎴</div>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  fontSize: '60px',
                  opacity: '0.1',
                  transform: 'rotate(-15deg)'
                }}>🌟</div>
                
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                  fontWeight: '800',
                  marginBottom: '16px',
                  lineHeight: '1.2'
                }}>
                  <span style={{ fontSize: '40px', marginRight: '12px' }}>{pokemonConfig.icon}</span>
                  Não Encontrou o Que Procurava?
                </h2>

                <p style={{
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                  marginBottom: '32px',
                  opacity: '0.9',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}>
                  Entre em contato conosco! Podemos ajudar a encontrar produtos especiais para sua coleção.
                </p>
                
                <button
                  onClick={() => window.open('https://wa.me/5592986446677', '_blank')}
                  style={applyThemeStyles({
                    padding: '16px 32px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }, 'button-secondary')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.border = '2px solid rgba(255,255,255,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.border = '2px solid rgba(255,255,255,0.3)';
                  }}
                >
                  💬 Falar no WhatsApp
                </button>
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