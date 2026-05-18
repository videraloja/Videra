// components/FloatingCartButton.tsx – CORRIGIDO (usa <img> para fallback confiável)
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
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
  const pathname = usePathname();

  const { colors } = useThemeColors();
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

  if (pathname?.startsWith('/admin') || pathname === '/cart' || !isVisible) {
    return null;
  }

  return (
    <Link
      href="/cart"
      aria-label="Ver carrinho"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
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
        zIndex: 1000,
        transition: 'all 0.25s ease',
        transform: hasItems ? 'scale(1.05)' : 'scale(1)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = hasItems ? 'scale(1.15)' : 'scale(1.08)';
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.25), 0 0 0 4px rgba(245,158,11,0.4)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = hasItems ? 'scale(1.05)' : 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* Ícone personalizado com fallback SVG */}
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
  );
}