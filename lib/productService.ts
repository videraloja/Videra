// lib/productService.ts - CORRIGIDO (usa RPC get_available_stock)
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
  created_at: string;
  supplier_code?: string;
  cost_price?: number;
  stock: number;
  available_stock: number;
  [key: string]: any;
}

export const getProductsWithAvailableStock = async (signal?: AbortSignal): Promise<ProductWithAvailableStock[]> => {
  // 1. Buscar todos os produtos
  let productsQuery = supabase
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (signal) productsQuery = productsQuery.abortSignal(signal);
  const { data: products, error } = await productsQuery;
  
  if (error) {
    if (error.name !== 'AbortError' && !error.message.includes('AbortError')) {
      console.error('Erro ao buscar produtos:', error);
    }
    return [];
  }

  if (!products || products.length === 0) {
    return [];
  }

  // 2. Buscar estoque disponível via RPC (funciona para usuários anônimos)
  const productIds = products.map(p => p.id);
  let rpcQuery = supabase.rpc('get_available_stock', {
    p_product_ids: productIds
  });

  if (signal) rpcQuery = rpcQuery.abortSignal(signal);
  const { data: stockData, error: rpcError } = await rpcQuery;

  if (rpcError) {
    if (rpcError.name !== 'AbortError' && !rpcError.message.includes('AbortError')) {
      console.error('Erro ao chamar get_available_stock RPC:', rpcError);
    }
    // Fallback: retornar produtos com stock bruto
    return products.map(p => ({ ...p, available_stock: p.stock }));
  }

  // 3. Criar mapa product_id -> available_stock
  const stockMap = new Map<number, number>();
  stockData?.forEach((item: { product_id: number; available_stock: number }) => {
    stockMap.set(item.product_id, item.available_stock);
  });

  // 4. Montar resultado
  return products.map(product => ({
    ...product,
    available_stock: stockMap.get(product.id) ?? product.stock
  }));
};

// Buscar um produto específico com estoque disponível
export const getProductWithAvailableStockById = async (productId: number): Promise<ProductWithAvailableStock | null> => {
  const products = await getProductsWithAvailableStock();
  return products.find(p => p.id === productId) || null;
};