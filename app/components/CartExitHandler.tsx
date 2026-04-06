'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function CartExitHandler() {
  const pathname = usePathname();
  
  useEffect(() => {
    const wasInCart = sessionStorage.getItem('wasInCart');
    const isInCart = pathname?.includes('/cart');
    
    // Se veio do carrinho e agora não está mais no carrinho
    if (wasInCart === 'true' && !isInCart) {
      sessionStorage.removeItem('wasInCart');
      // Recarregar a página para sincronizar tudo
      window.location.reload();
    }
  }, [pathname]);
  
  return null;
}