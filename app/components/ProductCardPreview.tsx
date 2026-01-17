// app/components/ProductCardPreview.tsx - VERSÃO SIMPLIFICADA
'use client';

import React from 'react';
import { ProductCardStyles } from '../types';
import { useThemeColors } from '../../hooks/useThemeColors';

interface ProductCardPreviewProps {
  cardStyles?: ProductCardStyles;
}

export function ProductCardPreview({ cardStyles }: ProductCardPreviewProps) {
  const { getCardStyles } = useThemeColors();

  // Usar estilos personalizados ou do tema
  const styles = cardStyles || getCardStyles();

  // 🆕 FUNÇÃO PARA APLICAR ESTILOS CORRETAMENTE
  const applyPreviewStyles = (element: keyof ProductCardStyles, defaultStyles: React.CSSProperties) => {
    const elementStyles = styles[element];
    
    if (!elementStyles) return defaultStyles;

    // 🎨 APLICAR ESTILOS DE TEXTO
    if (typeof elementStyles === 'object' && 'color' in elementStyles) {
      const textStyles = elementStyles as any;
      return {
        ...defaultStyles,
        color: textStyles.color,
        fontSize: textStyles.fontSize,
        fontWeight: textStyles.fontWeight,
        textDecoration: textStyles.strikethrough ? 'line-through' : 'none',
        textAlign: textStyles.textAlign || 'left',
        fontFamily: textStyles.fontFamily || 'inherit'
      };
    }
    
    // 🎨 APLICAR ESTILOS DE BADGE
    if (typeof elementStyles === 'object' && 'backgroundColor' in elementStyles && 'textColor' in elementStyles) {
      const badgeStyles = elementStyles as any;
      return {
        ...defaultStyles,
        backgroundColor: badgeStyles.backgroundColor,
        color: badgeStyles.textColor,
        fontSize: badgeStyles.fontSize || '12px',
        fontWeight: badgeStyles.fontWeight || '700',
        borderRadius: badgeStyles.borderRadius || '12px',
        padding: badgeStyles.padding || '4px 8px'
      };
    }
    
    // 🎨 APLICAR ESTILOS DE BOTÃO
    if (typeof elementStyles === 'object' && 'hoverBackgroundColor' in elementStyles) {
      const buttonStyles = elementStyles as any;
      return {
        ...defaultStyles,
        backgroundColor: buttonStyles.backgroundColor,
        color: buttonStyles.textColor,
        borderRadius: buttonStyles.borderRadius || '8px',
        padding: buttonStyles.padding || '12px 16px',
        fontSize: buttonStyles.fontSize || '14px',
        fontWeight: buttonStyles.fontWeight || '600'
      };
    }
    
    // 🎨 APLICAR PROPRIEDADES SIMPLES
    if (typeof elementStyles === 'string') {
      if (element === 'cardBackground' || element === 'imageOverlay') {
        return { ...defaultStyles, background: elementStyles };
      }
      if (element === 'borderColor') {
        return { ...defaultStyles, borderColor: elementStyles };
      }
      if (element === 'shadow' || element === 'hoverShadow') {
        return { ...defaultStyles, boxShadow: elementStyles };
      }
      if (element === 'cornerRadius') {
        return { ...defaultStyles, borderRadius: elementStyles };
      }
      if ((element as any) === 'padding') {
        return { ...defaultStyles, padding: elementStyles };
      }
    }
    
    return defaultStyles;
  };

  // Produto de exemplo
  const sampleProduct = {
    id: 1,
    name: 'Pikachu Illustrator Card',
    price: 299.99,
    original_price: 399.99,
    sale_price: 299.99,
    on_sale: true,
    image_url: '/placeholder-product.jpg',
    stock: 5,
    category: 'Pokémon TCG',
    product_type: 'Card',
    collection: 'Base Set 1ª Edição',
    rarity: 'Ultra Raro',
    tags: ['raro', 'colecionável'],
    card_set: 'Base Set'
  };

  const stockInfo = {
    icon: '📦',
    text: '5 em estoque'
  };

  const displayPrice = sampleProduct.on_sale ? sampleProduct.sale_price! : sampleProduct.price;
  const originalPrice = sampleProduct.on_sale ? sampleProduct.original_price : undefined;

  const cardContainerStyles = {
    width: '280px',
    minHeight: '420px',
    maxHeight: '480px',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const buttonContainerStyles = {
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div
        style={{
          ...cardContainerStyles,
          background: styles.cardBackground,
          border: `1px solid ${styles.borderColor}`,
          borderRadius: styles.cornerRadius,
          overflow: 'hidden',
          boxShadow: styles.shadow,
          position: 'relative',
        }}
      >
        {/* Badge de Categoria */}
        <div style={{
          ...applyPreviewStyles('badgeType', {
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: '700',
            zIndex: 2
          })
        }}>
          POKÉMON
        </div>

        {/* Badge de Promoção */}
        {sampleProduct.on_sale && originalPrice && (
          <div style={{
            ...applyPreviewStyles('badgeDiscount', {
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
          height: '200px',
          overflow: 'hidden',
          position: 'relative',
          background: styles.imageOverlay
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Imagem do Produto
          </div>
          
          {/* Badge Urgente */}
          {sampleProduct.stock <= 3 && sampleProduct.stock > 0 && (
            <div style={{
              ...applyPreviewStyles('badgeUrgent', {
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700'
              })
            }}>
              ⚡ RÁPIDO!
            </div>
          )}
        </div>

        {/* Conteúdo do Card */}
        <div style={{ 
          ...applyPreviewStyles(('padding' as any), {
            display: 'flex',
            flexDirection: 'column',
            flex: '1',
            minHeight: '220px'
          })
        }}>
          {/* Nome do Produto */}
          <h3 style={{
            ...applyPreviewStyles('productName', {
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
            {sampleProduct.name}
          </h3>
          
          {/* Nome da Coleção */}
          {sampleProduct.collection && (
            <p style={{
              ...applyPreviewStyles('collectionName', {
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '12px'
              })
            }}>
              {sampleProduct.collection}
            </p>
          )}
          
          {/* Preços */}
          <div style={{ marginBottom: '12px' }}>
            {sampleProduct.on_sale && originalPrice && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }}>
                <span style={{
                  ...applyPreviewStyles('originalPrice', {
                    fontSize: '14px',
                    fontWeight: '500'
                  })
                }}>
                  R$ {originalPrice.toFixed(2)}
                </span>
                <span style={{
                  ...applyPreviewStyles('salePrice', {
                    fontSize: '18px',
                    fontWeight: '700'
                  })
                }}>
                  R$ {displayPrice.toFixed(2)}
                </span>
              </div>
            )}
            {!sampleProduct.on_sale && (
              <span style={{
                ...applyPreviewStyles('price', {
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
            <span style={{ fontSize: '14px' }}>
              {stockInfo.icon}
            </span>
            <span style={{
              ...applyPreviewStyles('stockInfo', {
                fontSize: '14px',
                fontWeight: '500'
              })
            }}>
              {stockInfo.text}
            </span>
          </div>
          
          {/* Container do Botão */}
          <div style={buttonContainerStyles}>
            <button
              style={{
                ...applyPreviewStyles('addToCart', {
                  width: '100%',
                  height: '44px',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                })
              }}
            >
              🛒 Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}