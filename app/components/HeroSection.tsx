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
          <Image
            src={currentBanner.image_url}
            alt="Banner promocional"
            fill
            className="hero-image"
            sizes="100vw"
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
          margin-bottom: 40px;
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

        .hero-image {
          object-fit: cover;
          object-position: center;
          background-color: #f3f4f6;
        }

        /* Desktop (>= 1200px) */
        .hero-section {
          height: 500px;
          border-radius: 24px;
        }

        /* Tablet (768px - 1199px) */
        @media (max-width: 1199px) {
          .hero-section {
            height: 400px;
            border-radius: 20px;
            margin-bottom: 32px;
          }
        }

        /* Mobile (<= 767px) */
        @media (max-width: 767px) {
          .hero-section {
            height: 320px;
            border-radius: 16px;
            margin-bottom: 24px;
          }

          .hero-image {
            object-fit: cover;
            object-position: center 40%;
          }
        }

        /* Mobile pequeno (<= 480px) */
        @media (max-width: 480px) {
          .hero-section {
            height: 280px;
            border-radius: 12px;
            margin-bottom: 20px;
          }

          .hero-image {
            object-fit: cover;
            object-position: center 45%;
          }
        }

        /* Mobile muito pequeno (<= 380px) */
        @media (max-width: 380px) {
          .hero-section {
            height: 240px;
          }

          .hero-image {
            object-position: center 50%;
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