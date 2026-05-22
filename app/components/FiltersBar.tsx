// app/components/FiltersBar.tsx – BOTÃO "COLEÇÕES" ATIVO COM FILTROS DE COLEÇÃO
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export type PokemonFilter = 
  | 'colecoes' | 'etbs1' | 'decks'
  | 'unitarios' | 'triplos' | 'quadruplos'
  | 'box' | 'mini-box' | 'booster-box';

export type BoardGameFilter = 
  | 'tabuleiros' | 'cartas' | 'baralhos'
  | 'ate-50' | 'ate-100' | 'ate-200';

interface FilterItem {
  id: string;
  name: string;
  emoji: string;
  hasPopup?: boolean;
  imageUrl?: string;
}

interface FiltersBarProps {
  category: 'pokemon' | 'board-games';
  activeFilters: string[];
  onFilterToggle: (filter: string | null) => void; // Modificado para aceitar null para limpar todos
  collections?: string[];
  onCollectionSelect?: (collection: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const getFilterImageUrl = (filterId: string): string | undefined => {
  return `/filters/${filterId}.png`;
};

const POKEMON_FILTERS: FilterItem[] = [
  { id: 'colecoes', name: 'Coleções', emoji: '📦', hasPopup: true, imageUrl: getFilterImageUrl('colecoes') },
  { id: 'etbs1', name: 'ETBs', emoji: '🎁', imageUrl: getFilterImageUrl('etbs1') },
  { id: 'decks', name: 'Decks', emoji: '🃏', imageUrl: getFilterImageUrl('decks') },
  { id: 'unitarios', name: 'Unitários', emoji: '✨', imageUrl: getFilterImageUrl('unitarios') },
  { id: 'triplos', name: 'Triplos', emoji: '🔶', imageUrl: getFilterImageUrl('triplos') },
  { id: 'quadruplos', name: 'Quádruplos', emoji: '🔷', imageUrl: getFilterImageUrl('quadruplos') },
  { id: 'box', name: 'Box', emoji: '📦', imageUrl: getFilterImageUrl('box') },
  { id: 'mini-box', name: 'Mini box', emoji: '📦', imageUrl: getFilterImageUrl('mini-box') },
  { id: 'booster-box', name: 'Booster Box', emoji: '🎯', imageUrl: getFilterImageUrl('booster-box') },
];

const BOARD_GAME_FILTERS: FilterItem[] = [
  { id: 'tabuleiros', name: 'Tabuleiros', emoji: '🎲' },
  { id: 'cartas', name: 'Cartas', emoji: '🃏' },
  { id: 'baralhos', name: 'Baralhos', emoji: '♠️' },
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
  onToggle,
}: FiltersBarProps) {
  const [showCollectionsPopup, setShowCollectionsPopup] = useState(false);
  const [tempSelectedCollections, setTempSelectedCollections] = useState<string[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [gridExpanded, setGridExpanded] = useState(false);

  const filtersConfig = category === 'pokemon' ? POKEMON_FILTERS : BOARD_GAME_FILTERS;

  const normalizeCollectionId = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  useEffect(() => {
    if (showCollectionsPopup && collections.length > 0) {
      const activeCollections = collections.filter(collection => {
        const collectionId = normalizeCollectionId(collection);
        return activeFilters.includes(`colecao:${collectionId}`);
      });
      setTempSelectedCollections(activeCollections);
    }
  }, [showCollectionsPopup, collections, activeFilters]);

  const handleFilterClick = (filterId: string, hasPopup?: boolean) => {
    if (hasPopup) {
      setShowCollectionsPopup(true);
    } else {
      onFilterToggle(filterId);
    }
  };

  const handleImageError = (filterId: string) => {
    setFailedImages(prev => new Set(prev).add(filterId));
  };

  const handleTempToggle = (collection: string) => {
    if (onCollectionSelect && onFilterToggle) {
      const collectionId = normalizeCollectionId(collection);
      const filterId = `colecao:${collectionId}`;

      if (activeFilters.includes(filterId)) {
        // Se já estiver ativo, desativa (limpa todos os filtros)
        onFilterToggle(null);
      } else {
        // Se não estiver ativo, ativa (limpa todos e aplica este)
        onFilterToggle(null); // Limpa os filtros existentes primeiro
        onCollectionSelect(collection); // Isso chamará onFilterToggle com a nova coleção
      }
    }
    setShowCollectionsPopup(false);
  };

  const getFilterColor = (filterId: string) => {
    const pokemonColors: Record<string, string> = {
      'colecoes': '#ef4444', 'etbs1': '#3b82f6', 'decks': '#8b5cf6',
      'unitarios': '#10b981', 'triplos': '#f59e0b', 'quadruplos': '#6366f1',
      'box': '#ec4899', 'mini-box': '#14b8a6', 'booster-box': '#f97316'
    };
    const boardGameColors: Record<string, string> = {
      'tabuleiros': '#059669', 'cartas': '#7c3aed', 'baralhos': '#dc2626',
      'ate-50': '#3b82f6', 'ate-100': '#f59e0b', 'ate-200': '#8b5cf6'
    };
    if (category === 'pokemon') return pokemonColors[filterId] || '#3b82f6';
    return boardGameColors[filterId] || '#3b82f6';
  };

  // Verifica se o botão "Coleções" deve ficar ativo
  const isCollectionActive = activeFilters.some(f => f.startsWith('colecao:'));

  return (
    <div style={{
      marginBottom: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div
        className="filters-bar-container"
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 12px 22px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!gridExpanded && (
          <div
            className="filters-chips-scroll"
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '4px',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {filtersConfig.map((filter) => {
              // Para o botão "Coleções", considera ativo se houver qualquer filtro de coleção
              const isActive = filter.id === 'colecoes' ? isCollectionActive : activeFilters.includes(filter.id);
              const filterColor = getFilterColor(filter.id);
              const showImage = filter.imageUrl && !failedImages.has(filter.id);

              return (
                <button
                  key={filter.id}
                  onClick={() => handleFilterClick(filter.id, filter.hasPopup)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: isActive ? filterColor : '#ffffff',
                    border: `2px solid ${isActive ? filterColor : '#e2e8f0'}`,
                    borderRadius: '30px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: isActive ? 'white' : '#1f2937',
                    fontWeight: '600',
                    fontSize: '13px',
                    boxShadow: isActive ? `0 4px 12px ${filterColor}40` : 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = filterColor;
                      e.currentTarget.style.background = '#f0f4ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#ffffff';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                    {showImage ? (
                      <Image
                        src={filter.imageUrl!}
                        alt={filter.name}
                        width={24}
                        height={24}
                        unoptimized
                        style={{ objectFit: 'contain' }}
                        onError={() => handleImageError(filter.id)}
                      />
                    ) : (
                      filter.emoji
                    )}
                  </span>
                  <span>{filter.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {gridExpanded && (
          <div
            className="filters-grid-expanded"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              padding: '8px 0 0 0',
            }}
          >
            {filtersConfig.map((filter) => {
              const isActive = filter.id === 'colecoes' ? isCollectionActive : activeFilters.includes(filter.id);
              const filterColor = getFilterColor(filter.id);
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
                    background: isActive ? filterColor : '#ffffff',
                    border: `2px solid ${isActive ? filterColor : '#e2e8f0'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '100px',
                    position: 'relative',
                    overflow: 'hidden',
                    color: isActive ? 'white' : '#1f2937',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = filterColor;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{
                    marginBottom: '6px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                  }}>
                    {showImage ? (
                      <Image
                        src={filter.imageUrl!}
                        alt={filter.name}
                        width={48}
                        height={48}
                        unoptimized
                        style={{ objectFit: 'contain' }}
                        onError={() => handleImageError(filter.id)}
                      />
                    ) : (
                      filter.emoji
                    )}
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    textAlign: 'center',
                    lineHeight: '1.3',
                  }}>
                    {filter.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Gradiente indicador de scroll */}
        {!gridExpanded && (
          <div
            className="fade-right-indicator"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '32px',
              background: 'linear-gradient(to right, transparent, #e2e8f0)',
              pointerEvents: 'none',
              zIndex: 1,
              display: 'none',
            }}
          />
        )}

        {/* Seta de expansão */}
        <button
          onClick={() => setGridExpanded(!gridExpanded)}
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '6px',
            background: 'none',
            border: 'none',
            padding: '2px 4px',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#64748b',
            transition: 'transform 0.2s ease',
            transform: gridExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            lineHeight: 1,
            zIndex: 2,
            opacity: 0.7,
          }}
          title={gridExpanded ? 'Recolher' : 'Expandir'}
        >
          ▾
        </button>
      </div>

      {/* Popup de coleções */}
      {showCollectionsPopup && collections.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px', backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            animation: 'scaleIn 0.2s ease'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                Escolha as coleções
              </h4>
              <button
                onClick={() => setShowCollectionsPopup(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#6b7280', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {collections.map(collection => {
                const isSelected = tempSelectedCollections.includes(collection);
                return (
                  <button
                    key={collection}
                    onClick={() => handleTempToggle(collection)}
                    style={{
                      padding: '12px',
                      background: isSelected ? '#eff6ff' : '#f9fafb',
                      border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      color: isSelected ? '#1e40af' : '#374151',
                      fontWeight: '500',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{collection}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 768px) {
          .fade-right-indicator {
            display: block !important;
          }
          .filters-chips-scroll {
            justify-content: flex-start !important;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
            gap: 8px;
          }
          .filters-chips-scroll::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}