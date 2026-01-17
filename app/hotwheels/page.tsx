// app/hotwheels/page.tsx - VERSÃO ATUALIZADA COM SISTEMA DE CARROSSÉIS
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import Carousel from '../components/Carousel'; // 🆕 Importar Carousel
import { supabase } from '../../lib/supabaseClient';
import { carouselService } from '../lib/carouselService'; // 🆕 Importar serviço
import { useThemeColors } from '../../hooks/useThemeColors';
import { Product, CartItem, CarouselConfig } from '../types';
import { useCartContext } from '../contexts/CartContext'; // 🆕 Usar CartContext
import { useStock } from '../../hooks/useStock';

interface Filters {
  productType: string;
  collection: string;
  scale: string;
  priceRange: string;
  searchTerm: string;
  inStock: boolean;
}

export default function HotWheelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    productType: '',
    collection: '',
    scale: '',
    priceRange: '',
    searchTerm: '',
    inStock: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // 🆕 STATES PARA CARROSSÉIS
  const [carouselConfigs, setCarouselConfigs] = useState<CarouselConfig[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [viewAllType, setViewAllType] = useState<'all' | 'bestsellers' | 'new_arrivals'>('all');
  const [carouselsLoading, setCarouselsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<CarouselConfig | null>(null);

  const handleCarouselSelect = (type: 'all' | 'bestsellers' | 'new_arrivals') => {
    const config = carouselConfigs.find(c => c.carousel_type === type);
    if (config) {
      setCurrentConfig(config);
    }
  };

  const productsRef = useRef<HTMLDivElement>(null);

  // 🆕 HOOKS ATUALIZADOS
  const { addToCart: addToCartGlobal, getItemQuantity } = useCartContext();
  const { stockLabel } = useStock();

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
  const hotWheelsConfig = getCategoryConfig('hotwheels'); // ✅ Usar 'hotwheels' (sem hífen)

  // 🆕 FUNÇÃO PARA SINCRONIZAR ESTOQUE COM CARRINHO
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

  // 🆕 FUNÇÃO handleAddToCart ATUALIZADA
  const handleAddToCart = (product: Product) => {
    const productId = String(product.id);
    
    // 1. Verificar se tem estoque (buscar do estado atual)
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
    
    // 2. Apenas adicionar ao carrinho global
    addToCartGlobal(product);
    
    // 3. Disparar evento para o ProductCard atualizar
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
          .eq('category', 'hot-wheels') // ✅ Categoria com hífen
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar Hot Wheels:', error);
          return;
        }

        if (data) {
          // 🆕 SINCRONIZAR COM CARRINHO
          const adjustedProducts = syncProductsWithCart(data as Product[]);

          setProducts(adjustedProducts);
          setFilteredProducts(adjustedProducts);
          localStorage.setItem('products_hotwheels', JSON.stringify(adjustedProducts));
        }
      } catch (err) {
        console.error('Erro ao acessar Supabase:', err);
      }

      setReady(true);
    };

    load();
  }, []);

  // 🆕 CARREGAR CARROSSÉIS
  useEffect(() => {
    const loadCarousels = async () => {
      if (!ready) return;
      
      setCarouselsLoading(true);
      try {
        // Carregar configurações
        const configs = await carouselService.getCarouselConfigs('hotwheels');
        setCarouselConfigs(configs);
        
        if (configs.length > 0) {
          setCurrentConfig(configs[0]);
        }
        
        // 🆕 Carregar mais vendidos
        const best = await carouselService.getBestsellers('hot-wheels', 10);
        const syncedBest = syncProductsWithCart(best);
        setBestsellers(syncedBest);
        
        // 🆕 Carregar lançamentos
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

  // APLICAR FILTROS
  useEffect(() => {
    let filtered = products;

    if (filters.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.collection?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    }

    if (filters.productType) {
      filtered = filtered.filter(product => product.product_type === filters.productType);
    }

    if (filters.collection) {
      filtered = filtered.filter(product => product.collection === filters.collection);
    }

    if (filters.scale) {
      filtered = filtered.filter(product => {
        const productInfo = product.description?.toLowerCase() || product.name.toLowerCase();
        return productInfo.includes(filters.scale.toLowerCase());
      });
    }

    if (filters.priceRange) {
      switch (filters.priceRange) {
        case '0-50':
          filtered = filtered.filter(product => product.price <= 50);
          break;
        case '50-100':
          filtered = filtered.filter(product => product.price > 50 && product.price <= 100);
          break;
        case '100-200':
          filtered = filtered.filter(product => product.price > 100 && product.price <= 200);
          break;
        case '200+':
          filtered = filtered.filter(product => product.price > 200);
          break;
      }
    }

    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    setFilteredProducts(filtered);
  }, [filters, products]);

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      productType: '',
      collection: '',
      scale: '',
      priceRange: '',
      searchTerm: '',
      inStock: false
    });
  };

  const hotWheelsTypes = [...new Set(products.map(p => p.product_type).filter(Boolean))];
  const collections = [...new Set(products.map(p => p.collection).filter(Boolean))];
  const scales = ['1:64', '1:43', '1:24', '1:18'];

  const hotWheelsStats = {
    totalProducts: products.length,
    inStock: products.filter(p => p.stock > 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 3).length,
    filteredCount: filteredProducts.length,
    onSale: products.filter(p => p.on_sale).length,
    rareItems: products.filter(p => p.stock <= 2).length
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== false
  ).length;

  const hasActiveSearch = filters.searchTerm.length > 0 || activeFiltersCount > 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: colors.background,
      color: colors.text
    }}>
      <Header 
        onSearch={(term) => updateFilter('searchTerm', term)}
        searchTerm={filters.searchTerm}
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
            {/* Hero Section COM TEMAS */}
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
                }}>{hotWheelsConfig.icon}</div>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  fontSize: '60px',
                  opacity: '0.1',
                  transform: 'rotate(-15deg)'
                }}>🏁</div>
                
                <h1 style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: '800',
                  marginBottom: '16px',
                  lineHeight: '1.2'
                }}>
                  <span style={{ fontSize: '48px', marginRight: '12px' }}>{hotWheelsConfig.icon}</span>
                  Hot Wheels
                </h1>

                <p style={{
                  fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                  marginBottom: '32px',
                  opacity: '0.9',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}>
                  Colecione os carrinhos mais incríveis! Velocidade, estilo e diversão em miniatura
                </p>
                
                <button
                  onClick={() => setShowFilters(true)}
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
                  {emojis.search} Explorar Modelos
                </button>
              </section>
            )}

            {/* Seção de Filtros COM TEMAS */}
            {(hasActiveSearch || showFilters) && !showAllProducts && (
              <section style={applyThemeStyles({
                background: colors.cardBg,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: getShadow('medium'),
                marginBottom: '40px',
                border: `1px solid ${colors.secondary}`
              }, 'filter')}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {emojis.filter} Filtros Avançados
                    {activeFiltersCount > 0 && (
                      <span style={{
                        background: colors.primary,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {activeFiltersCount}
                      </span>
                    )}
                  </h2>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        style={applyThemeStyles({
                          padding: '8px 16px',
                          background: 'transparent',
                          color: colors.primary,
                          border: `1px solid ${colors.primary}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }, 'button-secondary')}
                      >
                        🗑️ Limpar Filtros
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      style={applyThemeStyles({
                        padding: '8px 16px',
                        background: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }, 'button-primary')}
                    >
                      {showFilters ? '▲' : '▼'} Filtros
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    paddingTop: '20px',
                    borderTop: `1px solid ${colors.secondary}`
                  }}>
                    {/* Filtro por Tipo de Carro */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: colors.text,
                        fontSize: '14px'
                      }}>
                        🏎️ Tipo de Carro
                      </label>
                      <select
                        value={filters.productType}
                        onChange={(e) => updateFilter('productType', e.target.value)}
                        style={applyThemeStyles({
                          width: '100%',
                          padding: '10px',
                          border: `1px solid ${colors.secondary}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: colors.cardBg
                        }, 'filter')}
                      >
                        <option value="">Todos os tipos</option>
                        {hotWheelsTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por Coleção */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: colors.text,
                        fontSize: '14px'
                      }}>
                        📦 Coleção
                      </label>
                      <select
                        value={filters.collection}
                        onChange={(e) => updateFilter('collection', e.target.value)}
                        style={applyThemeStyles({
                          width: '100%',
                          padding: '10px',
                          border: `1px solid ${colors.secondary}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: colors.cardBg
                        }, 'filter')}
                      >
                        <option value="">Todas as coleções</option>
                        {collections.map(collection => (
                          <option key={collection} value={collection}>{collection}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por Escala */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: colors.text,
                        fontSize: '14px'
                      }}>
                        📐 Escala
                      </label>
                      <select
                        value={filters.scale}
                        onChange={(e) => updateFilter('scale', e.target.value)}
                        style={applyThemeStyles({
                          width: '100%',
                          padding: '10px',
                          border: `1px solid ${colors.secondary}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: colors.cardBg
                        }, 'filter')}
                      >
                        <option value="">Todas as escalas</option>
                        {scales.map(scale => (
                          <option key={scale} value={scale}>{scale}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por Preço */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: colors.text,
                        fontSize: '14px'
                      }}>
                        💰 Faixa de Preço
                      </label>
                      <select
                        value={filters.priceRange}
                        onChange={(e) => updateFilter('priceRange', e.target.value)}
                        style={applyThemeStyles({
                          width: '100%',
                          padding: '10px',
                          border: `1px solid ${colors.secondary}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: colors.cardBg
                      }, 'filter')}
                    >
                      <option value="">Qualquer preço</option>
                      <option value="0-50">Até R$ 50</option>
                      <option value="50-100">R$ 50 - R$ 100</option>
                      <option value="100-200">R$ 100 - R$ 200</option>
                      <option value="200+">Acima de R$ 200</option>
                    </select>
                  </div>

                  {/* Filtro por Estoque */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
                    <input
                      type="checkbox"
                      id="inStock"
                      checked={filters.inStock}
                      onChange={(e) => updateFilter('inStock', e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px'
                      }}
                    />
                    <label htmlFor="inStock" style={{
                      fontWeight: '600',
                      color: colors.text,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}>
                      {emojis.stock} Apenas em estoque
                    </label>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* MODOS DE EXIBIÇÃO: Grid ou Carrosséis */}
          {showAllProducts ? (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                padding: '0 20px'
              }}>
                <h2 style={{
                  fontSize: `${currentConfig?.view_all_title_font_size || 28}px`,
                  fontWeight: currentConfig?.view_all_title_font_weight || '700',
                  color: currentConfig?.view_all_title_color || colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {viewAllType === 'all' && '📦 Todos os Modelos'}
                  {viewAllType === 'bestsellers' && '🔥 Mais Vendidos'}
                  {viewAllType === 'new_arrivals' && '🆕 Lançamentos'}
                  <span style={{
                    backgroundColor: currentConfig?.view_all_badge_bg_color || colors.primary,
                    color: currentConfig?.view_all_badge_text_color || 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {viewAllType === 'all' && `${products.length} modelos`}
                    {viewAllType === 'bestsellers' && `${bestsellers.length} modelos`}
                    {viewAllType === 'new_arrivals' && `${newArrivals.length} modelos`}
                  </span>
                </h2>
                
                <button
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
                    transition: 'all 0.2s ease'
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
                  ↩ Voltar para Carrosséis
                </button>
              </div>
              
              {/* Grid de produtos (não carrossel) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
                padding: '20px'
              }}>
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
            // MODO CARROSSÉIS
            <section>
              {/* Indicador de carregamento dos carrosséis */}
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

              {/* Se estiver em busca ativa, mostrar apenas produtos filtrados */}
              {hasActiveSearch ? (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
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
                      Resultados: {filteredProducts.length} modelo(s) encontrado(s)
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
                        Nenhum Hot Wheels encontrado
                      </h3>
                      <p style={{ 
                        fontSize: '16px', 
                        color: '#6b7280',
                        marginBottom: '24px'
                      }}>
                        Tente ajustar os filtros ou limpar para ver todos os modelos.
                      </p>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          style={applyThemeStyles({
                            padding: '12px 24px',
                            background: colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }, 'button-primary')}
                        >
                          🔄 Limpar Filtros
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // CARROSSÉIS PRINCIPAIS
                <div>
                  {/* Carrossel: Todos os Modelos */}
                  <Carousel
                    title="Todos os Modelos"
                    products={products}
                    config={carouselConfigs.find(c => c.carousel_type === 'all') || {
                      page_slug: 'hotwheels',
                      carousel_type: 'all',
                      title_text_color: colors.text,
                      title_font_size: 24,
                      title_font_weight: '700',
                      badge_bg_color: '#dc2626',          // 🟥 VERMELHO DA CATEGORIA
                      badge_text_color: '#ffffff',
                      arrow_bg_color: '#dc2626',          // 🟥 VERMELHO DA CATEGORIA
                      arrow_text_color: '#ffffff',
                      arrow_hover_bg_color: '#b91c1c',    // 🟥 VERMELHO ESCURO
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

                  {/* Carrossel: Mais Vendidos */}
                  <Carousel
                    title="Mais Vendidos"
                    products={bestsellers}
                    config={carouselConfigs.find(c => c.carousel_type === 'bestsellers') || {
                      page_slug: 'hotwheels',
                      carousel_type: 'bestsellers',
                      title_text_color: colors.text,
                      title_font_size: 24,
                      title_font_weight: '700',
                      badge_bg_color: '#7c3aed',          // 🟪 ROXO (DIFERENTE)
                      badge_text_color: '#ffffff',
                      arrow_bg_color: '#7c3aed',          // 🟪 ROXO (DIFERENTE)
                      arrow_text_color: '#ffffff',
                      arrow_hover_bg_color: '#6d28d9',    // 🟪 ROXO ESCURO
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

                  {/* Carrossel: Lançamentos */}
                  <Carousel
                    title="Lançamentos"
                    products={newArrivals}
                    config={carouselConfigs.find(c => c.carousel_type === 'new_arrivals') || {
                      page_slug: 'hotwheels',
                      carousel_type: 'new_arrivals',
                      title_text_color: colors.text,
                      title_font_size: 24,
                      title_font_weight: '700',
                      badge_bg_color: '#059669',          // 🟩 VERDE (DIFERENTE)
                      badge_text_color: '#ffffff',
                      arrow_bg_color: '#059669',          // 🟩 VERDE (DIFERENTE)
                      arrow_text_color: '#ffffff',
                      arrow_hover_bg_color: '#047857',    // 🟩 VERDE ESCURO
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

          {/* Hero Section Final COM TEMAS */}
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
              }}>🏎️</div>
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
                <span style={{ fontSize: '40px', marginRight: '12px' }}>{hotWheelsConfig.icon}</span>
                Comece Sua Coleção de Hot Wheels!
              </h2>

              <p style={{
                fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                marginBottom: '32px',
                opacity: '0.9',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                Descubra modelos raros, edições limitadas e os carrinhos mais desejados do mundo!
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
      @keyframes bounceX {
        0%, 20%, 50%, 80%, 100% {
          transform: translateX(0);
        }
        40% {
          transform: translateX(4px);
        }
        60% {
          transform: translateX(2px);
        }
      }
      
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