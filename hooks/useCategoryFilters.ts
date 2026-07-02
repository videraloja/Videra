// hooks/useCategoryFilters.ts - VERSÃO CORRIGIDA COM MAPEAMENTO EXATO
'use client';

import { Product } from '../app/types';
import { useCallback } from 'react';
import { getCollectionName } from '@/lib/collections';

export const useCategoryFilters = () => {
  // 🗺️ MAPEAMENTO EXATO: ID do filtro da UI -> Valores de product_type no banco
  const POKEMON_TYPE_MAP: Record<string, string[]> = {
    'etbs1': ['elite-trainer-box'],
    'decks': ['deck'],
    'unitarios': ['booster-pack', 'single'],
    'triplos': ['triple-box'],
    'quadruplos': ['quadruple-box'],
    'box': ['collection-box'],
    'mini-box': ['mini-box'],
    'booster-box': ['booster-box']
  };

  // FILTROS POKÉMON
  const filterPokemon = useCallback((products: Product[], filters: string[]) => {
    if (filters.length === 0 || products.length === 0) {
      return products;
    }
    
    let filtered = [...products];
    
    // 1. FILTROS POR TIPO (usando mapeamento exato)
    const typeFilters = filters.filter(f => 
      Object.keys(POKEMON_TYPE_MAP).includes(f)
    );
    
    if (typeFilters.length > 0) {
      filtered = filtered.filter(product => {
        const productType = (product.product_type || '').toLowerCase().trim();
        
        // Verifica se o product_type do produto corresponde a algum dos tipos mapeados
        return typeFilters.some(filterId => {
          const allowedTypes = POKEMON_TYPE_MAP[filterId];
          return allowedTypes.includes(productType);
        });
      });
    }
    
    // 2. FILTROS POR COLEÇÃO (mantido com normalização robusta)
    const collectionFilters = filters.filter(f => 
      f.startsWith('colecao:') || f === 'colecoes'
    );
    
    if (collectionFilters.length > 0) {
      if (collectionFilters.includes('colecoes')) {
        // Filtro genérico "todas as coleções" (produtos com qualquer coleção definida)
        filtered = filtered.filter(product => 
          !!product.collection && product.collection.trim() !== ''
        );
      } else {
        // Filtro por coleção específica (com remoção de acentos)
        filtered = filtered.filter(product => {
          return collectionFilters.some(filter => {
            if (filter.startsWith('colecao:')) {
              const filterCollectionId = filter
                .replace('colecao:', '')
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
                .trim();
              
              const productCollection = (product.collection || '')
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .trim();
              
              return filterCollectionId === productCollection;
            }
            return false;
          });
        });
      }
    }
    
    // Log para debug (opcional, pode remover depois)
    if (filters.length > 0) {
      console.log('🔍 [FILTROS POKÉMON]', {
        total: products.length,
        filtrados: filtered.length,
        filtros: filters
      });
    }
    
    return filtered;
  }, []);

  // FILTROS JOGOS DE TABULEIRO (mantido como estava, mas pode ser melhorado depois)
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

  // OBTÉM COLECÕES (usa getCollectionName do lib/collections)
  const getPokemonCollections = useCallback((products: Product[]): string[] => {
    if (products.length === 0) return [];
    
    const collectionIds = products
      .map(p => p.collection)
      .filter((c): c is string => !!c && c.trim() !== '');
    
    const displayNames = collectionIds.map(id => {
      // Tenta obter o nome mapeado a partir do seu `lib/collections.ts`
      const mappedName = getCollectionName(id);
      
      // Se o nome mapeado for igual ao ID (ou seja, não encontrou um nome "bonito"),
      // nós criamos um nome legível a partir do slug.
      // Ex: "caos-ascendente" vira "Caos Ascendente"
      if (mappedName === id) {
        return id
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      return mappedName; // Retorna o nome bonito que já existia no seu mapeamento
    });
    
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