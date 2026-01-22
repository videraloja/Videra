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
  const [isMobile, setIsMobile] = useState(false);
  const { colors } = useThemeColors();

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const scrollAmount = 280 + 16;
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
          carouselRef.current.scrollBy({ left: 280 + 16, behavior: 'smooth' });
        }
      }
    }, config.auto_scroll_interval);

    return () => clearInterval(interval);
  }, [config.auto_scroll, config.auto_scroll_interval]);

  if (products.length === 0) return null;

  return (
    <div style={{ marginBottom: '40px', position: 'relative' }}>
      {/* Cabeçalho do Carrossel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '0 8px',
        minHeight: '40px' // Altura fixa para evitar quebras
      }}>
        {/* Título - SEM BADGE AO LADO */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: config.title_font_weight || '600',
          color: config.title_text_color || colors.text,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap', // 👈 IMPEDE QUEBRA DE LINHA
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '70%' // Limita largura para caber junto com botão
        }}>
          {categoryConfig?.icon && (
            <span style={{ fontSize: '20px', flexShrink: 0 }}>
              {categoryConfig.icon}
            </span>
          )}
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </span>
          {/* REMOVIDO: Badge ao lado do título */}
        </h3>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          flexShrink: 0 // 👈 Evita compressão
        }}>
          {showViewAll && onViewAll && (
            <button
              onClick={onViewAll}
              style={{
                padding: '6px 12px',
                background: config.view_all_button_bg_color || 'transparent',
                color: config.view_all_button_text_color || colors.primary,
                border: `1px solid ${config.view_all_button_border_color || colors.primary}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap' // 👈 Botão sem quebra
              }}
            >
              Ver Todos
            </button>
          )}
          
          {/* Setas - MOSTRAR APENAS EM DESKTOP */}
          {!isMobile && config.show_arrows && products.length > 2 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => scroll('left')}
                style={{
                  padding: '8px 12px',
                  background: config.arrow_bg_color || colors.primary,
                  color: config.arrow_text_color || 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                ◀
              </button>
              <button
                onClick={() => scroll('right')}
                style={{
                  padding: '8px 12px',
                  background: config.arrow_bg_color || colors.primary,
                  color: config.arrow_text_color || 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Carrossel de Produtos */}
      <div
        ref={carouselRef}
        className="carousel-container-mobile"
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          flexWrap: 'nowrap',
          scrollBehavior: 'smooth',
          padding: '8px',
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
  );
}