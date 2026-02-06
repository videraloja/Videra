'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { heroBannerService, HeroBanner } from '@/lib/heroBannerService';

interface HeroSectionProps {
  autoPlay?: boolean;
  showDots?: boolean;
  transitionTime?: number;
}

export default function HeroSection({ 
  autoPlay = true, 
  showDots = true,
  transitionTime = 5 
}: HeroSectionProps) {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Carregar banners
  useEffect(() => {
    const loadBanners = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const activeBanners = await heroBannerService.getActiveBanners();
        setBanners(activeBanners);
      } catch (err) {
        console.error('Erro ao carregar banners:', err);
        setError('Não foi possível carregar os banners promocionais.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBanners();
  }, []);

  // Carrossel automático
  useEffect(() => {
    if (!autoPlay || banners.length <= 1 || isHovering) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, (banners[currentIndex]?.transition_time || transitionTime) * 1000);

    return () => clearInterval(interval);
  }, [autoPlay, banners, currentIndex, isHovering, transitionTime]);

  // Funções de navegação
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  }, [banners.length]);

  // Touch events para mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (Math.abs(distance) < minSwipeDistance) return;
    
    if (distance > 0) {
      nextSlide(); // Swipe para esquerda
    } else {
      prevSlide(); // Swipe para direita
    }
  };

  // Estados de loading/error
  if (isLoading || error || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <section 
      className="hero-section"
      style={{
        position: 'relative',
        borderRadius: '24px',
        marginBottom: '40px',
        overflow: 'hidden',
        height: '400px',
        width: '100%',
        cursor: 'grab'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner atual */}
      <Link 
        href={currentBanner.link_url}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          position: 'relative',
          textDecoration: 'none'
        }}
      >
        <Image
          src={currentBanner.image_url}
          alt="Banner promocional"
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          sizes="100vw"
          priority={currentIndex === 0}
        />
      </Link>

      {/* Setas - apenas desktop */}
      {banners.length > 1 && (
        <div className="desktop-arrows">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              border: 'none',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '24px',
              zIndex: 10,
              transition: 'all 0.3s ease'
            }}
            aria-label="Banner anterior"
          >
            ◀
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              border: 'none',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '24px',
              zIndex: 10,
              transition: 'all 0.3s ease'
            }}
            aria-label="Próximo banner"
          >
            ▶
          </button>
        </div>
      )}

      {/* Indicadores (dots) */}
      {showDots && banners.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          zIndex: 10
        }}>
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(index);
              }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: 'none',
                background: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease'
              }}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .hero-section {
            height: 300px !important;
            border-radius: 16px !important;
            margin-bottom: 30px !important;
          }

          .desktop-arrows {
            display: none !important;
          }

          button[aria-label^="Ir para banner"] {
            width: 16px !important;
            height: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .hero-section {
            height: 250px !important;
            border-radius: 12px !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </section>
  );
}