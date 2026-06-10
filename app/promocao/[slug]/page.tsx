'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { promotionalPagesService, PromotionalPageWithTheme } from '../../../lib/promotionalPagesService';
import { Product } from '../../types';
import { useCartContext } from '../../contexts/CartContext';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import { getProductsWithAvailableStock, ProductWithAvailableStock } from '../../../lib/productService';

export default function PromotionalPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [page, setPage] = useState<PromotionalPageWithTheme | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addToCart: addToCartGlobal } = useCartContext();
  const { colors, emojis } = useThemeColors();

  // 🛡️ VALIDAÇÃO DE SEGURANÇA - SLUG INVÁLIDO
  useEffect(() => {
    console.log('📌 PARAMS RECEBIDOS:', params);
    console.log('📌 SLUG RECEBIDO:', slug);
    console.log('📌 URL ATUAL:', window.location.href);
    console.log('📌 PATHNAME:', window.location.pathname);
    
    if (!slug || slug === 'undefined' || slug.length < 2) {
      console.error('🚨 SLUG INVÁLIDO DETECTADO:', slug);
      setError('URL de promoção inválida');
      setLoading(false);
    }
  }, [slug, params]);

// 🛒 Sincronizar produtos - APENAS CONVERSÃO DE TIPO (SEM DESCONTO)
const syncProductsWithCart = useCallback((products: ProductWithAvailableStock[]): Product[] => {
  return products.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    original_price: product.original_price === null ? undefined : product.original_price,
    sale_price: product.sale_price === null ? undefined : product.sale_price,
    on_sale: product.on_sale ?? false,
    image_url: product.image_url,
    category: product.category,
    stock: product.available_stock,  // ← available_stock já está correto
    collection: (product as any).collection,
    rarity: (product as any).rarity,
    year: (product as any).year,
    condition: (product as any).condition,
    language: (product as any).language,
    description: (product as any).description,
  }));
}, []);  // ← Sem dependências

  // 🎯 Carregar página e produtos
useEffect(() => {
  const loadPage = async () => {
    if (!slug || slug === 'undefined' || slug.length < 2) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Carregando página promocional:', slug);
      
      const pageData = await promotionalPagesService.getPageBySlug(slug);
      
      if (!pageData) {
        setError('Página não encontrada ou expirada');
        setLoading(false);
        return;
      }
      
      console.log('🎨 TEMA CARREGADO:', pageData.theme ? {
        nome: pageData.theme.name,
        cores: pageData.theme.colors,
        emojis: pageData.theme.emojis
      } : 'Sem tema');
      
      setPage(pageData);
      
      // ✅ USAR NOVA FUNÇÃO COM ESTOQUE DISPONÍVEL
      const pageProducts = await promotionalPagesService.getPageProducts(pageData);
      
      // Buscar estoque disponível (considerando reservas)
      const allProductsWithStock = await getProductsWithAvailableStock();
      
      // Mapear estoque disponível para os produtos da página
      const productsWithAvailableStock = pageProducts.map(product => {
        const stockInfo = allProductsWithStock.find(p => p.id === product.id);
        return {
          ...product,
          available_stock: stockInfo?.available_stock ?? product.stock
        } as ProductWithAvailableStock;
      });
      
      const syncedProducts = syncProductsWithCart(productsWithAvailableStock);
      setProducts(syncedProducts);
      
      console.log(`✅ Página carregada: ${pageData.title} (${syncedProducts.length} produtos)`);
      
    } catch (err) {
      console.error('❌ Erro ao carregar página:', err);
      setError('Erro ao carregar página promocional');
    } finally {
      setLoading(false);
    }
  };

  loadPage();
}, [slug, syncProductsWithCart]);

  // 🛒 Adicionar ao carrinho - CORRIGIDO
