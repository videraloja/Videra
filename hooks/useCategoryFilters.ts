// hooks/useCategoryFilters.ts - VERSÃO SIMPLIFICADA
'use client';

import { Product } from '../app/types';
import { useCallback } from 'react';
import { getCollectionName } from '@/lib/collections';

export const useCategoryFilters = () => {
  // FILTROS POKÉMON
  const filterPokemon = useCallback((products: Product[], filters: string[]) => {
    if (filters.length === 0 || products.length === 0) {
      return products;
    }
    
    let filtered = [...products];
    
    // Filtros por TIPO
    const typeFilters = filters.filter(f => 
      ['etbs', 'decks', 'unitarios', 'triplos', 'quadruplos', 'box', 'mini-box', 'booster-box'].includes(f)
    );
    
    if (typeFilters.length > 0) {
      filtered = filtered.filter(product => {
        const productType = (product.product_type || '').toLowerCase();
        const productName = (product.name || '').toLowerCase();
        
        return typeFilters.some(filter => {
          const typeMapping: Record<string, string[]> = {
            'etbs': ['elite-trainer-box', 'etb', 'elite trainer'],
            'booster-box': ['booster-box', 'booster', 'display'],
            'decks': ['deck', 'baralho', 'pré-construído'],
            'unitarios': ['unidade', 'single', 'avulsa'],
            'triplos': ['triplo', '3x', 'três'],
            'quadruplos': ['quádruplo', '4x', 'quatro'],
            'box': ['box', 'caixa'],
            'mini-box': ['mini box', 'minibox', 'caixa pequena']
          };
          
          const searchTerms = typeMapping[filter] || [filter];
          
          if (searchTerms.some(term => productType.includes(term))) {
            return true;
          }
          
          return searchTerms.some(term => productName.includes(term));
        });
      });
    }
    
    // FILTROS POR COLEÇÃO (VERSÃO CORRIGIDA - REMOVE ACENTOS)
const collectionFilters = filters.filter(f => 
  f.startsWith('colecao:') || f === 'colecoes'
);

console.log('🔍 FILTROS DE COLEÇÃO ATIVOS:', collectionFilters);

if (collectionFilters.length > 0) {
  if (collectionFilters.includes('colecoes')) {
    // Filtro genérico "todas as coleções"
    filtered = filtered.filter(product => 
      !!product.collection && product.collection.trim() !== ''
    );
  } else {
    // Filtro por coleção específica (REMOVENDO ACENTOS)
    filtered = filtered.filter(product => {
      const matches = collectionFilters.some(filter => {
        if (filter.startsWith('colecao:')) {
          // Normaliza o filtro (remove acentos, lowercase)
          const filterCollectionId = filter
            .replace('colecao:', '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // 🔥 REMOVE ACENTOS
            .trim();
          
          // Normaliza a coleção do produto
          const productCollection = (product.collection || '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // 🔥 REMOVE ACENTOS
            .trim();
          
          // Debug para coleções problemáticas
          if (filterCollectionId.includes('dominio') || productCollection.includes('dominio')) {
            console.log('🔍🔥 COMPARAÇÃO DOMÍNIO DRACÔNICO:', {
              filtroOriginal: filter,
              filtroNormalizado: filterCollectionId,
              produtoOriginal: product.collection,
              produtoNormalizado: productCollection,
              nomeProduto: product.name,
              match: filterCollectionId === productCollection
            });
          }
          
          return filterCollectionId === productCollection;
        }
        return false;
      });
      
      return matches;
    });
  }
  
  console.log('📊 RESULTADO FILTRAGEM:', {
    totalProdutos: products.length,
    produtosFiltrados: filtered.length,
    filtrosAplicados: collectionFilters
  });
}
    
    return filtered;
  }, []);

  // FILTROS JOGOS DE TABULEIRO (mantido igual)
  const filterBoardGames = useCallback((products: Product[], filters: string[]) => {
    if (filters.length === 0 || products.length === 0) return products;
    
    let filtered = [...products];
    
    const typeFilters = filters.filter(f => 
      ['tabuleiros', 'cartas', 'baralhos'].includes(f)
    );
    
    if (typeFilters.length > 0) {
      filtered = filtered.filter(product => {
        const productType = (product.product_type || '').toLowerCase();
        const productName = (product.name || '').toLowerCase();
        
        return typeFilters.some(filter => {
          const typeMapping: Record<string, string[]> = {
            'tabuleiros': ['tabuleiro', 'board game', 'jogo de tabuleiro'],
            'cartas': ['carta', 'card game', 'jogo de cartas'],
            'baralhos': ['baralho', 'deck', 'pacote de cartas']
          };
          
          const searchTerms = typeMapping[filter] || [filter];
          
          if (searchTerms.some(term => productType.includes(term))) {
            return true;
          }
          
          return searchTerms.some(term => productName.includes(term));
        });
      });
    }
    
    const priceFilters = filters.filter(f => 
      ['ate-50', 'ate-100', 'ate-200'].includes(f)
    );
    
    if (priceFilters.length > 0) {
      filtered = filtered.filter(product => {
        return priceFilters.some(filter => {
          switch (filter) {
            case 'ate-50': return product.price <= 50;
            case 'ate-100': return product.price <= 100;
            case 'ate-200': return product.price <= 200;
            default: return true;
          }
        });
      });
    }
    
    return filtered;
  }, []);

  // ✅ OBTÉM COLECÕES (usa getCollectionName do lib/collections)
  const getPokemonCollections = useCallback((products: Product[]): string[] => {
    if (products.length === 0) return [];
    
    const collectionIds = products
      .map(p => p.collection)
      .filter((c): c is string => !!c && c.trim() !== '');
    
    const displayNames = collectionIds.map(id => getCollectionName(id));
    
    return [...new Set(displayNames)].sort((a, b) => a.localeCompare(b));
  }, []);

  const getProductTypes = useCallback((products: Product[]): string[] => {
    if (products.length === 0) return [];
    
    const types = products
      .map(p => p.product_type)
      .filter((t): t is string => !!t && t.trim() !== '');
    
    return [...new Set(types)].sort((a, b) => a.localeCompare(b));
  }, []);

  return {
    filterPokemon,
    filterBoardGames,
    getPokemonCollections,
    getProductTypes
  };
};