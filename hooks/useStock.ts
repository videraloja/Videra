'use client';

export const useStock = () => {
  const stockLabel = (stock: number) => {
    if (stock === 0) return { text: 'Esgotado', color: '#ef4444', icon: '❌' };
    if (stock === 1) return { text: 'Última unidade!', color: '#dc2626', icon: '⚡' };
    if (stock <= 3) return { text: `Apenas ${stock} unidade(s)`, color: '#f59e0b', icon: '🔥' };
    if (stock <= 10) return { text: `${stock} unidades`, color: '#059669', icon: '📦' };
    return { text: `${stock} unidades`, color: '#059669', icon: '📦' };
  };

  return {
    stockLabel
  };
};