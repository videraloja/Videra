// app/components/ProductCard.tsx - VERSÃO COM next/image (OTIMIZAÇÃO DE IMAGENS)
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product as BaseProduct } from '../types';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useStock } from '../../hooks/useStock';
import { useCartContext } from '../contexts/CartContext';

interface Product extends BaseProduct {
  is_preorder?: boolean;
}

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
  const { colors, getCardStyles, applyCardStyles } = useThemeColors();
  const { stockLabel } = useStock();
  const { isInCart, getItemQuantity } = useCartContext();

  const [isAdded, setIsAdded] = useState(false);
  const [quantityInCart, setQuantityInCart] = useState(0);
  const [currentStock, setCurrentStock] = useState(product.stock);

  useEffect(() => {
    const productId = String(product.id);

    const checkCartStatus = () => {
      const inCart = isInCart(productId);
      const quantity = getItemQuantity(productId);
      setIsAdded(inCart);
      setQuantityInCart(quantity);
      setCurrentStock(Math.max(product.stock - quantity, 0));
    };

    checkCartStatus();

    const handleCartUpdate = (e: CustomEvent) => {
      if (e.detail && String(e.detail.productId) === productId) checkCartStatus();
    };

    const handleCartCleared = () => {
      setIsAdded(false);
      setQuantityInCart(0);
      setCurrentStock(product.stock);
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
  }, [product.id, product.stock, isInCart, getItemQuantity]);

  const stockInfo = stockLabel(currentStock);
  const displayPrice = product.on_sale ? product.sale_price! : product.price;
  const originalPrice = product.on_sale ? product.original_price : undefined;

  const defaultConfig = {
    color: colors.primary,
    icon: '📦',
    badgeText: 'PRODUTO'
  };
  const config = categoryConfig || defaultConfig;
  const cardStyles = getCardStyles();

  const handleAddToCart = () => {
    if (currentStock <= 0) return;
    onAddToCart(product);
    setIsAdded(true);
    setQuantityInCart(prev => prev + 1);
    setCurrentStock(prev => Math.max(prev - 1, 0));
  };

  const getButtonContent = () => {
    if (product.is_preorder) {
      return currentStock > 0 ? 'Reservar!' : 'Esgotado';
    }
    if (currentStock === 0) {
      return 'Esgotado';
    }
    if (isAdded) {
      return `✓ Adicionado (${quantityInCart})`;
    }
    return 'Adicionar ao Carrinho';
  };

  const getButtonColor = () => {
    if (currentStock === 0) return cardStyles.addToCart.disabledBackgroundColor;
    return cardStyles.addToCart.backgroundColor;
  };

  const getButtonHoverColor = () => {
    if (currentStock === 0) return cardStyles.addToCart.disabledBackgroundColor;
    return cardStyles.addToCart.hoverBackgroundColor;
  };

  return (
    <div
      className="product-card-mobile-optimized"
      style={{
        width: '100%',
        minHeight: '420px',
        maxHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
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

      {/* Container da imagem com next/image */}
      <div style={{
        width: '100%',
        height: '200px',
        overflow: 'hidden',
        position: 'relative',
        background: cardStyles.imageOverlay
      }}>
        <Image
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          fill
          sizes="280px"
          style={{ objectFit: 'cover' }}
          priority={false}
          unoptimized
        />
      </div>

      <div style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flex: '1',
        minHeight: '220px'
      }}>
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

        <div style={{ marginBottom: '12px' }}>
          {product.on_sale && originalPrice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={applyCardStyles('originalPrice', { fontSize: '14px', fontWeight: '500' })}>
                R$ {originalPrice.toFixed(2)}
              </span>
              <span style={applyCardStyles('salePrice', { fontSize: '18px', fontWeight: '700' })}>
                R$ {displayPrice.toFixed(2)}
              </span>
            </div>
          )}
          {!product.on_sale && (
            <span style={applyCardStyles('price', { fontSize: '18px', fontWeight: '700' })}>
              R$ {displayPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* 🆕 LÓGICA CONDICIONAL PARA ESTOQUE OU PRÉ-VENDA */}
        {product.is_preorder ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', background: '#f3e8ff', color: '#7c3aed', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
            <span style={{ fontSize: '14px' }}>📦</span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              Pré-venda
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px' }}>{stockInfo.icon}</span>
            <span style={applyCardStyles('stockInfo', { fontSize: '14px', fontWeight: '500' })}>
              {stockInfo.text}
            </span>
          </div>
        )}

        <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto' }}>
          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAddToCart}
            disabled={currentStock === 0}
            style={{
              ...applyCardStyles('addToCart', {
                width: '100%',
                height: '44px',
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
                backgroundColor: getButtonColor()
              })
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
    </div>
  );
}