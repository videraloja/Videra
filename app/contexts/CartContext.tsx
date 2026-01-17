'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  getOriginalStock: (productId: string) => number; // 🆕 NOVA FUNÇÃO
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Carregar carrinho do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    }
  }, []);

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // 🆕 FUNÇÃO: Obter estoque original de um produto
  const getOriginalStock = (productId: string): number => {
    // Primeiro, buscar do localStorage 'original_products' (estoque inicial)
    const savedOriginal = localStorage.getItem('original_products');
    if (savedOriginal) {
      try {
        const originalProducts: Product[] = JSON.parse(savedOriginal);
        const originalProduct = originalProducts.find(p => String(p.id) === productId);
        if (originalProduct) {
          return originalProduct.stock;
        }
      } catch (error) {
        console.error('Erro ao ler original_products:', error);
      }
    }
    
    // Se não encontrar, buscar do localStorage 'products' (estoque atual)
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      try {
        const products: Product[] = JSON.parse(savedProducts);
        const productInStorage = products.find(p => String(p.id) === productId);
        if (productInStorage) {
          return productInStorage.stock;
        }
      } catch (error) {
        console.error('Erro ao ler products:', error);
      }
    }
    
    // Se não encontrar em nenhum lugar, retornar 0
    console.warn(`Produto ${productId} não encontrado no localStorage`);
    return 0;
  };

  const addToCart = (product: Product) => {
    const productId = String(product.id);
    
    setCart(prevCart => {
      const existing = prevCart.find(item => String(item.id) === productId);
      
      if (existing) {
        return prevCart.map(item =>
          String(item.id) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => String(item.id) !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        String(item.id) === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);

   // 🛠️ IMPORTANTE: Também limpar localStorage
  localStorage.removeItem('cart');
  
   window.dispatchEvent(new Event('cartCleared'));
   window.dispatchEvent(new Event('storage'));
  };
  
  const getItemQuantity = (productId: string): number => {
    const item = cart.find(item => String(item.id) === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId: string): boolean => {
    return cart.some(item => String(item.id) === productId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        isInCart,
        getOriginalStock // 🆕 ADICIONADA AO CONTEXTO
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}