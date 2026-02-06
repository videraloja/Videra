// app/admin/themes/components/HeroBannerManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { heroBannerService, HeroBanner } from '@/lib/heroBannerService';

export default function HeroBannerManager() {
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    image_url: '',
    link_url: '',
    is_active: true,
    transition_time: 5,
    start_date: '',
    end_date: ''
  });

  // Carregar banners
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Erro ao carregar banners:', error);
        return;
      }
      
      setHeroBanners(data || []);
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const imageUrl = await heroBannerService.uploadImage(file);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
        alert('✅ Imagem enviada com sucesso!');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('❌ Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.image_url) {
    alert('❌ Por favor, faça upload de uma imagem');
    return;
  }
  
  if (!formData.link_url) {
    alert('❌ Por favor, informe a URL de destino');
    return;
  }
  
  try {
    // Preparar dados para envio - converter string vazia para undefined
    const bannerData: Omit<HeroBanner, 'id' | 'created_at'> = {
      image_url: formData.image_url,
      link_url: formData.link_url,
      is_active: formData.is_active,
      transition_time: formData.transition_time,
      display_order: editingBanner ? editingBanner.display_order : 0, // Será sobrescrito abaixo
      start_date: formData.start_date || undefined, // String vazia → undefined
      end_date: formData.end_date || undefined,     // String vazia → undefined
    };
    
    if (editingBanner) {
      await heroBannerService.updateBanner(editingBanner.id, bannerData);
      alert('✅ Banner atualizado com sucesso!');
    } else {
      // Calcular próxima ordem
      const nextOrder = heroBanners.length > 0 
        ? Math.max(...heroBanners.map(b => b.display_order)) + 1 
        : 0;
      
      await heroBannerService.createBanner({
        ...bannerData,
        display_order: nextOrder
      });
      alert('✅ Banner criado com sucesso!');
    }
    
    setShowForm(false);
    setEditingBanner(null);
    setFormData({
      image_url: '',
      link_url: '',
      is_active: true,
      transition_time: 5,
      start_date: '',
      end_date: ''
    });
    
    loadBanners();
  } catch (error) {
    console.error('Erro ao salvar banner:', error);
    alert('❌ Erro ao salvar banner');
  }
};

  const handleEdit = (banner: HeroBanner) => {
  setEditingBanner(banner);
  setFormData({
    image_url: banner.image_url,
    link_url: banner.link_url,
    is_active: banner.is_active,
    transition_time: banner.transition_time,
    start_date: banner.start_date || '', // undefined/null → string vazia
    end_date: banner.end_date || '',     // undefined/null → string vazia
  });
  setShowForm(true);
};

  const handleDelete = async (id: string) => {
    if (confirm('⚠️ Tem certeza que deseja excluir este banner?\nEsta ação não pode ser desfeita.')) {
      try {
        const success = await heroBannerService.deleteBanner(id);
        if (success) {
          alert('✅ Banner excluído com sucesso!');
          loadBanners();
        } else {
          alert('❌ Erro ao excluir banner');
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('❌ Erro ao excluir banner');
      }
    }
  };

  const handleToggleActive = async (banner: HeroBanner) => {
    try {
      await heroBannerService.updateBanner(banner.id, {
        is_active: !banner.is_active
      });
      alert(`✅ Banner ${!banner.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      loadBanners();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('❌ Erro ao alterar status do banner');
    }
  };

  const handleReorder = async (startIndex: number, endIndex: number) => {
    const items = Array.from(heroBanners);
    const [removed] = items.splice(startIndex, 1);
    items.splice(endIndex, 0, removed);
    
    // Atualizar ordem localmente
    const reorderedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }));
    
    setHeroBanners(reorderedItems);
    setReordering(true);
    
    try {
      await heroBannerService.reorderBanners(reorderedItems.map(item => item.id));
      alert('✅ Ordem atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar ordem:', error);
      alert('❌ Erro ao salvar nova ordem');
      loadBanners(); // Recarregar ordem original
    } finally {
      setReordering(false);
    }
  };

  // Formatação da data
const formatDate = (dateString?: string | null) => {  // ← ACEITA null também
  if (!dateString) return 'Sem data';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};
  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
            🖼️ Gerenciador de Hero Banners ({heroBanners.length})
          </h2>
          
          <button
            onClick={() => {
              setEditingBanner(null);
              setFormData({
                image_url: '',
                link_url: '',
                is_active: true,
                transition_time: 5,
                start_date: '',
                end_date: ''
              });
              setShowForm(true);
            }}
            style={{
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#6d28d9';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#7c3aed';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ➕ Adicionar Banner
          </button>
        </div>

        {/* Formulário (modal) */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                  {editingBanner ? '✏️ Editar Banner' : '🖼️ Novo Banner'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingBanner(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {/* Upload de imagem */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Imagem do Banner *
                  </label>
                  
                  {formData.image_url && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        width: '100%',
                        height: '200px',
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '12px',
                        border: '2px solid #e5e7eb'
                      }}>
                        <img 
                          src={formData.image_url} 
                          alt="Preview" 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        wordBreak: 'break-all',
                        padding: '8px',
                        background: '#f9fafb',
                        borderRadius: '4px'
                      }}>
                        {formData.image_url}
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Verificar tamanho (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert('❌ Arquivo muito grande. Máximo: 5MB');
                          return;
                        }
                        handleUploadImage(file);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: uploading ? '#f3f4f6' : 'white'
                    }}
                    disabled={uploading}
                  />
                  
                  {uploading && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '8px',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      <div style={{ 
                        animation: 'spin 1s linear infinite',
                        fontSize: '16px'
                      }}>
                        🔄
                      </div>
                      Fazendo upload...
                    </div>
                  )}
                  
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', lineHeight: '1.4' }}>
                    <strong>📐 Dimensão recomendada:</strong> 1920x600px (16:5)<br/>
                    <strong>📦 Formato:</strong> JPG ou PNG<br/>
                    <strong>⚡ Tamanho máximo:</strong> 5MB
                  </p>
                </div>

                {/* URL de destino */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    URL de Destino *
                  </label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="Ex: /pokemontcg, /produto/123, https://..."
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    Para páginas internas use: /nome-da-pagina (ex: /pokemontcg)<br/>
                    Para links externos use: https://exemplo.com
                  </p>
                </div>

                {/* Tempo de transição */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Tempo de Transição (segundos)
                  </label>
                  <select
                    value={formData.transition_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, transition_time: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    <option value="3">3 segundos</option>
                    <option value="4">4 segundos</option>
                    <option value="5">5 segundos (recomendado)</option>
                    <option value="7">7 segundos</option>
                    <option value="10">10 segundos</option>
                  </select>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    Quanto tempo cada banner fica visível antes de trocar automaticamente
                  </p>
                </div>

                {/* Datas opcionais */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Data de Início (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
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
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Data de Término (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
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
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
                  ⏰ Use datas para banners temporários (promoções sazonais). Deixe em branco para banner permanente.
                </p>

                {/* Status */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      Banner ativo (visível no site)
                    </span>
                  </label>
                </div>

                {/* Botões */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#059669';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#10b981';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {editingBanner ? '💾 Salvar Alterações' : '✅ Criar Banner'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingBanner(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#4b5563';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#6b7280';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de banners */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              animation: 'pulse 2s infinite'
            }}>
              🖼️
            </div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              Carregando banners...
            </p>
          </div>
        ) : heroBanners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🖼️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#6b7280' }}>
              Nenhum banner encontrado
            </h3>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
              Adicione seu primeiro banner promocional para começar
            </p>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {/* Contadores */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: '#f0f9ff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ fontSize: '12px', color: '#0369a1', marginBottom: '4px' }}>
                  Total
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7' }}>
                  {heroBanners.length}
                </div>
              </div>
              
              <div style={{
                background: '#f0fdf4',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '12px', color: '#059669', marginBottom: '4px' }}>
                  Ativos
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {heroBanners.filter(b => b.is_active).length}
                </div>
              </div>
              
              <div style={{
                background: '#fef2f2',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px' }}>
                  Inativos
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                  {heroBanners.filter(b => !b.is_active).length}
                </div>
              </div>
            </div>

            {/* Lista */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              {heroBanners.map((banner, index) => (
                <div 
                  key={banner.id}
                  style={{
                    padding: '16px',
                    borderBottom: index < heroBanners.length - 1 ? '1px solid #e5e7eb' : 'none',
                    background: banner.is_active ? 'white' : '#f9fafb',
                    opacity: banner.is_active ? 1 : 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Ícone de ordem */}
                  <div style={{
                    color: '#9ca3af',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    minWidth: '24px'
                  }}>
                    {banner.display_order + 1}
                  </div>
                  
                  {/* Preview da imagem */}
                  <div style={{
                    width: '100px',
                    height: '50px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(banner.image_url, '_blank')}
                  title="Clique para ver em tamanho real"
                  >
                    <img 
                      src={banner.image_url} 
                      alt="Banner"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  
                  {/* Informações */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {banner.link_url}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span>🕒 {banner.transition_time}s</span>
                      <span>📅 {formatDate(banner.start_date)} → {formatDate(banner.end_date)}</span>
                      <span>🆔 {banner.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  <div style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px',
                    background: banner.is_active ? '#d1fae5' : '#f3f4f6',
                    color: banner.is_active ? '#065f46' : '#6b7280',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: `1px solid ${banner.is_active ? '#a7f3d0' : '#e5e7eb'}`,
                    whiteSpace: 'nowrap'
                  }}>
                    {banner.is_active ? '✅ ATIVO' : '⏸️ INATIVO'}
                  </div>
                  
                  {/* Ações */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    flexShrink: 0
                  }}>
                    <button
                      onClick={() => handleEdit(banner)}
                      style={{
                        background: '#e0e7ff',
                        color: '#3730a3',
                        border: '1px solid #c7d2fe',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#c7d2fe';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#e0e7ff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title="Editar banner"
                    >
                      ✏️ Editar
                    </button>
                    
                    <button
                      onClick={() => handleToggleActive(banner)}
                      style={{
                        background: banner.is_active ? '#fef3c7' : '#d1fae5',
                        color: banner.is_active ? '#92400e' : '#065f46',
                        border: `1px solid ${banner.is_active ? '#fde68a' : '#a7f3d0'}`,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = banner.is_active ? '#fde68a' : '#a7f3d0';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = banner.is_active ? '#fef3c7' : '#d1fae5';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title={banner.is_active ? 'Desativar banner' : 'Ativar banner'}
                    >
                      {banner.is_active ? '⏸️ Desativar' : '▶️ Ativar'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(banner.id)}
                      style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fecaca';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title="Excluir banner permanentemente"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Instruções */}
            <div style={{ 
              marginTop: '24px',
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💡 Como usar os Hero Banners
              </h4>
              <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.6', opacity: '0.9' }}>
                <li>Os banners aparecem como carrossel automático em <strong>todas as páginas do site</strong></li>
                <li>Clique em "Adicionar Banner" para criar novos banners promocionais</li>
                <li>Use a <strong>ordem numérica</strong> para controlar a sequência de exibição</li>
                <li>Banners <strong>inativos não são exibidos</strong> no site</li>
                <li>Use <strong>datas</strong> para banners temporários (promoções sazonais)</li>
                <li><strong>Dimensão ideal:</strong> 1920x600px • <strong>Formato:</strong> JPG ou PNG</li>
              </ul>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  );
}