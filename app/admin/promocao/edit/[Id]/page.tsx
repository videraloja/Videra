// app/admin/promocao/edit/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { promotionalPagesService, PromotionalPage } from '@/lib/promotionalPagesService';
import { Product, ThemeConfig } from '@/app/types';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import AuthGuard from '@/app/components/AuthGuard';

// Componente para seleção de produtos
interface ProductSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

function ProductSelector({ selectedIds, onSelectionChange }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const controller = new AbortController();
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name')
          .abortSignal(controller.signal);

        if (error) throw error;
        setProducts(data || []);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao carregar produtos:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadProducts();
    return () => controller.abort();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  const toggleProduct = (productId: string) => {
    const newSelection = selectedIds.includes(productId)
      ? selectedIds.filter(id => id !== productId)
      : [...selectedIds, productId];
    onSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <div className="global-loading-container" style={{ padding: '40px' }}>
        <div className="global-spinner"></div>
        <p className="global-loading-text">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          📦 Selecione Produtos Específicos
        </h3>
        
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">Todas categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Contador */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {selectedIds.length} produto(s) selecionado(s)
          </span>
          {selectedIds.length > 0 && (
            <button
              onClick={() => onSelectionChange([])}
              style={{
                padding: '4px 8px',
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Limpar seleção
            </button>
          )}
        </div>
      </div>

      {/* Lista de produtos */}
      <div style={{ 
        maxHeight: '400px', 
        overflowY: 'auto',
        border: '1px solid #f3f4f6',
        borderRadius: '6px'
      }}>
        {filteredProducts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Nenhum produto encontrado
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  background: selectedIds.includes(product.id.toString()) ? '#f0f9ff' : 'transparent'
                }}
                onClick={() => toggleProduct(product.id.toString())}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id.toString())}
                  onChange={() => {}}
                  style={{ marginRight: '12px' }}
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <span>Categoria: {product.category}</span>
                    <span>R$ {product.price.toFixed(2)}</span>
                    <span>Estoque: {product.stock}</span>
                  </div>
                </div>
                
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {selectedIds.includes(product.id.toString()) ? '✅ Selecionado' : 'Clique para selecionar'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para editor de filtros - VERSÃO DINÂMICA
interface FilterEditorProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

function FilterEditor({ filters, onFiltersChange }: FilterEditorProps) {
  const [activeTab, setActiveTab] = useState<'pokemon' | 'boardgames' | 'acessorios' | 'hotwheels' | null>(() => {
    return (filters.category as any) || null;
  });
  const [collections, setCollections] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 🎯 BUSCAR VALORES REAIS DO BANCO
  useEffect(() => {
    const controller = new AbortController();
    const loadFilterValues = async () => {
      try {
        console.log('🔍 Carregando valores de filtro do banco...');
        
        // Buscar coleções únicas para Pokémon
        const collectionsPromise = supabase
          .from('products')
          .select('collection')
          .eq('category', 'pokemon')
          .not('collection', 'is', null)
          .abortSignal(controller.signal);

        // Buscar tipos únicos para Pokémon
        const typesPromise = supabase
          .from('products')
          .select('product_type')
          .eq('category', 'pokemon')
          .not('product_type', 'is', null)
          .abortSignal(controller.signal);

        const [{ data: collectionsData }, { data: typesData }] = await Promise.all([collectionsPromise, typesPromise]);

        // Processar coleções
        const uniqueCollections = Array.from(
          new Set(
            collectionsData
              ?.map(item => item.collection)
              .filter(Boolean)
              .map(col => col.trim())
              .sort() || []
          )
        );

        // Processar tipos
        const uniqueTypes = Array.from(
          new Set(
            typesData
              ?.map(item => item.product_type)
              .filter(Boolean)
              .map(type => type.trim())
              .sort() || []
          )
        );

        console.log('✅ Coleções encontradas:', uniqueCollections);
        console.log('✅ Tipos encontrados:', uniqueTypes);

        setCollections(uniqueCollections);
        setProductTypes(uniqueTypes);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('❌ Erro ao carregar valores de filtro:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadFilterValues();
    return () => controller.abort();
  }, []);

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === undefined || value === false) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onFiltersChange(newFilters);
  };

  // 🆕 COMPONENTE REUTILIZÁVEL PARA FILTROS GENÉRICOS
  const renderGenericFilters = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Preço Máximo */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
          Preço Máximo (R$)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={filters.max_price || ''}
          onChange={(e) => updateFilter('max_price', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="Ex: 100.00"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </div>

      {/* Status de Produto */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
          Status de Produto
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.on_sale || false}
              onChange={(e) => updateFilter('on_sale', e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '14px' }}>Apenas produtos em promoção</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.in_stock || false}
              onChange={(e) => updateFilter('in_stock', e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '14px' }}>Apenas produtos em estoque</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#f3e8ff', padding: '8px', borderRadius: '6px', border: '1px solid #e9d5ff' }}>
            <input
              type="checkbox"
              checked={filters.is_preorder || false}
              onChange={(e) => updateFilter('is_preorder', e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#7c3aed' }}>📦 Apenas produtos em PRÉ-VENDA</span>
          </label>
        </div>
      </div>
    </div>
  );

  //  FILTROS PARA POKÉMON
  const renderPokemonFilters = () => {
    if (loading) {
      return (
        <div className="global-loading-container" style={{ padding: '40px' }}>
          <div className="global-spinner"></div>
          <p className="global-loading-text">Carregando opções de filtro...</p>
        </div>
      );
    }

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px dashed #e5e7eb' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Coleção
          </label>
          <select
            value={filters.collection || ''}
            onChange={(e) => updateFilter('collection', e.target.value || undefined)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">Todas coleções</option>
            {collections.map(collection => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>
          {collections.length === 0 && (
            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
              Nenhuma coleção encontrada no banco
            </p>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Tipo
          </label>
          <select
            value={filters.product_type || ''}
            onChange={(e) => updateFilter('product_type', e.target.value || undefined)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">Todos os tipos</option>
            {productTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {productTypes.length === 0 && (
            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
              Nenhum tipo encontrado no banco
            </p>
          )}
        </div>
        </div>
        {renderGenericFilters()}
      </>
    );
  };

  // 🎯 FILTROS PARA JOGOS DE TABULEIRO
  const renderBoardGamesFilters = () => {
    if (loading) {
      return (
        <div className="global-loading-container" style={{ padding: '40px' }}>
          <div className="global-spinner"></div>
          <p className="global-loading-text">Carregando opções de filtro...</p>
        </div>
      );
    }

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px dashed #e5e7eb' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            Tipo de Jogo
          </label>
          <select
            value={filters.product_type || ''}
            onChange={(e) => updateFilter('product_type', e.target.value || undefined)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">Todos os tipos</option>
            <option value="tabuleiro">Tabuleiro</option>
            <option value="carta">Cartas</option>
            <option value="baralho">Baralhos</option>
            <option value="acessorio">Acessório</option>
            {/* Opções dinâmicas também */}
            {productTypes
              .filter(type => !['tabuleiro', 'carta', 'baralho', 'acessorio'].includes(type.toLowerCase()))
              .map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
          </select>
        </div>
        </div>
        {renderGenericFilters()}
      </>
    );
  };

  // 🎯 FILTROS PARA ACESSÓRIOS E HOT WHEELS (simples)
  const renderSimpleFilters = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
        Filtros Básicos
      </h4>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
        Esta categoria usa filtros simples de preço e estoque.
      </p>
      
      {renderGenericFilters()}
    </div>
  );

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', background: 'white' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          🎯 Filtros Automáticos
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
          Produtos que corresponderem a estes filtros aparecerão automaticamente na página.
        </p>
      </div>

      {/* Tabs de categoria */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '12px',
        flexWrap: 'wrap'
      }}>
        {([
          { id: 'pokemon', label: '🎴 Pokémon', category: 'pokemon' },
          { id: 'boardgames', label: '🎲 Jogos de Tabuleiro', category: 'jogosdetabuleiro' },
          { id: 'acessorios', label: '🛡️ Acessórios', category: 'acessorios' },
          { id: 'hotwheels', label: '🏎️ Hot Wheels', category: 'hotwheels' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if (activeTab === tab.id) {
                // Clicar na aba ativa a desativa
                setActiveTab(null);
                updateFilter('category', undefined);
              } else {
                setActiveTab(tab.id);
                updateFilter('category', tab.category);
              }
            }}
            style={{
              padding: '10px 16px',
              background: activeTab === tab.id ? '#7c3aed' : '#f3f4f6',
              color: activeTab === tab.id ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              flex: '1 0 auto',
              minWidth: '140px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros específicos por categoria */}
      {activeTab === 'pokemon' && renderPokemonFilters()}
      {activeTab === 'boardgames' && renderBoardGamesFilters()}
      {(activeTab === 'acessorios' || activeTab === 'hotwheels') && renderSimpleFilters()}
      {activeTab === null && (
        <>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
            Filtros Gerais (para todas as categorias)
          </h4>
          {renderGenericFilters()}
        </>
      )}

      {/* Resumo dos filtros */}
      {Object.keys(filters).length > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '16px',
          background: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #e0f2fe'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span>
              Filtros Aplicados ({Object.keys(filters).length})
            </div>
            <button
              onClick={() => onFiltersChange({})}
              style={{
                padding: '4px 12px',
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Limpar todos
            </button>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(filters).map(([key, value]) => {
              let displayValue = value;
              let displayKey = key;
              
              // Formatar chaves para melhor visualização
              if (key === 'product_type') displayKey = 'Tipo';
              else if (key === 'collection') displayKey = 'Coleção';
              else if (key === 'max_price') displayKey = 'Preço Máximo';
              else if (key === 'on_sale') displayKey = 'Em Promoção';
              else if (key === 'in_stock') displayKey = 'Em Estoque';
              else if (key === 'is_preorder') displayKey = 'Pré-venda';
              else if (key === 'category') displayKey = 'Categoria';
              
              // Formatar valores
              if (key === 'max_price') displayValue = `R$ ${parseFloat(value).toFixed(2)}`;
              else if (key === 'on_sale' || key === 'in_stock') displayValue = value ? 'Sim' : 'Não';
              else if (key === 'category') {
                if (value === 'pokemon') displayValue = 'Pokémon';
                else if (value === 'jogosdetabuleiro') displayValue = 'Jogos de Tabuleiro';
                else if (value === 'acessorios') displayValue = 'Acessórios';
                else if (value === 'hotwheels') displayValue = 'Hot Wheels';
              }
              
              // 🎨 COR ESPECIAL PARA PRÉ-VENDA
              const isPreOrderFilter = key === 'is_preorder' && value;
              const bgColor = isPreOrderFilter ? '#e9d5ff' : '#e0f2fe';
              const textColor = isPreOrderFilter ? '#7c3aed' : '#0369a1';

              return (
                <div
                  key={key}
                  style={{
                    background: bgColor,
                    color: textColor,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{displayKey}:</span>
                  <span style={{ fontWeight: '600' }}>{String(displayValue)}</span>
                  <button
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key];
                      onFiltersChange(newFilters);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0',
                      marginLeft: '4px'
                    }}
                    title={`Remover filtro ${key}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instruções */}
      <div style={{ 
        marginTop: '20px',
        padding: '12px',
        background: '#fef3c7',
        borderRadius: '6px',
        border: '1px solid #fde68a'
      }}>
        <div style={{ fontSize: '13px', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>💡</span>
          <div>
            <strong>Como funciona:</strong> Os produtos que corresponderem a TODOS os filtros selecionados aparecerão na página. 
            Combine com "Produtos Específicos" na aba 📦 para máxima flexibilidade.
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para seleção de tema
interface ThemeSelectorProps {
  selectedThemeId?: string;
  onThemeSelect: (themeId: string | undefined) => void;
}

function ThemeSelector({ selectedThemeId, onThemeSelect }: ThemeSelectorProps) {
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const loadThemes = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('*')
          .order('name')
          .abortSignal(controller.signal);

        if (error) throw error;
        setThemes(data || []);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao carregar temas:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadThemes();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="global-loading-container" style={{ padding: '40px' }}>
        <div className="global-spinner"></div>
        <p className="global-loading-text">Carregando temas...</p>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
        🎨 Escolher Tema da Página
      </h3>
      
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
        Selecione um tema para aplicar à aparência desta página promocional.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '12px',
        marginTop: '16px'
      }}>
        {/* Opção sem tema */}
        <div
          onClick={() => onThemeSelect(undefined)}
          style={{
            border: `2px solid ${!selectedThemeId ? '#7c3aed' : '#e5e7eb'}`,
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            background: !selectedThemeId ? '#f5f3ff' : 'white',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '8px',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
            fontSize: '20px'
          }}>
            🏠
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            Tema Padrão
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Usa o tema da categoria
          </div>
        </div>

        {/* Lista de temas */}
        {themes.map(theme => (
          <div
            key={theme.id}
            onClick={() => onThemeSelect(theme.id)}
            style={{
              border: `2px solid ${selectedThemeId === theme.id ? '#7c3aed' : '#e5e7eb'}`,
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              background: selectedThemeId === theme.id ? '#f5f3ff' : 'white',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px',
              background: theme.colors?.primary || '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
              fontSize: '20px',
              color: 'white'
            }}>
              {theme.emojis?.cart || '🎨'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              {theme.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {theme.description || 'Sem descrição'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Página principal de edição
function EditPromotionalPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // 🆕 PEGA O STATUS DA AUTENTICAÇÃO
  const pageId = params.Id as string;

  const [page, setPage] = useState<PromotionalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados do formulário
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageMobileUrl, setHeroImageMobileUrl] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [productIds, setProductIds] = useState<string[]>([]);
  const [themeId, setThemeId] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'filters' | 'products' | 'appearance'>('info');
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  // Adicione esta função no componente EditPromotionalPageContent (após os states):
const handleImageUpload = async (file: File, type: 'desktop' | 'mobile') => {
  if (type === 'desktop') setUploadingDesktop(true);
  else setUploadingMobile(true);
  try {
    // Criar nome único para o arquivo
    const fileName = `hero-${Date.now()}-${file.name}`;
    const filePath = `hero-banners/${fileName}`;
    
    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (type === 'desktop') {
      setHeroImageUrl(publicUrl);
    } else {
      setHeroImageMobileUrl(publicUrl);
    }
    alert(`✅ Imagem ${type} enviada com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao enviar imagem:', error);
    alert('❌ Erro ao enviar imagem. Tente novamente.');
  } finally {
    if (type === 'desktop') setUploadingDesktop(false);
    else setUploadingMobile(false);
  }
};

  useEffect(() => {
    const controller = new AbortController();
    // 🎯 SÓ EXECUTA QUANDO A AUTENTICAÇÃO TERMINAR E O ID ESTIVER DISPONÍVEL
    if (authLoading || !user || !pageId) return;

    const loadPage = async () => {
      let currentPage: PromotionalPage | null = null;
      for (let i = 0; i < 3; i++) { // Tenta 3 vezes
        try {
          if (controller.signal.aborted) return;
          currentPage = await promotionalPagesService.getPageById(pageId, controller.signal);
          if (currentPage) {
            break; // Encontrou, sai do loop
          }
          // Se não encontrou, espera um pouco e tenta de novo
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error(`Erro na tentativa ${i + 1}:`, error);
          } else {
            return; // Abortado, para tudo
          }
        }
      }

      if (controller.signal.aborted) return;

      if (currentPage) {
        setPage(currentPage);
        setTitle(currentPage.title);
        setSlug(currentPage.slug);
        setDescription(currentPage.description || '');
        setHeroImageUrl(currentPage.hero_image_url || '');
        setHeroImageMobileUrl(currentPage.hero_image_mobile_url || '');
        setFilters(currentPage.filters || {});
        setProductIds(currentPage.product_ids || []);
        setThemeId(currentPage.theme_id || undefined);
        setIsActive(currentPage.is_active);
        setStartDate(currentPage.start_date?.split('T')[0] || '');
        setEndDate(currentPage.end_date?.split('T')[0] || '');
        setShowOverlay((currentPage as any).show_overlay !== false);
      } else {
        alert('Página não encontrada após várias tentativas. Verifique se ela foi criada corretamente.');
        router.push('/admin/themes');
      }
      
      setLoading(false);
    }
    loadPage();
    return () => controller.abort();
  }, [pageId, router, authLoading, user]); // 🆕 ADICIONA DEPENDÊNCIAS DE AUTENTICAÇÃO

  const handleSave = async () => {
    setSaving(true);
    try {
      const pageData: any = {
        title: title || "",
        slug,
        description: description || "",
        hero_image_url: heroImageUrl || "",
        hero_image_mobile_url: heroImageMobileUrl || null,
        filters,
        product_ids: productIds,
        theme_id: themeId || null,
        is_active: isActive,
        start_date: startDate ? `${startDate}T00:00:00Z` : null,
        end_date: endDate ? `${endDate}T23:59:59Z` : null,
        show_overlay: showOverlay
      };

      const updatedPage = await promotionalPagesService.updatePage(pageId, pageData);
      
      if (updatedPage) {
        alert('✅ Página salva com sucesso!');
        // Atualiza todos os estados do formulário para refletir os dados salvos
        setPage(updatedPage);
        setTitle(updatedPage.title);
        setSlug(updatedPage.slug);
        setDescription(updatedPage.description || '');
        setHeroImageUrl(updatedPage.hero_image_url || '');
        setHeroImageMobileUrl(updatedPage.hero_image_mobile_url || '');
        setFilters(updatedPage.filters || {});
        setProductIds(updatedPage.product_ids || []);
        setThemeId(updatedPage.theme_id || undefined);
        setIsActive(updatedPage.is_active);
        setStartDate(updatedPage.start_date?.split('T')[0] || '');
        setEndDate(updatedPage.end_date?.split('T')[0] || '');
        setShowOverlay((updatedPage as any).show_overlay !== false);
      } else {
        // Caso o serviço retorne nulo sem um erro explícito
        throw new Error("A atualização não retornou os dados esperados.");
      }
    } catch (error) {
      console.error('Erro ao salvar página:', error);
      alert(`❌ Erro ao salvar página: ${error instanceof Error ? error.message : 'Erro desconhecido. Verifique o console.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita.')) {
      try {
        const success = await promotionalPagesService.deletePage(pageId);
        if (success) {
          alert('✅ Página excluída!');
          router.push('/admin/themes');
        }
      } catch (error) {
        console.error('Erro ao excluir página:', error);
        alert('❌ Erro ao excluir página');
      }
    }
  };

  if (loading) {
    return (
      <div className="global-loading-container">
        <div className="global-spinner"></div>
        <p className="global-loading-text">Carregando página...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <h2>Página não encontrada</h2>
        <p style={{ marginBottom: '24px' }}>A página que você está tentando editar não existe.</p>
        <Link 
          href="/admin/themes"
          style={{
            padding: '10px 20px',
            background: '#7c3aed',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '500'
          }}
        >
          ← Voltar para Promoções
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              ✏️ Editar Página Promocional
            </h1>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Configure os detalhes, filtros e aparência da página
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: saving ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? '⏳ Salvando...' : '💾 Salvar Alterações'}
            </button>
            
            <a
              href={`/promocao/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              👁️ Ver Página
            </a>
            
            <button
              onClick={handleDelete}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🗑️ Excluir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '12px'
        }}>
          {([
            { id: 'info', label: '📝 Informações Básicas', icon: '📝' },
            { id: 'filters', label: '🎯 Filtros Automáticos', icon: '🎯' },
            { id: 'products', label: '📦 Produtos Específicos', icon: '📦' },
            { id: 'appearance', label: '🎨 Aparência', icon: '🎨' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                background: activeTab === tab.id ? '#7c3aed' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Coluna principal */}
        <div>
          {activeTab === 'info' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                📝 Informações Básicas
              </h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Título da Página (opcional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Ex: Promoção de Natal Pokémon 2025"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Slug (URL) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>/promocao/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="promocao-natal-2025"
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    Use apenas letras minúsculas, números e hífens.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Descrição
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Descreva esta promoção..."
                  />
                </div>

                <div>
  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
    Imagem de Fundo do Hero
  </label>
  
  {/* Preview da imagem atual */}
  {heroImageUrl && (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        width: '100%', 
        height: '150px', 
        backgroundImage: `url(${heroImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '8px'
      }} />
      <p style={{ fontSize: '12px', color: '#6b7280' }}>
        Imagem atual. Para alterar, faça upload de uma nova.
      </p>
    </div>
  )}
  
  {/* Upload de arquivo */}
  <div style={{ 
    border: '2px dashed #d1d5db', 
    borderRadius: '8px', 
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative'
  }}>
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 15 * 1024 * 1024) {
            alert('❌ A imagem deve ter no máximo 15MB');
            return;
          }
          handleImageUpload(file, 'desktop');
        }
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer'
      }}
      disabled={uploadingDesktop}
    />
    
    <div style={{ fontSize: '48px', marginBottom: '12px' }}>
      {heroImageUrl ? '🖼️' : '📤'}
    </div>
    
    <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
      {uploadingDesktop ? 'Enviando...' : (heroImageUrl ? 'Alterar imagem Desktop' : 'Fazer upload de imagem Desktop')}
    </p>
    
    <p style={{ fontSize: '12px', color: '#6b7280' }}>
      Clique para selecionar uma imagem (JPG, PNG, WebP)
    </p>
    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
      Tamanho máximo: 15MB | Recomendado: 1920x600px
    </p>
  </div>
  
  {/* URL manual (alternativa) */}
  <div style={{ marginTop: '12px' }}>
    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
      Ou cole uma URL manualmente:
    </p>
    <input
      type="text"
      value={heroImageUrl}
      onChange={(e) => setHeroImageUrl(e.target.value)}
      placeholder="https://exemplo.com/imagem-hero.jpg"
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '13px'
      }}
    />
  </div>
</div>

<div>
  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
    Imagem de Fundo do Hero (Mobile)
  </label>
  
  {/* Preview da imagem atual */}
  {heroImageMobileUrl && (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        width: '100%', 
        height: '150px', 
        backgroundImage: `url(${heroImageMobileUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '8px'
      }} />
      <p style={{ fontSize: '12px', color: '#6b7280' }}>
        Imagem mobile atual.
      </p>
    </div>
  )}
  
  {/* Upload de arquivo */}
  <div style={{ 
    border: '2px dashed #d1d5db', 
    borderRadius: '8px', 
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative'
  }}>
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 15 * 1024 * 1024) {
            alert('❌ A imagem deve ter no máximo 15MB');
            return;
          }
          handleImageUpload(file, 'mobile');
        }
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer'
      }}
      disabled={uploadingMobile}
    />
    
    <div style={{ fontSize: '48px', marginBottom: '12px' }}>
      {heroImageMobileUrl ? '🖼️' : '📤'}
    </div>
    
    <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
      {uploadingMobile ? 'Enviando...' : (heroImageMobileUrl ? 'Alterar imagem Mobile' : 'Fazer upload de imagem Mobile')}
    </p>
    
    <p style={{ fontSize: '12px', color: '#6b7280' }}>
      Clique para selecionar uma imagem (JPG, PNG, WebP)
    </p>
    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
      Tamanho máximo: 15MB | Recomendado: 750x600px
    </p>
  </div>
  
  {/* URL manual (alternativa) */}
  <div style={{ marginTop: '12px' }}>
    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
      Ou cole uma URL manualmente:
    </p>
    <input
      type="text"
      value={heroImageMobileUrl}
      onChange={(e) => setHeroImageMobileUrl(e.target.value)}
      placeholder="https://exemplo.com/imagem-hero-mobile.jpg"
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '13px'
      }}
    />
  </div>
</div>
    
    {/* Overlay Toggle */}
    <div style={{ marginTop: '16px', background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={showOverlay}
          onChange={(e) => setShowOverlay(e.target.checked)}
          style={{ width: '16px', height: '16px' }}
        />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>
          Ativar overlay escuro sobre a imagem
        </span>
      </label>
      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginLeft: '24px' }}>Deixa a imagem ligeiramente mais escura para facilitar a leitura de textos brancos por cima da imagem. Desative se a imagem já for escura ou se não houver texto sobre ela.</p>
    </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Data de Início (opcional)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Data de Término (opcional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      Página ativa (visível para o público)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <FilterEditor filters={filters} onFiltersChange={setFilters} />
          )}

          {activeTab === 'products' && (
            <ProductSelector selectedIds={productIds} onSelectionChange={setProductIds} />
          )}

          {activeTab === 'appearance' && (
            <ThemeSelector selectedThemeId={themeId} onThemeSelect={setThemeId} />
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              📊 Resumo da Página
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>URL da Página</div>
                <div style={{ fontSize: '14px', fontWeight: '500', wordBreak: 'break-all' }}>
                  /promocao/{slug}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: isActive ? '#10b981' : '#ef4444'
                }}>
                  {isActive ? '✅ Ativa' : '❌ Inativa'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Filtros Ativos</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {Object.keys(filters).length > 0 ? Object.keys(filters).length : 'Nenhum'}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Produtos Específicos</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {productIds.length} selecionado(s)
                </div>
              </div>
              
              {themeId && (
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Tema Aplicado</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#7c3aed' }}>
                    Sim
                  </div>
                </div>
              )}
              
              {startDate && (
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Início</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {new Date(startDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
              
              {endDate && (
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Término</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {new Date(endDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              💡 Dicas Rápidas
            </h3>
            
            <ul style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>Combine <strong>filtros automáticos</strong> com <strong>produtos específicos</strong> para máxima flexibilidade.</li>
              <li>Use <strong>datas de validade</strong> para promoções temporárias.</li>
              <li>Cada página pode ter um <strong>tema visual diferente</strong>.</li>
              <li>Teste sempre a página antes de ativar.</li>
              <li>Use a URL da página em <strong>Hero Banners</strong>.</li>
            </ul>
            
            <div style={{ marginTop: '20px', padding: '12px', background: '#f0f9ff', borderRadius: '6px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#0369a1', marginBottom: '4px' }}>
                Próximo passo recomendado:
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {activeTab === 'info' && 'Configure os filtros automáticos para selecionar produtos em massa.'}
                {activeTab === 'filters' && 'Adicione produtos específicos que não são capturados pelos filtros.'}
                {activeTab === 'products' && 'Escolha um tema visual para personalizar a aparência da página.'}
                {activeTab === 'appearance' && 'Verifique todas as configurações e salve a página.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div style={{ 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link
          href="/admin/themes"
          style={{
            padding: '10px 20px',
            background: '#f3f4f6',
            color: '#374151',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← Voltar para lista
        </Link>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              if (confirm('Descartar alterações não salvas?')) {
                router.push('/admin/themes');
              }
            }}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: saving ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? '⏳ Salvando...' : '💾 Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Envolva com AuthGuard
export default function EditPromotionalPage() {
  return (
    <AuthGuard>
      <EditPromotionalPageContent />
    </AuthGuard>
  );
}