// hooks/useAvailableStock.ts
import { useEffect, useState } from 'react';
import { getProductsWithAvailableStock, ProductWithAvailableStock } from '@/lib/productService';
import { Product } from '@/app/types';

export const useAvailableStock = (products: Product[]) => {
  const [syncedProducts, setSyncedProducts] = useState<Product[]>(products);

  const syncWithReservations = async () => {
    // Buscar produtos com estoque disponível (considerando reservas)
    const productsWithStock = await getProductsWithAvailableStock();
    
    // Atualizar estoque dos produtos
    const updated = products.map(product => {
      const stockInfo = productsWithStock.find(p => p.id === product.id);
      const availableStock = stockInfo?.available_stock ?? product.stock;
      
      return {
        ...product,
        stock: availableStock
      };
    });
    
    setSyncedProducts(updated);
  };

  useEffect(() => {
    if (products.length === 0) return;

    syncWithReservations();

    // Atualizar a cada 30 segundos (opcional)
    const interval = setInterval(syncWithReservations, 30000);

    return () => clearInterval(interval);
  }, [products]);

  return { syncedProducts, refreshStock: syncWithReservations };
};