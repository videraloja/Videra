// app/page.tsx - VERSÃO LIMPA COM HOOKS E PRODUCTCARD PADRONIZADO
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import { supabase } from '../lib/supabaseClient';
import { useThemeColors } from '../hooks/useThemeColors';
// 🆕 IMPORTS DOS HOOKS COMPARTILHADOS
import { Product, CartItem } from './types';
import { useCart } from '../hooks/useCart';
import { useStock } from '../hooks/useStock';
import HeroSectionWrapper from './components/HeroSectionWrapper';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 🆕 HOOKS COMPARTILHADOS
  const { cart, addToCart } = useCart();
  const { stockLabel } = useStock();

  // 🎨 HOOK DE TEMAS
  const { 
    colors, 
    emojis, 
    applyThemeStyles, 
    getGradient, 
    getShadow,
    getCategoryConfig,
    themeName,
    isSpecialTheme 
  } = useThemeColors();

  // Refs para os carrosséis
  const newArrivalsRef = useRef<HTMLDivElement>(null);
  const bestSellersRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

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
          const savedCart = localStorage.getItem('cart');
          let cartItems: CartItem[] = [];
          if (savedCart) {
            try {
              cartItems = JSON.parse(savedCart) as CartItem[];
            } catch {
              cartItems = [];
            }
          }

          const adjustedProducts = (data as Product[]).map((p) => {
            const inCart = cartItems.find((c) => c.id === p.id);
            if (inCart) {
              return { ...p, stock: Math.max(p.stock - inCart.quantity, 0) };
            }
            return p;
          });

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

  // 🆕 FUNÇÃO addToCart ATUALIZADA
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    const nextCart = addToCart(product, products, setProducts);
  };

  // Funções para scroll dos carrosséis
  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 320; // Largura do card + gap
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // BUSCA GLOBAL - Filtra em TODOS os produtos
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // PRODUTOS EM DESTAQUE (apenas para home)
  const featuredProducts = products.slice(0, 12);
  const newArrivals = products.slice(0, 10); // Últimos lançamentos
  const bestSellers = products.filter(p => p.stock <= 5).slice(0, 10); // Produtos com estoque baixo = mais vendidos

  // Verifica se há busca ativa (para esconder seções específicas)
  const hasActiveSearch = searchTerm.length > 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.secondary} 100%)`,
      color: colors.text
    }}>
      {/* Header Compartilhado com Busca Global */}
      <Header 
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
      />

      <main style={{ 
        maxWidth: '1400px', // Aumentado para carrosséis
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
            }}>{emojis.category}</div>
            <p style={{ 
              fontSize: '18px', 
              color: colors.text,
              opacity: 0.7,
              marginBottom: '8px'
            }}>
              Carregando produtos...
            </p>
          </div>
        )}

        {/* Hero Section Global */}
<HeroSectionWrapper 
  showHero={!hasActiveSearch}
/>

            {/* SEÇÃO DE NOVOS LANÇAMENTOS - CARROSSEL HORIZONTAL COM TEMAS */}
            {!hasActiveSearch && newArrivals.length > 0 && (
              <section style={{ marginBottom: '80px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '32px',
                  padding: '0 20px'
                }}>
                  <h2 style={{
                    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                    fontWeight: '700',
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '32px' }}>🆕</span>
                    Novos Lançamentos
                  </h2>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={applyThemeStyles({
                      padding: '8px 16px',
                      background: colors.primary + '20',
                      color: colors.primary,
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }, 'card')}>
                      ✨ {newArrivals.length} novos
                    </div>
                    
                    {/* Botões de navegação do carrossel COM TEMAS */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => scrollCarousel(newArrivalsRef, 'left')}
                        style={applyThemeStyles({
                          padding: '8px 12px',
                          background: colors.cardBg,
                          border: `1px solid ${colors.secondary}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.2s ease'
                        }, 'button-secondary')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.primary;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.cardBg;
                          e.currentTarget.style.color = colors.text;
                        }}
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => scrollCarousel(newArrivalsRef, 'right')}
                        style={applyThemeStyles({
                          padding: '8px 12px',
                          background: colors.cardBg,
                          border: `1px solid ${colors.secondary}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.2s ease'
                        }, 'button-secondary')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.primary;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.cardBg;
                          e.currentTarget.style.color = colors.text;
                        }}
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>

                {/* Container do Carrossel */}
                <div style={{
                  position: 'relative',
                  padding: '0 20px'
                }}>
                  {/* Indicador de Scroll Temático */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0',
                    transform: 'translateY(-50%)',
                    background: colors.primary + '20',
                    color: colors.primary,
                    padding: '8px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 5
                  }}>
                    <span>Deslize</span>
                    <span style={{ animation: 'bounceX 2s infinite' }}>→</span>
                  </div>

                  {/* Carrossel Horizontal */}
                  <div
                    ref={newArrivalsRef}
                    style={{
                      display: 'flex',
                      gap: '24px',
                      overflowX: 'auto',
                      scrollBehavior: 'smooth',
                      padding: '20px 0',
                      scrollbarWidth: 'thin',
                      scrollbarColor: colors.secondary + ' transparent',
                      cursor: 'grab'
                    }}
                    onMouseDown={(e) => {
                      const carousel = newArrivalsRef.current;
                      if (!carousel) return;
                      
                      const startX = e.pageX - carousel.offsetLeft;
                      const scrollLeft = carousel.scrollLeft;
                      
                      const onMouseMove = (e: MouseEvent) => {
                        const x = e.pageX - carousel.offsetLeft;
                        const walk = (x - startX) * 2;
                        carousel.scrollLeft = scrollLeft - walk;
                      };
                      
                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        carousel.style.cursor = 'grab';
                      };
                      
                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                      carousel.style.cursor = 'grabbing';
                    }}
                  >
                    {newArrivals.map((product) => (
                      <div key={product.id} style={{ flex: '0 0 auto' }}>
                        <ProductCard 
                          product={product}
                          onAddToCart={handleAddToCart}
                          categoryConfig={getCategoryConfig(product.category || 'default')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SEÇÃO DE MAIS VENDIDOS - CARROSSEL HORIZONTAL COM TEMAS */}
            {!hasActiveSearch && bestSellers.length > 0 && (
              <section style={{ marginBottom: '80px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '32px',
                  padding: '0 20px'
                }}>
                  <h2 style={{
                    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                    fontWeight: '700',
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '32px' }}>🔥</span>
                    Mais Vendidos
                  </h2>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={applyThemeStyles({
                      padding: '8px 16px',
                      background: colors.accent + '20',
                      color: colors.accent,
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }, 'card')}>
                      🎯 {bestSellers.length} populares
                    </div>
                    
                    {/* Botões de navegação do carrossel COM TEMAS */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => scrollCarousel(bestSellersRef, 'left')}
                        style={applyThemeStyles({
                          padding: '8px 12px',
                          background: colors.cardBg,
                          border: `1px solid ${colors.secondary}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.2s ease'
                        }, 'button-secondary')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.primary;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.cardBg;
                          e.currentTarget.style.color = colors.text;
                        }}
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => scrollCarousel(bestSellersRef, 'right')}
                        style={applyThemeStyles({
                          padding: '8px 12px',
                          background: colors.cardBg,
                          border: `1px solid ${colors.secondary}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.2s ease'
                        }, 'button-secondary')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.primary;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.cardBg;
                          e.currentTarget.style.color = colors.text;
                        }}
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>

                {/* Container do Carrossel */}
                <div style={{
                  position: 'relative',
                  padding: '0 20px'
                }}>
                  {/* Indicador de Scroll Temático */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0',
                    transform: 'translateY(-50%)',
                    background: colors.accent + '20',
                    color: colors.accent,
                    padding: '8px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 5
                  }}>
                    <span>Deslize</span>
                    <span style={{ animation: 'bounceX 2s infinite' }}>→</span>
                  </div>

                  {/* Carrossel Horizontal */}
                  <div
                    ref={bestSellersRef}
                    style={{
                      display: 'flex',
                      gap: '24px',
                      overflowX: 'auto',
                      scrollBehavior: 'smooth',
                      padding: '20px 0',
                      scrollbarWidth: 'thin',
                      scrollbarColor: colors.secondary + ' transparent',
                      cursor: 'grab'
                    }}
                    onMouseDown={(e) => {
                      const carousel = bestSellersRef.current;
                      if (!carousel) return;
                      
                      const startX = e.pageX - carousel.offsetLeft;
                      const scrollLeft = carousel.scrollLeft;
                      
                      const onMouseMove = (e: MouseEvent) => {
                        const x = e.pageX - carousel.offsetLeft;
                        const walk = (x - startX) * 2;
                        carousel.scrollLeft = scrollLeft - walk;
                      };
                      
                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        carousel.style.cursor = 'grab';
                      };
                      
                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                      carousel.style.cursor = 'grabbing';
                    }}
                  >
                    {bestSellers.map((product) => (
                      <div key={product.id} style={{ flex: '0 0 auto' }}>
                        <ProductCard 
                          product={product}
                          onAddToCart={handleAddToCart}
                          categoryConfig={getCategoryConfig(product.category || 'default')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SEÇÃO PRINCIPAL DE DESTAQUES - CARROSSEL HORIZONTAL COM TEMAS */}
            <section id="destaques" style={{ marginBottom: '80px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                padding: '0 20px'
              }}>
                <h2 style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                  fontWeight: '700',
                  color: colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '32px' }}>
                    {hasActiveSearch ? emojis.search : '⭐'}
                  </span>
                  {hasActiveSearch ? `Resultados para "${searchTerm}"` : 'Todos os Destaques'}
                </h2>
                
                {!hasActiveSearch && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={applyThemeStyles({
                      padding: '8px 16px',
                      background: colors.secondary,
                      color: colors.text,
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }, 'card')}>
                      {featuredProducts.length} produtos
                    </div>
                    
                    {/* Botões de navegação do carrossel COM TEMAS */}
                    {!hasActiveSearch && featuredProducts.length > 4 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => scrollCarousel(featuredRef, 'left')}
                          style={applyThemeStyles({
                            padding: '8px 12px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.secondary}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'all 0.2s ease'
                          }, 'button-secondary')}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.primary;
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = colors.cardBg;
                            e.currentTarget.style.color = colors.text;
                          }}
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => scrollCarousel(featuredRef, 'right')}
                          style={applyThemeStyles({
                            padding: '8px 12px',
                            background: colors.cardBg,
                            border: `1px solid ${colors.secondary}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'all 0.2s ease'
                          }, 'button-secondary')}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.primary;
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = colors.cardBg;
                            e.currentTarget.style.color = colors.text;
                          }}
                        >
                          ▶
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(hasActiveSearch ? filteredProducts.length > 0 : featuredProducts.length > 0) ? (
                <div style={{
                  position: 'relative',
                  padding: '0 20px'
                }}>
                  {/* Indicador de Scroll (apenas para destaque) COM TEMAS */}
                  {!hasActiveSearch && featuredProducts.length > 4 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      right: '0',
                      transform: 'translateY(-50%)',
                      background: colors.primary + '20',
                      color: colors.primary,
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 5
                    }}>
                      <span>Deslize</span>
                      <span style={{ animation: 'bounceX 2s infinite' }}>→</span>
                    </div>
                  )}

                  {/* Carrossel Horizontal ou Grid para busca */}
                  <div
                    ref={featuredRef}
                    style={{
                      display: 'flex',
                      gap: '24px',
                      overflowX: hasActiveSearch ? 'visible' : 'auto',
                      flexWrap: hasActiveSearch ? 'wrap' : 'nowrap',
                      scrollBehavior: 'smooth',
                      padding: '20px 0',
                      scrollbarWidth: 'thin',
                      scrollbarColor: colors.secondary + ' transparent',
                      cursor: hasActiveSearch ? 'default' : 'grab',
                      justifyContent: hasActiveSearch ? 'center' : 'flex-start'
                    }}
                    onMouseDown={hasActiveSearch ? undefined : (e) => {
                      const carousel = featuredRef.current;
                      if (!carousel) return;
                      
                      const startX = e.pageX - carousel.offsetLeft;
                      const scrollLeft = carousel.scrollLeft;
                      
                      const onMouseMove = (e: MouseEvent) => {
                        const x = e.pageX - carousel.offsetLeft;
                        const walk = (x - startX) * 2;
                        carousel.scrollLeft = scrollLeft - walk;
                      };
                      
                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        carousel.style.cursor = 'grab';
                      };
                      
                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                      carousel.style.cursor = 'grabbing';
                    }}
                  >
                    {(hasActiveSearch ? filteredProducts : featuredProducts).map((product) => (
                      <div key={product.id} style={{ 
                        flex: hasActiveSearch ? '0 0 auto' : '0 0 auto'
                      }}>
                        <ProductCard 
                          product={product}
                          onAddToCart={handleAddToCart}
                          categoryConfig={getCategoryConfig(product.category || 'default')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Mensagem quando não há resultados COM TEMAS
                <div style={applyThemeStyles({ 
                  textAlign: 'center', 
                  padding: '80px 20px',
                  background: colors.cardBg,
                  borderRadius: '20px',
                  boxShadow: getShadow('small')
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
                    color: colors.text,
                    opacity: 0.7,
                    marginBottom: '24px'
                  }}>
                    {hasActiveSearch 
                      ? 'Tente ajustar os termos da busca ou explorar nossas categorias.' 
                      : 'Em breve teremos novidades incríveis para você!'
                    }
                  </p>
                </div>
              )}
            </section>

           
      </main>

      {/* Estilos para animação do indicador de scroll */}
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
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}