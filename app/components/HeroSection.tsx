'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { heroBannerService, HeroBanner } from '@/lib/heroBannerService';
import styles from './HeroSection.module.css';

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
  const [isMobile, setIsMobile] = useState(false);

  // Carregar banners
  useEffect(() => {
    const controller = new AbortController();

    const loadBanners = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const activeBanners = await heroBannerService.getActiveBanners(controller.signal);
        setBanners(activeBanners);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao carregar banners:', err);
          setError('Não foi possível carregar os banners promocionais.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    loadBanners();
    return () => { controller.abort(); };
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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner atual */}
      <Link 
        href={currentBanner.link_url}
        className="hero-link"
      >
        <div className="hero-image-wrapper">
          {/* Renderiza as duas imagens (desktop e mobile) e usa CSS para mostrar a correta. */}
          {/* Isso permite que o Next.js otimize o preload corretamente para diferentes tamanhos de tela. */}
          <Image
            key={`${currentBanner.id}-desktop`}
            src={currentBanner.image_url}
            alt="Banner promocional"
            fill
            className={styles.heroImageDesktop}
            sizes="(max-width: 1440px) calc(100vw - 40px), 1400px"
            priority={currentIndex === 0}
          />
          <Image
            key={`${currentBanner.id}-mobile`}
            src={currentBanner.image_mobile_url || currentBanner.image_url}
            alt="Banner promocional"
            fill
            className={styles.heroImageMobile}
            sizes="(max-width: 1440px) calc(100vw - 40px), 1400px"
            priority={currentIndex === 0}
          />
        </div>
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
            className="arrow-button arrow-left"
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
            className="arrow-button arrow-right"
            aria-label="Próximo banner"
          >
            ▶
          </button>
        </div>
      )}

      {/* Indicadores (dots) */}
      {showDots && banners.length > 1 && (
        <div className="dots-container">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`dot ${index === currentIndex ? 'dot-active' : 'dot-inactive'}`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .hero-section {
          position: relative;
          width: 100%;
          margin-top: 24px;
          margin-bottom: 24px;
          overflow: hidden;
          cursor: grab;
          border-radius: 24px;
        }

        .hero-link {
          display: block;
          width: 100%;
          height: 100%;
          text-decoration: none;
        }

        .hero-image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* 
          Ajuste para usar aspect-ratio em vez de altura fixa.
          Isso garante que o contêiner do banner sempre tenha a mesma proporção 
          da imagem, evitando cortes indesejados.
        */

        /* Desktop e Tablet (>= 768px) - usa a proporção da imagem desktop */
        .hero-section {
          aspect-ratio: 1920 / 600;
          height: auto; /* Remove a altura fixa para permitir que a proporção funcione */
          border-radius: 24px;
        }

        /* Tablet (768px - 1199px) */
        @media (max-width: 1199px) {
          .hero-section {
            border-radius: 20px;
            margin-top: 20px;
            margin-bottom: 20px;
          }
        }

        /* Mobile (<= 767px) - usa a proporção da imagem mobile */
        @media (max-width: 767px) {
          .hero-section {
            aspect-ratio: 750 / 600;
            border-radius: 16px;
            margin-top: 16px;
            margin-bottom: 16px;
          }
        }

        /* Setas */
        .desktop-arrows {
          display: block;
        }

        .arrow-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 24px;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .arrow-button:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: translateY(-50%) scale(1.05);
        }

        .arrow-left {
          left: 20px;
        }

        .arrow-right {
          right: 20px;
        }

        @media (max-width: 768px) {
          .desktop-arrows {
            display: none;
          }
        }

        /* Dots (indicadores) */
        .dots-container {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 8px;
          z-index: 10;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }

        .dot-active {
          background: white;
          transform: scale(1.2);
        }

        .dot-inactive {
          background: rgba(255, 255, 255, 0.5);
        }

        .dot-inactive:hover {
          background: rgba(255, 255, 255, 0.8);
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .dots-container {
            bottom: 16px;
            gap: 10px;
          }

          .dot {
            width: 10px;
            height: 10px;
          }

          .dot-active {
            transform: scale(1.1);
          }
        }

        @media (max-width: 480px) {
          .dots-container {
            bottom: 12px;
            gap: 8px;
          }

          .dot {
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
    </section>
  );
}