const handleAddToCart = (product: Product) => {
  const productId = String(product.id);
  
  console.log(`🛒 Adicionando ${product.name} ao carrinho`);
  
  // Apenas adicionar ao carrinho global
  addToCartGlobal(product);
  
  // Disparar evento para sincronizar outros componentes
  window.dispatchEvent(new CustomEvent('cartItemAdded', {
    detail: { 
      productId,
      productName: product.name,
      timestamp: Date.now()
    }
  }));
  
  console.log(`✅ ${product.name} adicionado ao carrinho`);
};

  // 🎨 Estilos dinâmicos baseados no TEMA DA PÁGINA
  const getPageStyles = () => {
    if (page?.theme && page.theme.colors) {
      const theme = page.theme;
      console.log('🎨 APLICANDO TEMA:', theme.name);
      return {
        textColor: theme.colors.text || '#1f2937',
        backgroundColor: theme.colors.background || '#ffffff',
        primaryColor: theme.colors.primary || '#0066cc',
        accentColor: theme.colors.accent || '#4f46e5',
        cardBackground: theme.colors.cardBackground || '#ffffff',
        borderColor: theme.colors.border || '#e5e7eb',
      };
    }
    
    return {
      textColor: '#1f2937',
      backgroundColor: '#ffffff',
      primaryColor: '#0066cc',
      accentColor: '#4f46e5',
      cardBackground: '#ffffff',
      borderColor: '#e5e7eb',
    };
  };

  const pageStyles = getPageStyles();

  // 🛡️ SE ERRO OU SLUG INVÁLIDO
  if (error || !slug || slug === 'undefined' || slug.length < 2) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: colors.background,
        color: colors.text
      }}>
        <Header hideSearch={true} />
        <main style={{ 
          maxWidth: '800px',
          margin: '0 auto', 
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '72px', 
            marginBottom: '24px'
          }}>🔍</div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            URL inválida
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#6b7280',
            marginBottom: '32px'
          }}>
            O link que você acessou não é válido.
          </p>
          <Link 
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: colors.primary,
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            ← Voltar para a loja
          </Link>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: colors.background,
        color: colors.text
      }}>
        <Header hideSearch={true} />
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px' 
        }}>
          <div style={{ 
            fontSize: '64px', 
            marginBottom: '16px',
            animation: 'pulse 2s infinite'
          }}>🎨</div>
          <p style={{ 
            fontSize: '18px', 
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            Carregando promoção...
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#9ca3af'
          }}>
            {slug}
          </p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: colors.background,
        color: colors.text
      }}>
        <Header hideSearch={true} />
        <main style={{ 
          maxWidth: '800px',
          margin: '0 auto', 
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '72px', 
            marginBottom: '24px'
          }}>😕</div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700',
            marginBottom: '16px'
          }}>
            {error || 'Página não encontrada'}
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#6b7280',
            marginBottom: '32px'
          }}>
            A página promocional que você está procurando não existe ou expirou.
          </p>
          <Link 
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: colors.primary,
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            ← Voltar para a loja
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: pageStyles.backgroundColor,
      color: pageStyles.textColor
    }}>
      <Header hideSearch={true} />

      {/* 🎨 HERO SIMPLIFICADO */}
      <section style={{
        position: 'relative',
        minHeight: '400px',
        marginBottom: '60px',
        overflow: 'hidden'
      }}>
        {/* Overlay escuro SIMPLES (Controlado via painel) */}
        {(page as any).show_overlay !== false && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2
          }} />
        )}
        
        {page.hero_image_url ? (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${page.hero_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }} />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${pageStyles.primaryColor}80 0%, ${pageStyles.accentColor}80 100%)`,
            zIndex: 1
          }} />
        )}
        
        {/* Conteúdo do hero */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          maxWidth: '900px',
          margin: '0 auto',
          padding: '60px 20px 100px',
          textAlign: 'center',
          color: 'white'
        }}>
          {page.title && (
            <h1 style={{
              fontSize: 'clamp(2rem, 6vw, 4.5rem)',
              fontWeight: '900',
              letterSpacing: '-0.02em',
              marginBottom: '24px',
              lineHeight: '1.2',
              textShadow: '-2px -2px 0 rgba(0,0,0,0.8), 2px -2px 0 rgba(0,0,0,0.8), -2px 2px 0 rgba(0,0,0,0.8), 2px 2px 0 rgba(0,0,0,0.8), 0 8px 25px rgba(0,0,0,0.8), 0 4px 10px rgba(0,0,0,0.9)',
              whiteSpace: 'pre-wrap'
            }}>
              {page.title}
            </h1>
          )}
          
          {page.description && (
            <p style={{
              fontSize: 'clamp(1.05rem, 3vw, 1.35rem)',
              fontWeight: '600',
              maxWidth: '750px',
              margin: '0 auto',
              lineHeight: '1.6',
              textShadow: '-1px -1px 0 rgba(0,0,0,0.8), 1px -1px 0 rgba(0,0,0,0.8), -1px 1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8), 0 4px 15px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,1)',
              whiteSpace: 'pre-wrap'
            }}>
              {page.description}
            </p>
          )}
        </div>
      </section>

      <main style={{ 
        maxWidth: '1400px',
        margin: '0 auto', 
        padding: '0 20px 60px'
      }}>
        {/* 📊 CONTADOR DE PRODUTOS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '0 20px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: pageStyles.textColor
          }}>
            Produtos em destaque
          </h2>
        </div>

        {/* 🎯 GRID DE PRODUTOS */}
        {products.length > 0 ? (
          <div 
            className="product-grid-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
              padding: '20px'
            }}
          >
            {products.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                categoryConfig={{
                  color: pageStyles.primaryColor,
                  icon: page.theme?.emojis?.cart || '🎯',
                  badgeText: page.filters?.category?.toUpperCase() || 'PROMO'
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', 
            padding: '80px 20px',
            background: pageStyles.cardBackground,
            borderRadius: '20px',
            border: `1px solid ${pageStyles.primaryColor}20`
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
              {page.theme?.emojis?.search || emojis?.search || '📭'}
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '8px',
              color: pageStyles.textColor
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
              Esta promoção não tem produtos disponíveis no momento.
            </p>
            <Link 
              href="/"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: pageStyles.primaryColor,
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ← Voltar para a loja
            </Link>
          </div>
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

        @media (max-width: 640px) {
          .product-grid-container {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
            padding: 10px;
          }
        }

        @media (max-width: 480px) {
          .product-grid-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}