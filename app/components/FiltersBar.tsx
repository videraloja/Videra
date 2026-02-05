// app/components/FiltersBar.tsx - VERSÃO COM SUPORTE A IMAGENS
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

// Tipos para os filtros (MANTIDO IGUAL)
export type PokemonFilter = 
  | 'colecoes' | 'etbs' | 'decks'
  | 'unitarios' | 'triplos' | 'quadruplos'
  | 'box' | 'mini-box' | 'booster-box';

export type BoardGameFilter = 
  | 'tabuleiros' | 'cartas' | 'baralhos'
  | 'ate-50' | 'ate-100' | 'ate-200';

// 🆕 INTERFACE ATUALIZADA - Agora com imageUrl
interface FilterItem {
  id: string;
  name: string;
  emoji: string;
  hasPopup?: boolean;
  imageUrl?: string; // ✅ NOVO: URL da imagem personalizada
}

interface FiltersBarProps {
  // Configuração geral (MANTIDO IGUAL)
  category: 'pokemon' | 'board-games';
  
  // Estado dos filtros (MANTIDO IGUAL)
  activeFilters: string[];
  onFilterToggle: (filter: string) => void;
  
  // Coleções disponíveis (MANTIDO IGUAL)
  collections?: string[];
  onCollectionSelect?: (collection: string) => void;
  
  // Configuração visual (MANTIDO IGUAL)
  isExpanded: boolean;
  onToggle: () => void;
}

// 🎨 CORES DO TEMA BRANCO/LUZ (MANTIDO IGUAL)
const LIGHT_THEME = {
  // Cores principais (MANTIDO IGUAL)
  background: '#ffffff',
  cardBg: '#f8f9fa',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  
  // Bordas (MANTIDO IGUAL)
  border: '#e5e7eb',
  borderHover: '#d1d5db',
  
  // Cores dos filtros Pokémon (MANTIDO IGUAL)
  pokemonColors: {
    'colecoes': '#ef4444',
    'etbs': '#3b82f6',
    'decks': '#8b5cf6',
    'unitarios': '#10b981',
    'triplos': '#f59e0b',
    'quadruplos': '#6366f1',
    'box': '#ec4899',
    'mini-box': '#14b8a6',
    'booster-box': '#f97316'
  },
  
  // Cores dos filtros Jogos de Tabuleiro (MANTIDO IGUAL)
  boardGameColors: {
    'tabuleiros': '#059669',
    'cartas': '#7c3aed',
    'baralhos': '#dc2626',
    'ate-50': '#3b82f6',
    'ate-100': '#f59e0b',
    'ate-200': '#8b5cf6'
  }
};

// 🆕 FUNÇÃO AUXILIAR PARA OBTER URL DA IMAGEM
const getFilterImageUrl = (filterId: string): string | undefined => {
  // Tenta carregar imagem personalizada
  // Exemplo: para 'colecoes' -> '/filters/colecoes.png'
  // Você pode mudar o caminho se quiser
  return `/filters/${filterId}.png`;
};

// 🆕 CONFIGURAÇÃO DOS QUADRADINHOS POKÉMON (com URLs de imagem)
const POKEMON_FILTERS: FilterItem[] = [
  // Linha 1 - COM URL DE IMAGEM
  { 
    id: 'colecoes', 
    name: 'Coleções', 
    emoji: '📦', 
    hasPopup: true,
    imageUrl: getFilterImageUrl('colecoes') // ✅ IMAGEM PERSONALIZADA
  },
  { 
    id: 'etbs', 
    name: 'ETBs', 
    emoji: '🎁',
    imageUrl: getFilterImageUrl('etbs') // ✅ IMAGEM PERSONALIZADA
  },
  { 
    id: 'decks', 
    name: 'Decks', 
    emoji: '🃏',
    imageUrl: getFilterImageUrl('decks') // ✅ IMAGEM PERSONALIZADA
  },
  
  // Linha 2
  { 
    id: 'unitarios', 
    name: 'Unitários', 
    emoji: '✨',
    imageUrl: getFilterImageUrl('unitarios') // ✅ IMAGEM PERSONALIZADA
  },
  { 
    id: 'triplos', 
    name: 'Triplos', 
    emoji: '🔶',
    imageUrl: getFilterImageUrl('triplos') // ✅ IMAGEM PERSONALIZADA
  },
  { 
    id: 'quadruplos', 
    name: 'Quádruplos', 
    emoji: '🔷',
    imageUrl: getFilterImageUrl('quadruplos') // ✅ IMAGEM PERSONALIZADA
  },
  
  // Linha 3
  { 
    id: 'box', 
    name: 'Box', 
    emoji: '📦',
    imageUrl: getFilterImageUrl('box') // ✅ IMAGEM PERSONALIZADA
  },
  { 
    id: 'mini-box', 
    name: 'Mini box', 
    emoji: '📦',
    imageUrl: getFilterImageUrl('mini-box') // ✅ IMAGEM PERSONALIZADA
  },
  { 
    id: 'booster-box', 
    name: 'Booster Box', 
    emoji: '🎯',
    imageUrl: getFilterImageUrl('booster-box') // ✅ IMAGEM PERSONALIZADA
  },
];

