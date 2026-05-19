// components/FloatingCartButton.tsx – FAIXA COM IMAGEM PERSONALIZADA
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartContext } from '../contexts/CartContext';

const FallbackCartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export default function FloatingCartButton() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [bannerImgError, setBannerImgError] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();
  const bannerTimer = useRef<NodeJS.Timeout | null>(null);
  const prevItemCount = useRef(0);

  const { cart } = useCartContext();
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const hasItems = itemCount > 0;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (itemCount > prevItemCount.current) {
      setShowBanner(true);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      bannerTimer.current = setTimeout(() => {
        setShowBanner(false);
      }, 2000);
    }
    prevItemCount.current = itemCount;
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, [itemCount]);

  if (pathname?.startsWith('/admin') || pathname === '/cart' || !isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {/* Faixa personalizada */}
      {!bannerImgError && (
        <img
          src="/icones/faixa-adicionado.png"
          alt="Adicionado"
          style={{
            height: '36px',
            width: '120px',
            marginRight: '-8px',
            transition: 'all 0.3s ease',
            opacity: showBanner ? 1 : 0,
            transform: showBanner ? 'translateX(0)' : 'translateX(100%)',
            pointerEvents: 'none',
            zIndex: 999,
          }}
          onError={() => setBannerImgError(true)}
        />
      )}

      {/* Botão do carrinho */}
      <Link
        href="/cart"
        aria-label="Ver carrinho"
        style={{
          width: '60px',
          height: '60px',
          background: '#ffffff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
          border: `2px solid black`,
          transition: 'transform 0.25s ease',
          transform: hasItems ? 'scale(1.05)' : 'scale(1)',
          opacity: isVisible ? 1 : 0,
          pointerEvents: 'auto',
          zIndex: 1000,
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = hasItems ? 'scale(1.15)' : 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = hasItems ? 'scale(1.05)' : 'scale(1)';
        }}
      >
        {imgError ? (
          <FallbackCartIcon />
        ) : (
          <img
            src="/icones/carrinho.png"
            alt="Carrinho"
            width={44}
            height={44}
            style={{ objectFit: 'contain' }}
            onError={() => setImgError(true)}
          />
        )}

        {hasItems && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#E2521C',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid black`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            lineHeight: 1,
          }}>
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </Link>
    </div>
  );
}