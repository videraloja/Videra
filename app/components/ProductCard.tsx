// components/ProductCard.tsx - VERSÃO ATUALIZADA COM CARRINHO GLOBAL
'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useStock } from '../../hooks/useStock';
import { useCartContext } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  categoryConfig?: {
    color: string;
    icon: string;
    badgeText: string;
  };
}

export default function ProductCard({ product, onAddToCart, categoryConfig }: ProductCardProps) {
  const { colors, emojis, getShadow, getCardStyles, applyCardStyles } = useThemeColors();
  const { stockLabel } = useStock();
  
  // 🆕 USAR O CONTEXTO GLOBAL DO CARRINHO
  const { isInCart, getItemQuantity } = useCartContext();
  
  const [isAdded, setIsAdded] = useState(false);
  const [quantityInCart, setQuantityInCart] = useState(0);
  const [currentStock, setCurrentStock] = useState(product.stock);
  
  // 🆕 SINCRONIZAR COM O CARRINHO GLOBAL
  useEffect(() => {
    const productId = String(product.id);
    
    const checkCartStatus = () => {
      const inCart = isInCart(productId);
      const quantity = getItemQuantity(productId);
      
      setIsAdded(inCart);
      setQuantityInCart(quantity);
      
      // Calcular estoque atual baseado na quantidade no carrinho
      const newStock = Math.max(product.stock - quantity, 0);
      setCurrentStock(newStock);
      
      console.log(`🔄 ProductCard ${product.name}: Carrinho=${quantity}, Estoque=${newStock}`);
    };
    
    // Verificar status inicial
    checkCartStatus();
    
    // 🆕 OUVIR EVENTOS DE ATUALIZAÇÃO DO CARRINHO
    const handleCartUpdate = (e: CustomEvent) => {
      if (e.detail && String(e.detail.productId) === String(product.id)) {
        checkCartStatus();
      }
    };

    const handleCartCleared = () => {
    console.log(`🧹 ProductCard ${product.name} recebeu evento de limpeza`);
    setIsAdded(false);
    setQuantityInCart(0);
  };
    
    window.addEventListener('cartStateUpdated', handleCartUpdate as EventListener);
    window.addEventListener('cart-updated', checkCartStatus);
    window.addEventListener('storage', checkCartStatus);
    window.addEventListener('cartCleared', handleCartCleared); // 🆕
    
    return () => {
      window.removeEventListener('cartStateUpdated', handleCartUpdate as EventListener);
      window.removeEventListener('cart-updated', checkCartStatus);
      window.removeEventListener('storage', checkCartStatus);
      window.removeEventListener('cartCleared', handleCartCleared);
    };
  }, [product.id, product.stock, isInCart, getItemQuantity]);

  const stockInfo = stockLabel(currentStock);
  const displayPrice = product.on_sale ? product.sale_price! : product.price;
  const originalPrice = product.on_sale ? product.original_price : undefined;
  
  // Configuração de categoria padrão se não for fornecida
  const defaultConfig = {
    color: colors.primary,
    icon: '📦',
    badgeText: 'PRODUTO'
  };
  
  const config = categoryConfig || defaultConfig;

  // 🎨 OBTER ESTILOS GRANULARES DO CARD
  const cardStyles = getCardStyles();
  
  // 🎯 CORREÇÃO 1: DIMENSÕES FIXAS DO CARD
  const cardContainerStyles = {
    width: '280px', // Largura fixa
    minHeight: '420px', // Altura mínima garantida
    maxHeight: '480px', // Altura máxima
    display: 'flex',
    flexDirection: 'column' as const,
  };

  // 🎯 CORREÇÃO 2: CONTAINER DO BOTÃO COM ALTURA FIXA
  const buttonContainerStyles = {
    height: '50px', // Altura fixa para evitar redimensionamento
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto' // Empurra para baixo
  };

  const handleAddToCart = () => {
    if (currentStock <= 0) return;
    
    // Chamar a função de adicionar ao carrinho
    onAddToCart(product);
    
    // 🆕 ATUALIZAÇÃO IMEDIATA DO ESTADO LOCAL
    setIsAdded(true);
    const newQuantity = quantityInCart + 1;
    setQuantityInCart(newQuantity);
    setCurrentStock(prev => Math.max(prev - 1, 0));
    
    // Feedback visual
    const button = document.getElementById(`add-to-cart-${product.id}`);
    if (button) {
      const originalBackground = button.style.background;
      button.style.background = '#10b981';
      
      setTimeout(() => {
        button.style.background = originalBackground;
      }, 300);
    }
  };

  // 🎨 FUNÇÃO PARA OBTER CONTEÚDO DO BOTÃO
  const getButtonContent = () => {
    if (currentStock === 0) return 'Esgotado';
    if (isAdded) return `✓ Adicionado (${quantityInCart})`;
    return `${config.icon} Adicionar ao Carrinho`;
  };

  // 🆕 FUNÇÃO PARA OBTER COR DO BOTÃO
  const getButtonColor = () => {
    if (currentStock === 0) return cardStyles.addToCart.disabledBackgroundColor;
    if (isAdded) return '#10b981'; // Verde para "Adicionado"
    return cardStyles.addToCart.backgroundColor;
  };

  // 🆕 FUNÇÃO PARA OBTER COR DO BOTÃO NO HOVER
  const getButtonHoverColor = () => {
    if (currentStock === 0) return cardStyles.addToCart.disabledBackgroundColor;
    if (isAdded) return '#0da271'; // Verde mais escuro
    return cardStyles.addToCart.hoverBackgroundColor;
  };

  return (
    <div
    className="product-card-mobile-optimized"
      style={{
        ...cardContainerStyles,
        background: cardStyles.cardBackground,
        border: `1px solid ${cardStyles.borderColor}`,
        borderRadius: cardStyles.cornerRadius,
        overflow: 'hidden',
        boxShadow: cardStyles.shadow,
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = cardStyles.hoverShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = cardStyles.shadow;
      }}
    >
    
      {/* Badge de Promoção */}
      {product.on_sale && originalPrice && (
        <div style={{
          ...applyCardStyles('badgeDiscount', {
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: '700',
            zIndex: 2
          })
        }}>
          🔥 {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
        </div>
      )}
      
      {/* Imagem do Produto */}
      <div style={{
        width: '100%',
        height: '200px', // Altura fixa para imagens
        overflow: 'hidden',
        position: 'relative',
        background: cardStyles.imageOverlay
      }}>
        <img 
          src={product.image_url} 
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

      </div>

      {/* Conteúdo do Card */}
      <div style={{ 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flex: '1', // Ocupa espaço restante
        minHeight: '220px' // Altura mínima do conteúdo
      }}>
        {/* Nome do Produto */}
        <h3 style={{
          ...applyCardStyles('productName', {
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '1.3',
            height: '42px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: '8px'
          })
        }}>
          {product.name}
        </h3>

        
        {/* Preços */}
        <div style={{ marginBottom: '12px' }}>
          {product.on_sale && originalPrice && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <span style={{
                ...applyCardStyles('originalPrice', {
                  fontSize: '14px',
                  fontWeight: '500'
                })
              }}>
                R$ {originalPrice.toFixed(2)}
              </span>
              <span style={{
                ...applyCardStyles('salePrice', {
                  fontSize: '18px',
                  fontWeight: '700'
                })
              }}>
                R$ {displayPrice.toFixed(2)}
              </span>
            </div>
          )}
          {!product.on_sale && (
            <span style={{
              ...applyCardStyles('price', {
                fontSize: '18px',
                fontWeight: '700'
              })
            }}>
              R$ {displayPrice.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Informações de Estoque */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '14px' }}>{stockInfo.icon}</span>
          <span style={{
            ...applyCardStyles('stockInfo', {
              fontSize: '14px',
              fontWeight: '500'
            })
          }}>
            {stockInfo.text}
          </span>
        </div>
        
        {/* 🎯 CONTAINER DO BOTÃO COM ALTURA FIXA */}
        <div style={buttonContainerStyles}>
          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAddToCart}
            disabled={currentStock === 0}
            style={{
              ...applyCardStyles('addToCart', {
                width: '100%',
                height: '44px', // Altura fixa
                padding: '12px 16px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: currentStock === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // 🆕 COR DINÂMICA BASEADA NO ESTADO
                backgroundColor: getButtonColor()
              })
            }}
            onMouseEnter={(e) => {
              if (currentStock > 0) {
                e.currentTarget.style.background = getButtonHoverColor();
              }
            }}
            onMouseLeave={(e) => {
              if (currentStock > 0) {
                e.currentTarget.style.background = getButtonColor();
              }
            }}
          >
            {getButtonContent()}
          </button>
        </div>
      </div>
    </div>
  );
}