// lib/productService.ts
import { supabase } from './supabaseClient';

export interface ProductWithAvailableStock {
  id: number;
  name: string;
  price: number;
  original_price?: number | null | undefined;
  sale_price?: number | null | undefined;
  on_sale?: boolean | null | undefined;
  image_url: string;
  category?: string;
  stock: number;
  available_stock: number;
  [key: string]: any;
}

export const getProductsWithAvailableStock = async (): Promise<ProductWithAvailableStock[]> => {
  // Buscar todos os produtos
  const { data: products, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
  
  // Buscar reservas ativas (não expiradas)
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('product_id, quantity')
    .gte('expires_at', new Date().toISOString());
  
  if (resError) {
    console.error('Erro ao buscar reservas:', resError);
    return products.map(p => ({ ...p, available_stock: p.stock }));
  }
  
  // Calcular total reservado por produto
  const reservedByProduct: Record<number, number> = {};
  reservations?.forEach(res => {
    reservedByProduct[res.product_id] = (reservedByProduct[res.product_id] || 0) + res.quantity;
  });
  
  // Calcular estoque disponível = stock real - reservas ativas
  return products.map(product => ({
    ...product,
    available_stock: Math.max(0, product.stock - (reservedByProduct[product.id] || 0))
  }));
};

// Buscar um produto específico com estoque disponível
export const getProductWithAvailableStockById = async (productId: number): Promise<ProductWithAvailableStock | null> => {
  const products = await getProductsWithAvailableStock();
  return products.find(p => p.id === productId) || null;
};