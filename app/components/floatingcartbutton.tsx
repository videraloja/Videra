// components/floatingcartbutton.tsx - ATUALIZADO COM CART CONTEXT
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useCartContext } from '../contexts/CartContext'; // 🆕 Importar Cart Context

export default function FloatingCartButton() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  
  // 🎨 HOOK DE TEMAS
  const { colors, emojis, getShadow, isSpecialTheme } = useThemeColors();
  
  // 🛠️ USAR CART CONTEXT em vez de localStorage
  const { cart } = useCartContext();
  
  // Calcular quantidade de itens do contexto
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const hasItems = itemCount > 0;

  // Lógica de rolagem para mostrar/esconder
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

  // Não mostrar o botão em páginas admin e na própria página do carrinho
  if (pathname?.startsWith('/admin') || pathname === '/cart' || !isVisible) {
    return null;
  }

  return (
    <Link 
      href="/cart" 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '60px',
        height: '60px',
        background: colors.primary,
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        textDecoration: 'none',
        boxShadow: getShadow('large'),
        border: isSpecialTheme ? `2px solid ${colors.accent}` : 'none',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        transform: hasItems ? 'scale(1.1)' : 'scale(1)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = hasItems ? 'scale(1.2)' : 'scale(1.1)';
        e.currentTarget.style.boxShadow = getShadow('large') + ', 0 0 20px ' + colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = hasItems ? 'scale(1.1)' : 'scale(1)';
        e.currentTarget.style.boxShadow = getShadow('large');
      }}
      aria-label="Ver carrinho"
    >
      {emojis.cart}
      
      {/* Badge de itens no carrinho */}
      {hasItems && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: colors.accent,
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          fontSize: '12px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${colors.background}`,
          animation: itemCount > 0 ? 'pulse 2s infinite' : 'none'
        }}>
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  );
}