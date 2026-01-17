'use client';

import { Product } from '../app/types';

export const useFilters = () => {
  const filterByPriceRange = (product: Product, priceRange: string) => {
    switch (priceRange) {
      case '0-50':
        return product.price <= 50;
      case '50-100':
        return product.price > 50 && product.price <= 100;
      case '100-200':
        return product.price > 100 && product.price <= 200;
      case '200+':
        return product.price > 200;
      default:
        return true;
    }
  };

  return {
    filterByPriceRange
  };
};