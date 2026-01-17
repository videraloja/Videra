'use client';

import React, { useRef, useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { CarouselConfig } from '../types';
import { useThemeColors } from '../../hooks/useThemeColors';

interface CarouselProps {
  title: string;
  products: Product[];
  config: CarouselConfig;
  showViewAll?: boolean;
  onViewAll?: () => void;
  categoryConfig?: {
    color: string;
    icon: string;
    badgeText: string;
  };
  onAddToCart: (product: Product) => void;
}

export default function Carousel({
  title,
  products,
  config,
  showViewAll = false,
  onViewAll,
  categoryConfig,
  onAddToCart
}: CarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const { colors, getShadow } = useThemeColors();

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const scrollAmount = 320 + 24; // Largura do card + gap
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
    carouselRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  // Auto scroll se configurado
  useEffect(() => {
    if (!config.auto_scroll || !carouselRef.current) return;

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
        
        if (carouselRef.current.scrollLeft >= maxScroll) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: 320 + 24, behavior: 'smooth' });
        }
      }
    }, config.auto_scroll_interval);

    return () => clearInterval(interval);
  }, [config.auto_scroll, config.auto_scroll_interval]);

  if (products.length === 0) return null;

  return (
    <div style={{ marginBottom: '60px' }}>
      {/* Cabeçalho do Carrossel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '0 8px'
      }}>
        <h3 style={{
          fontSize: `${config.title_font_size}px`,
          fontWeight: config.title_font_weight,
          color: config.title_text_color,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {categoryConfig?.icon && (
            <span style={{ fontSize: `${config.title_font_size}px` }}>
              {categoryConfig.icon}
            </span>
          )}
          {title}
          {config.show_badges && config.badge_bg_color && (
            <span style={{
              backgroundColor: config.badge_bg_color,
              color: config.badge_text_color,
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: `${Math.max(config.title_font_size - 8, 12)}px`,
              fontWeight: '600',
              marginLeft: '12px'
            }}>
              {categoryConfig?.badgeText || 'NEW'}
            </span>
          )}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {showViewAll && onViewAll && (
  <button
    onClick={onViewAll}
    style={{
      padding: '8px 16px',
      background: config.view_all_button_bg_color || 'transparent',
      color: config.view_all_button_text_color || colors.primary,
      border: `1px solid ${config.view_all_button_border_color || colors.primary}`,
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = config.view_all_button_hover_bg_color || colors.primary;
      e.currentTarget.style.color = config.view_all_button_hover_text_color || 'white';
      e.currentTarget.style.borderColor = config.view_all_button_hover_border_color || colors.primary;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = config.view_all_button_bg_color || 'transparent';
      e.currentTarget.style.color = config.view_all_button_text_color || colors.primary;
      e.currentTarget.style.borderColor = config.view_all_button_border_color || colors.primary;
    }}
  >
    Ver Todos
  </button>
)}
          
          {config.show_arrows && products.length > config.items_per_view && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => scroll('left')}
                style={{
                  padding: '8px 12px',
                  background: config.arrow_bg_color,
                  color: config.arrow_text_color,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = config.arrow_hover_bg_color;
                  e.currentTarget.style.color = config.arrow_hover_text_color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = config.arrow_bg_color;
                  e.currentTarget.style.color = config.arrow_text_color;
                }}
              >
                ◀
              </button>
              <button
                onClick={() => scroll('right')}
                style={{
                  padding: '8px 12px',
                  background: config.arrow_bg_color,
                  color: config.arrow_text_color,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = config.arrow_hover_bg_color;
                  e.currentTarget.style.color = config.arrow_hover_text_color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = config.arrow_bg_color;
                  e.currentTarget.style.color = config.arrow_text_color;
                }}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Carrossel de Produtos */}
      <div style={{ position: 'relative' }}>
        {config.show_arrows && products.length > config.items_per_view && (
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '0',
            transform: 'translateY(-50%)',
            background: colors.secondary,
            color: colors.text,
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

        <div
          ref={carouselRef}
          style={{
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            flexWrap: 'nowrap',
            scrollBehavior: 'smooth',
            padding: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: `${colors.secondary} transparent`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {products.map((product) => (
            <div key={product.id} style={{ flex: '0 0 auto' }}>
              <ProductCard 
                product={product}
                categoryConfig={categoryConfig}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}