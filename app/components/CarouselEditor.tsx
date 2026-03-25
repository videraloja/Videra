'use client';

import React, { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import { carouselService } from '../lib/carouselService';
import { CarouselConfig } from '../types';

interface CarouselEditorProps {
  pageSlug: string;
  onClose?: () => void;
}

 const PAGE_OPTIONS = [
  { value: 'home', label: 'Página Inicial', icon: '🏠' },
  { value: 'pokemontcg', label: 'Pokémon TCG', icon: '🎴' },
  { value: 'jogosdetabuleiro', label: 'Jogos de Tabuleiro', icon: '🎲' },
  { value: 'acessorios', label: 'Acessórios', icon: '🎒' },
  { value: 'hotwheels', label: 'Hot Wheels', icon: '🏎️' }
];

const CAROUSEL_TYPES = [
  { value: 'all', label: 'Todos os Produtos', icon: '📦' },
  { value: 'bestsellers', label: 'Mais Vendidos', icon: '🔥' },
  { value: 'new_arrivals', label: 'Lançamentos', icon: '🆕' }
];

export default function CarouselEditor({ pageSlug, onClose }: CarouselEditorProps) {
  const [selectedPage, setSelectedPage] = useState(pageSlug);
  const [selectedCarousel, setSelectedCarousel] = useState<'all' | 'bestsellers' | 'new_arrivals'>('all');
  const [configs, setConfigs] = useState<CarouselConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<Partial<CarouselConfig>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Carregar configurações da página
  useEffect(() => {
    loadConfigs();
  }, [selectedPage]);

  // Atualizar configuração atual quando selecionar carrossel
  useEffect(() => {
    if (configs.length > 0) {
      const config = configs.find(c => c.carousel_type === selectedCarousel);
      if (config) {
        setCurrentConfig(config);
      } else {
        // Criar configuração padrão se não existir
        setCurrentConfig({
          page_slug: selectedPage,
          carousel_type: selectedCarousel,
          title_text_color: '#000000',
          title_font_size: 24,
          title_font_weight: '700',
          badge_bg_color: selectedCarousel === 'all' ? '#ef4444' : 
                         selectedCarousel === 'bestsellers' ? '#059669' : '#7c3aed',
          badge_text_color: '#ffffff',
          arrow_bg_color: selectedCarousel === 'all' ? '#ef4444' : 
                         selectedCarousel === 'bestsellers' ? '#059669' : '#7c3aed',
          arrow_text_color: '#ffffff',
          arrow_hover_bg_color: selectedCarousel === 'all' ? '#dc2626' : 
                               selectedCarousel === 'bestsellers' ? '#047857' : '#6d28d9',
          arrow_hover_text_color: '#ffffff',
          show_arrows: true,
          show_badges: true,
          items_per_view: 4,
          auto_scroll: false,
          auto_scroll_interval: 5000
        });
      }
    }
  }, [selectedCarousel, configs, selectedPage]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await carouselService.getCarouselConfigs(selectedPage);
      setConfigs(data);
      
      // Se não houver configurações, criar padrões
      if (data.length === 0) {
        await carouselService.createDefaultConfigs(selectedPage);
        const newData = await carouselService.getCarouselConfigs(selectedPage);
        setConfigs(newData);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof CarouselConfig, value: any) => {
    setCurrentConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentConfig.page_slug || !currentConfig.carousel_type) {
      setMessage('Informações incompletas');
      return;
    }

    setSaving(true);
    try {
      const saved = await carouselService.saveCarouselConfig(currentConfig);
      if (saved) {
        setMessage('Configuração salva com sucesso!');
        // Atualizar lista de configurações
        const updatedConfigs = configs.map(c => 
          c.carousel_type === saved.carousel_type ? saved : c
        );
        if (!configs.find(c => c.carousel_type === saved.carousel_type)) {
          updatedConfigs.push(saved);
        }
        setConfigs(updatedConfigs);
      } else {
        setMessage('Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (confirm('Deseja restaurar as configurações padrão para este carrossel?')) {
      setSaving(true);
      try {
        await carouselService.createDefaultConfigs(selectedPage);
        await loadConfigs();
        setMessage('Configurações padrão restauradas!');
      } catch (error) {
        console.error('Erro ao restaurar padrões:', error);
        setMessage('Erro ao restaurar configurações');
      } finally {
        setSaving(false);
      }
    }
  };

  const getCarouselLabel = (type: string) => {
    const carousel = CAROUSEL_TYPES.find(c => c.value === type);
    return carousel ? `${carousel.icon} ${carousel.label}` : type;
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '24px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
            🎠 Editor de Carrosséis
          </h2>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>
            Personalize os carrosséis de cada página
          </p>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Fechar
          </button>
        )}
      </div>

      {/* Seletor de Página e Carrossel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Seletor de Página */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            🌐 Página
          </label>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              background: 'white'
            }}
          >
            {PAGE_OPTIONS.map(page => (
              <option key={page.value} value={page.value}>
                {page.icon} {page.label}
              </option>
            ))}
          </select>
        </div>

        {/* Seletor de Carrossel */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            🎠 Tipo de Carrossel
          </label>
          <select
            value={selectedCarousel}
            onChange={(e) => setSelectedCarousel(e.target.value as any)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              background: 'white'
            }}
          >
            {CAROUSEL_TYPES.map(carousel => (
              <option key={carousel.value} value={carousel.value}>
                {carousel.icon} {carousel.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Carregando configurações...</p>
        </div>
      ) : (
        <>
          {/* Preview do Carrossel Atual */}
          <div style={{
            background: '#f9fafb',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '32px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👁️ Preview: {getCarouselLabel(selectedCarousel)}
            </h3>
            
            {/* Preview do Título */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                fontSize: `${currentConfig.title_font_size || 24}px`,
                fontWeight: currentConfig.title_font_weight || '700',
                color: currentConfig.title_text_color || '#000000',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {selectedCarousel === 'all' && '📦'}
                {selectedCarousel === 'bestsellers' && '🔥'}
                {selectedCarousel === 'new_arrivals' && '🆕'}
                {getCarouselLabel(selectedCarousel)}
                {currentConfig.show_badges && currentConfig.badge_bg_color && (
                  <span style={{
                    backgroundColor: currentConfig.badge_bg_color || '#ef4444',
                    color: currentConfig.badge_text_color || '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginLeft: '12px'
                  }}>
                    {selectedCarousel === 'all' ? 'PROMO' : 
                     selectedCarousel === 'bestsellers' ? 'TOP' : 'NEW'}
                  </span>
                )}
              </h4>
            </div>

            {/* Preview dos Botões */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  Botão "Ver Todos"
                </p>
                <button style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Ver Todos
                </button>
              </div>

              {currentConfig.show_arrows && (
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    Botões de Navegação
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      padding: '8px 12px',
                      background: currentConfig.arrow_bg_color || '#ef4444',
                      color: currentConfig.arrow_text_color || '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}>
                      ◀
                    </button>
                    <button style={{
                      padding: '8px 12px',
                      background: currentConfig.arrow_bg_color || '#ef4444',
                      color: currentConfig.arrow_text_color || '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}>
                      ▶
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Formulário de Edição */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Configurações do Título */}
            <div style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#374151'
              }}>
                ✏️ Configurações do Título
              </h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Cor do Texto
                </label>
                <ColorPicker
                  color={currentConfig.title_text_color || '#000000'}
                  onChange={(color) => handleConfigChange('title_text_color', color)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Tamanho da Fonte (px)
                </label>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={currentConfig.title_font_size || 24}
                  onChange={(e) => handleConfigChange('title_font_size', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  <span>16px</span>
                  <span>{currentConfig.title_font_size || 24}px</span>
                  <span>48px</span>
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Peso da Fonte
                </label>
                <select
                  value={currentConfig.title_font_weight || '700'}
                  onChange={(e) => handleConfigChange('title_font_weight', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="400">Normal (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">Extra-Bold (800)</option>
                </select>
              </div>
            </div>

            {/* Configurações dos Badges */}
            <div style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#374151'
              }}>
                🏷️ Configurações dos Badges
              </h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Cor do Fundo do Badge
                </label>
                <ColorPicker
                  color={currentConfig.badge_bg_color || '#ef4444'}
                  onChange={(color) => handleConfigChange('badge_bg_color', color)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Cor do Texto do Badge
                </label>
                <ColorPicker
                  color={currentConfig.badge_text_color || '#ffffff'}
                  onChange={(color) => handleConfigChange('badge_text_color', color)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="show_badges"
                  checked={currentConfig.show_badges !== false}
                  onChange={(e) => handleConfigChange('show_badges', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="show_badges" style={{ fontSize: '14px' }}>
                  Mostrar badges no carrossel
                </label>
              </div>
            </div>

            {/* Configurações das Setas */}
            <div style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#374151'
              }}>
                🔄 Configurações das Setas
              </h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Cor de Fundo Normal
                </label>
                <ColorPicker
                  color={currentConfig.arrow_bg_color || '#ef4444'}
                  onChange={(color) => handleConfigChange('arrow_bg_color', color)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Cor do Texto Normal
                </label>
                <ColorPicker
                  color={currentConfig.arrow_text_color || '#ffffff'}
                  onChange={(color) => handleConfigChange('arrow_text_color', color)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Cor de Fundo (Hover)
                </label>
                <ColorPicker
                  color={currentConfig.arrow_hover_bg_color || '#dc2626'}
                  onChange={(color) => handleConfigChange('arrow_hover_bg_color', color)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Cor do Texto (Hover)
                </label>
                <ColorPicker
                  color={currentConfig.arrow_hover_text_color || '#ffffff'}
                  onChange={(color) => handleConfigChange('arrow_hover_text_color', color)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="show_arrows"
                  checked={currentConfig.show_arrows !== false}
                  onChange={(e) => handleConfigChange('show_arrows', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="show_arrows" style={{ fontSize: '14px' }}>
                  Mostrar botões de navegação
                </label>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div style={{
              background: '#f9fafb',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#374151'
              }}>
                ⚙️ Configurações Avançadas
              </h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Itens por Visualização
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={currentConfig.items_per_view || 4}
                  onChange={(e) => handleConfigChange('items_per_view', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  <span>1 item</span>
                  <span>{currentConfig.items_per_view || 4} itens</span>
                  <span>8 itens</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="auto_scroll"
                  checked={currentConfig.auto_scroll || false}
                  onChange={(e) => handleConfigChange('auto_scroll', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="auto_scroll" style={{ fontSize: '14px' }}>
                  Ativar rolagem automática
                </label>
              </div>

              {currentConfig.auto_scroll && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Intervalo de Rolagem (ms)
                  </label>
                  <select
                    value={currentConfig.auto_scroll_interval || 5000}
                    onChange={(e) => handleConfigChange('auto_scroll_interval', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value="2000">2 segundos</option>
                    <option value="3000">3 segundos</option>
                    <option value="5000">5 segundos</option>
                    <option value="7000">7 segundos</option>
                    <option value="10000">10 segundos</option>
                  </select>
                </div>
              )}
            </div>
          </div>

{/* Configurações do Botão "Ver Todos" */}
<div style={{
  background: '#f9fafb',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  gridColumn: '1 / -1'
}}>
  <h4 style={{ 
    fontSize: '16px', 
    fontWeight: '600', 
    marginBottom: '16px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    🔘 Configurações do Botão "Ver Todos"
  </h4>
  
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  }}>
    {/* Estado Normal */}
    <div>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#4b5563' }}>
        Estado Normal
      </h5>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor de Fundo
        </label>
        <ColorPicker
          color={currentConfig.view_all_button_bg_color || 'transparent'}
          onChange={(color) => handleConfigChange('view_all_button_bg_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor do Texto
        </label>
        <ColorPicker
          color={currentConfig.view_all_button_text_color || '#ef4444'}
          onChange={(color) => handleConfigChange('view_all_button_text_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor da Borda
        </label>
        <ColorPicker
          color={currentConfig.view_all_button_border_color || '#ef4444'}
          onChange={(color) => handleConfigChange('view_all_button_border_color', color)}
        />
      </div>
    </div>

    {/* Estado Hover */}
    <div>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#4b5563' }}>
        Estado Hover (Mouse em Cima)
      </h5>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor de Fundo (Hover)
        </label>
        <ColorPicker
          color={currentConfig.view_all_button_hover_bg_color || '#ef4444'}
          onChange={(color) => handleConfigChange('view_all_button_hover_bg_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor do Texto (Hover)
        </label>
        <ColorPicker
          color={currentConfig.view_all_button_hover_text_color || '#ffffff'}
          onChange={(color) => handleConfigChange('view_all_button_hover_text_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor da Borda (Hover)
        </label>
        <ColorPicker
          color={currentConfig.view_all_button_hover_border_color || '#ef4444'}
          onChange={(color) => handleConfigChange('view_all_button_hover_border_color', color)}
        />
      </div>
    </div>

    {/* Preview do Botão */}
    <div>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#4b5563' }}>
        Preview do Botão
      </h5>
      <div style={{ 
        background: '#ffffff', 
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Normal:</span>
          <button
            style={{
              padding: '8px 16px',
              background: currentConfig.view_all_button_bg_color || 'transparent',
              color: currentConfig.view_all_button_text_color || '#ef4444',
              border: `1px solid ${currentConfig.view_all_button_border_color || '#ef4444'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'default'
            }}
          >
            Ver Todos
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Hover:</span>
          <button
            style={{
              padding: '8px 16px',
              background: currentConfig.view_all_button_hover_bg_color || '#ef4444',
              color: currentConfig.view_all_button_hover_text_color || '#ffffff',
              border: `1px solid ${currentConfig.view_all_button_hover_border_color || '#ef4444'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'default'
            }}
          >
            Ver Todos
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
{/* Configurações da Página "Ver Todos" */}
<div style={{
  background: '#f9fafb',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  gridColumn: '1 / -1'
}}>
  <h4 style={{ 
    fontSize: '16px', 
    fontWeight: '600', 
    marginBottom: '16px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    📋 Configurações da Página "Ver Todos"
  </h4>
  
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  }}>
    {/* Configurações do Título */}
    <div>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#4b5563' }}>
        Título da Página
      </h5>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor do Texto
        </label>
        <ColorPicker
          color={currentConfig.view_all_title_color || '#000000'}
          onChange={(color) => handleConfigChange('view_all_title_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Tamanho da Fonte
        </label>
        <input
          type="range"
          min="20"
          max="48"
          value={currentConfig.view_all_title_font_size || 28}
          onChange={(e) => handleConfigChange('view_all_title_font_size', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#6b7280',
          marginTop: '4px'
        }}>
          <span>20px</span>
          <span>{currentConfig.view_all_title_font_size || 28}px</span>
          <span>48px</span>
        </div>
      </div>
    </div>

    {/* Configurações do Badge */}
    <div>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#4b5563' }}>
        Badge de Contagem
      </h5>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor do Fundo
        </label>
        <ColorPicker
          color={currentConfig.view_all_badge_bg_color || '#ef4444'}
          onChange={(color) => handleConfigChange('view_all_badge_bg_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor do Texto
        </label>
        <ColorPicker
          color={currentConfig.view_all_badge_text_color || '#ffffff'}
          onChange={(color) => handleConfigChange('view_all_badge_text_color', color)}
        />
      </div>
    </div>

    {/* Configurações do Botão "Voltar" */}
    <div>
      <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#4b5563' }}>
        Botão "Voltar para Carrosséis"
      </h5>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor de Fundo
        </label>
        <ColorPicker
          color={currentConfig.view_all_back_button_bg_color || '#f3f4f6'}
          onChange={(color) => handleConfigChange('view_all_back_button_bg_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor do Texto
        </label>
        <ColorPicker
          color={currentConfig.view_all_back_button_text_color || '#374151'}
          onChange={(color) => handleConfigChange('view_all_back_button_text_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor de Fundo (Hover)
        </label>
        <ColorPicker
          color={currentConfig.view_all_back_button_hover_bg_color || '#e5e7eb'}
          onChange={(color) => handleConfigChange('view_all_back_button_hover_bg_color', color)}
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Cor do Texto (Hover)
        </label>
        <ColorPicker
          color={currentConfig.view_all_back_button_hover_text_color || '#1f2937'}
          onChange={(color) => handleConfigChange('view_all_back_button_hover_text_color', color)}
        />
      </div>
    </div>
  </div>
</div>

          {/* Mensagem e Botões */}
          {message && (
            <div style={{
              padding: '12px 16px',
              background: message.includes('sucesso') ? '#d1fae5' : '#fee2e2',
              color: message.includes('sucesso') ? '#065f46' : '#991b1b',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={resetToDefaults}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1
              }}
            >
              🔄 Restaurar Padrões
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? 'Salvando...' : '💾 Salvar Configurações'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}