// 🆕 CONFIGURAÇÃO DOS QUADRADINHOS JOGOS DE TABULEIRO (sem imagens por enquanto)
const BOARD_GAME_FILTERS: FilterItem[] = [
  // Linha 1 (sem imagens - usa emoji)
  { id: 'tabuleiros', name: 'Tabuleiros', emoji: '🎲' },
  { id: 'cartas', name: 'Cartas', emoji: '🃏' },
  { id: 'baralhos', name: 'Baralhos', emoji: '♠️' },
  
  // Linha 2 (sem imagens - usa emoji)
  { id: 'ate-50', name: '< R$50', emoji: '💰' },
  { id: 'ate-100', name: '< R$100', emoji: '💰' },
  { id: 'ate-200', name: '< R$200', emoji: '💰' },
];

export default function FiltersBar({
  category,
  activeFilters,
  onFilterToggle,
  collections = [],
  onCollectionSelect,
  isExpanded,
  onToggle
}: FiltersBarProps) {
  const [showCollectionsPopup, setShowCollectionsPopup] = useState(false);
  const [tempSelectedCollections, setTempSelectedCollections] = useState<string[]>([]);
  
  // Estado para rastrear imagens que falharam ao carregar
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // Configuração baseada na categoria
  const filtersConfig = category === 'pokemon' ? POKEMON_FILTERS : BOARD_GAME_FILTERS;
  
  // NORMALIZAÇÃO DE ID (remove acentos) - MANTIDO IGUAL
  const normalizeCollectionId = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };
  
  // Quando abre o POPUP: inicializa com seleções atuais - MANTIDO IGUAL
  useEffect(() => {
    if (showCollectionsPopup && collections.length > 0) {
      const activeCollections = collections.filter(collection => {
        const collectionId = normalizeCollectionId(collection);
        const collectionFilterId = `colecao:${collectionId}`;
        return activeFilters.includes(collectionFilterId);
      });
      setTempSelectedCollections(activeCollections);
    }
  }, [showCollectionsPopup, collections, activeFilters]);
  
  // Handler para clique nos quadradinhos - MANTIDO IGUAL
  const handleFilterClick = (filterId: string, hasPopup?: boolean) => {
    if (hasPopup) {
      setShowCollectionsPopup(true);
    } else {
      onFilterToggle(filterId);
    }
  };
  
  // 🆕 HANDLER PARA ERRO DE CARREGAMENTO DE IMAGEM
  const handleImageError = (filterId: string) => {
    setFailedImages(prev => new Set(prev).add(filterId));
  };
  
  // 🆕 RESETA ERROS QUANDO MUDAR DE CATEGORIA OU EXPANDIR
  useEffect(() => {
    setFailedImages(new Set());
  }, [category, isExpanded]);
  
  // TOGGLE TEMPORÁRIO NO POPUP - MANTIDO IGUAL
  const handleTempToggle = (collection: string) => {
    setTempSelectedCollections(prev => 
      prev.includes(collection)
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };
  
  // APLICAR SELEÇÕES - MANTIDO IGUAL
  const handleApplySelections = () => {
    if (onCollectionSelect) {
      // Primeiro remove todas as coleções atuais
      const collectionFiltersToRemove = activeFilters.filter(f => f.startsWith('colecao:'));
      collectionFiltersToRemove.forEach(filter => {
        onFilterToggle(filter); // Desativa cada filtro de coleção
      });
      
      // Depois adiciona as novas seleções
      tempSelectedCollections.forEach(collection => {
        onCollectionSelect(collection);
      });
    }
    setShowCollectionsPopup(false);
  };
  
  // LIMPAR TODAS AS SELEÇÕES - MANTIDO IGUAL
  const handleClearSelections = () => {
    setTempSelectedCollections([]);
  };
  
  // Função para pegar a cor do filtro - MANTIDO IGUAL
  const getFilterColor = (filterId: string) => {
    if (category === 'pokemon') {
      return LIGHT_THEME.pokemonColors[filterId as keyof typeof LIGHT_THEME.pokemonColors] || '#3b82f6';
    } else {
      return LIGHT_THEME.boardGameColors[filterId as keyof typeof LIGHT_THEME.boardGameColors] || '#3b82f6';
    }
  };
  
  // VERIFICA SE UMA COLEÇÃO ESTÁ SELECIONADA TEMPORARIAMENTE - MANTIDO IGUAL
  const isTempSelected = (collection: string) => {
    return tempSelectedCollections.includes(collection);
  };
  
  // Verifica se uma coleção específica está ativa - MANTIDO IGUAL
  const isCollectionActive = (collection: string) => {
    const collectionId = normalizeCollectionId(collection);
    const collectionFilterId = `colecao:${collectionId}`;
    return activeFilters.includes(collectionFilterId);
  };
  
  return (
    <div style={{
      marginBottom: '32px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* BARRA DE CONTROLE - COMPACTA (MANTIDO IGUAL) */}
      <div 
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: LIGHT_THEME.background,
          borderRadius: '6px',
          border: `1px solid ${LIGHT_THEME.border}`,
          cursor: 'pointer',
          marginBottom: isExpanded ? '16px' : '0',
          transition: 'all 0.2s ease',
          height: '44px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = LIGHT_THEME.borderHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = LIGHT_THEME.border;
        }}
      >
        {/* TEXTO SIMPLES "FILTROS" (MANTIDO IGUAL) */}
        <span style={{
          fontSize: '15px',
          fontWeight: '600',
          color: LIGHT_THEME.text,
          margin: 0
        }}>
          Filtros
        </span>
        
        {/* SETINHA PARA EXPANDIR/RETRAIR (MANTIDO IGUAL) */}
        <span style={{ 
          fontSize: '13px',
          color: LIGHT_THEME.textSecondary,
          transition: 'transform 0.2s ease'
        }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>
      
      {/* ÁREA EXPANDIDA COM QUADRADINHOS - COMPACTA (SÓ NO DESKTOP) */}
      {isExpanded && (
        <div 
          className="filters-expanded-area"
          style={{
            padding: '20px',
            background: LIGHT_THEME.background,
            borderRadius: '6px',
            border: `1px solid ${LIGHT_THEME.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {/* GRID 3x3 DE QUADRADINHOS - COMPACTO */}
          <div 
            className="filters-grid-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}
          >
            {filtersConfig.map((filter) => {
              const isActive = activeFilters.includes(filter.id);
              const filterColor = getFilterColor(filter.id);
              
              // 🆕 VERIFICA SE DEVE MOSTRAR IMAGEM OU EMOJI
              const showImage = filter.imageUrl && !failedImages.has(filter.id);
              
              return (
                <button
                  key={filter.id}
                  onClick={() => handleFilterClick(filter.id, filter.hasPopup)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 8px',
                    background: isActive ? filterColor : LIGHT_THEME.cardBg,
                    border: `2px solid ${isActive ? filterColor : LIGHT_THEME.border}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '100px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = filterColor;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = LIGHT_THEME.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* EFEITO DE BRILHO NO FUNDO (quando ativo) */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      right: '-50%',
                      bottom: '-50%',
                      background: `radial-gradient(circle, ${filterColor}20 0%, transparent 70%)`
                    }} />
                  )}
                  
                  {/* 🆕 IMAGEM PERSONALIZADA OU EMOJI */}
                  <div style={{
                    marginBottom: '6px',
                    filter: isActive ? 'brightness(1.2)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    zIndex: 1,
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {showImage ? (
                      <div style={{
                        position: 'relative',
                        width: '48px',
                        height: '48px'
                      }}>
                        <Image
                          src={filter.imageUrl!}
                          alt={filter.name}
                          fill
                          sizes="48px"
                          style={{
                            objectFit: 'contain'
                          }}
                          onError={() => handleImageError(filter.id)}
                        />
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '32px',
                        lineHeight: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {filter.emoji}
                      </div>
                    )}
                  </div>
                  
                  {/* NOME DO FILTRO */}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: isActive ? 'white' : LIGHT_THEME.text,
                    textAlign: 'center',
                    lineHeight: '1.3',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {filter.name}
                  </span>
                  
                  {/* INDICADOR DE SELEÇÃO (SEM ✓) */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '12px',
                      height: '12px',
                      background: 'white',
                      borderRadius: '50%'
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* POPUP DE COLECÕES - SEM TÍTULO E CONTADOR (MANTIDO IGUAL) */}
      {showCollectionsPopup && collections.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
          backdropFilter: 'blur(2px)'
        }}>
          <div 
            style={{
              background: LIGHT_THEME.background,
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '450px',
              width: '100%',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: `1px solid ${LIGHT_THEME.border}`,
              animation: 'scaleIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABEÇALHO APENAS COM BOTÃO X (SEM TÍTULO) */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => setShowCollectionsPopup(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: LIGHT_THEME.textSecondary,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = LIGHT_THEME.cardBg;
                  e.currentTarget.style.color = LIGHT_THEME.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = LIGHT_THEME.textSecondary;
                }}
              >
                ✕
              </button>
            </div>
            
            {/* LISTA DE COLECÕES COM CHECKBOXES (MANTIDO IGUAL) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '6px',
              marginBottom: '20px'
            }}>
              {collections.map((collection) => {
                const isSelected = isTempSelected(collection);
                
                return (
                  <button
                    key={collection}
                    onClick={() => handleTempToggle(collection)}
                    style={{
                      padding: '12px 14px',
                      background: isSelected ? '#f0f9ff' : LIGHT_THEME.cardBg,
                      border: `1px solid ${isSelected ? '#0ea5e9' : LIGHT_THEME.border}`,
                      borderRadius: '6px',
                      color: LIGHT_THEME.text,
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0ea5e9';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isSelected ? '#0ea5e9' : LIGHT_THEME.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* NOME DA COLEÇÃO */}
                    <span style={{
                      color: isSelected ? '#0ea5e9' : LIGHT_THEME.text,
                      fontWeight: isSelected ? '600' : '500'
                    }}>
                      {collection}
                    </span>
                    
                    {/* CHECKBOX ESTILIZADO */}
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: isSelected ? '#0ea5e9' : LIGHT_THEME.cardBg,
                      border: `2px solid ${isSelected ? '#0ea5e9' : LIGHT_THEME.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      {isSelected && (
                        <span style={{
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* BOTÕES DE AÇÃO (MANTIDO IGUAL) */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={handleClearSelections}
                disabled={tempSelectedCollections.length === 0}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: `1px solid ${tempSelectedCollections.length === 0 ? LIGHT_THEME.border : '#dc2626'}`,
                  color: tempSelectedCollections.length === 0 ? LIGHT_THEME.textSecondary : '#dc2626',
                  borderRadius: '8px',
                  cursor: tempSelectedCollections.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  flex: 1,
                  transition: 'all 0.2s ease',
                  opacity: tempSelectedCollections.length === 0 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (tempSelectedCollections.length > 0) {
                    e.currentTarget.style.background = '#fee2e2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tempSelectedCollections.length > 0) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                Limpar
              </button>
              
              <button
                onClick={handleApplySelections}
                style={{
                  padding: '12px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  flex: 2,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>✅</span>
                Aplicar {tempSelectedCollections.length > 0 ? `(${tempSelectedCollections.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        /* ESTILOS PARA DESKTOP (telas grandes) */
        @media (min-width: 1024px) {
          /* ÁREA EXPANDIDA MAIS COMPACTA NO DESKTOP */
          .filters-expanded-area {
            padding: 20px !important;
            width: 600px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 100% !important;
          }
          
          /* GRID MAIS COMPACTO NO DESKTOP */
          .filters-grid-container {
            gap: 10px !important;
          }
          
          /* QUADRADINHOS MAIS COMPACTOS NO DESKTOP */
          .filters-grid-container button {
            padding: 14px 6px !important;
            min-height: 95px !important;
          }
          
          /* IMAGENS/EMOJIS MAIS PEQUENOS NO DESKTOP */
          .filters-grid-container button > div:first-child {
            height: 40px !important;
            margin-bottom: 4px !important;
          }
          
          /* IMAGEM NO DESKTOP */
          .filters-grid-container button > div:first-child > div:first-child {
            width: 40px !important;
            height: 40px !important;
          }
          
          /* EMOJI NO DESKTOP */
          .filters-grid-container button > div:first-child > div:last-child {
            font-size: 28px !important;
            height: 40px !important;
          }
          
          /* TEXTO MAIS COMPACTO NO DESKTOP */
          .filters-grid-container button span {
            font-size: 12px !important;
          }
        }
        
        /* Custom scrollbar para o tema branco */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${LIGHT_THEME.cardBg};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${LIGHT_THEME.border};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${LIGHT_THEME.borderHover};
        }
      `}</style>
    </div>
  );
}