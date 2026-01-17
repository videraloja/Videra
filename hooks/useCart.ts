'use client';

import { useState, useEffect } from 'react';
import { CartItem, Product } from '../app/types';

export const useCart = () => {
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

  const persistState = (nextCart: CartItem[], nextProducts: Product[]) => {
    setCart(nextCart);
    try {
      localStorage.setItem('cart', JSON.stringify(nextCart));
      localStorage.setItem('products', JSON.stringify(nextProducts));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
    window.dispatchEvent(new Event('cart-updated'));
  };

  // 🛠️ CORREÇÃO DEFINITIVA: Função addToCart corrigida
  const addToCart = (product: Product, products: Product[], setProducts: (products: Product[]) => void): CartItem[] => {
    if (product.stock <= 0) {
      console.warn(`Produto ${product.name} sem estoque disponível`);
      return cart;
    }

    // 🛠️ CORREÇÃO: Converter IDs para string para comparação segura
    const productId = String(product.id);

    // Atualizar estoque nos produtos
    const nextProducts = products.map((p) =>
      String(p.id) === productId ? { ...p, stock: Math.max(p.stock - 1, 0) } : p
    );

    // Procurar produto no carrinho (comparando strings)
    const existing = cart.find((c) => String(c.id) === productId);
    let nextCart: CartItem[];
    
    if (existing) {
      nextCart = cart.map((c) =>
        String(c.id) === productId ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      nextCart = [...cart, { ...product, quantity: 1 }];
    }

    persistState(nextCart, nextProducts);
    setProducts(nextProducts);
    
    return nextCart;
  };

  // 🛠️ NOVA FUNÇÃO: addToCartUniversal para qualquer fonte de produtos
  const addToCartUniversal = (
    product: Product, 
    sourceProducts: Product[], 
    setSourceProducts: (products: Product[]) => void,
    syncWithAllProducts?: (productId: string, newStock: number) => void
  ): CartItem[] => {
    if (product.stock <= 0) {
      console.warn(`Produto ${product.name} sem estoque disponível`);
      return cart;
    }

    const productId = String(product.id);
    
    // Atualizar estoque na fonte específica
    const updatedSourceProducts = sourceProducts.map(p =>
      String(p.id) === productId ? { ...p, stock: Math.max(p.stock - 1, 0) } : p
    );
    
    // Procurar no carrinho
    const existing = cart.find(c => String(c.id) === productId);
    let nextCart: CartItem[];
    
    if (existing) {
      nextCart = cart.map(c =>
        String(c.id) === productId ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      nextCart = [...cart, { ...product, quantity: 1 }];
    }

    // Atualizar estado da fonte
    setSourceProducts(updatedSourceProducts);
    
    // Se fornecido, sincronizar com todos os produtos
    if (syncWithAllProducts) {
      const cartItem = nextCart.find(item => String(item.id) === productId);
      const newStock = cartItem ? Math.max(product.stock - cartItem.quantity, 0) : product.stock;
      syncWithAllProducts(productId, newStock);
    }

    // Persistir estado
    setCart(nextCart);
    localStorage.setItem('cart', JSON.stringify(nextCart));
    window.dispatchEvent(new Event('cart-updated'));
    
    return nextCart;
  };

  // Manter outras funções existentes...
  const removeFromCart = (productId: string): CartItem[] => {
    const nextCart = cart.filter(item => String(item.id) !== productId);
    setCart(nextCart);
    localStorage.setItem('cart', JSON.stringify(nextCart));
    window.dispatchEvent(new Event('cart-updated'));
    return nextCart;
  };

  const updateQuantity = (productId: string, quantity: number): CartItem[] => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    
    const nextCart = cart.map(item =>
      String(item.id) === productId ? { ...item, quantity } : item
    );
    
    setCart(nextCart);
    localStorage.setItem('cart', JSON.stringify(nextCart));
    window.dispatchEvent(new Event('cart-updated'));
    return nextCart;
  };

  const clearCart = (): CartItem[] => {
    const emptyCart: CartItem[] = [];
    setCart(emptyCart);
    localStorage.setItem('cart', JSON.stringify(emptyCart));
    window.dispatchEvent(new Event('cart-updated'));
    return emptyCart;
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemQuantity = (productId: string): number => {
    const item = cart.find(item => String(item.id) === productId);
    return item ? item.quantity : 0;
  };

  return {
    cart,
    setCart,
    addToCart,
    addToCartUniversal, // 🆕 Nova função
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemQuantity,
    persistState
  };
};