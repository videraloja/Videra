'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { heroBannerService, HeroBanner } from '@/lib/heroBannerService';

export default function HeroBannerManager() {
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    image_url: '',
    image_mobile_url: '',
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

  const handleUploadImage = async (file: File, type: 'desktop' | 'mobile') => {
    if (!file) return;
    
    if (type === 'desktop') setUploadingDesktop(true);
    else setUploadingMobile(true);
    
    try {
      const prefix = type === 'desktop' ? 'hero-banner' : 'hero-banner-mobile';
      const imageUrl = await heroBannerService.uploadImage(file, prefix);
      
      if (imageUrl) {
        if (type === 'desktop') {
          setFormData(prev => ({ ...prev, image_url: imageUrl }));
        } else {
          setFormData(prev => ({ ...prev, image_mobile_url: imageUrl }));
        }
        alert(`✅ Imagem ${type === 'desktop' ? 'desktop' : 'mobile'} enviada com sucesso!`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('❌ Erro ao fazer upload da imagem');
    } finally {
      if (type === 'desktop') setUploadingDesktop(false);
      else setUploadingMobile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image_url) {
      alert('❌ Por favor, faça upload da imagem desktop');
      return;
    }
    
    if (!formData.link_url) {
      alert('❌ Por favor, informe a URL de destino');
      return;
    }
    
    try {
      const bannerData: Omit<HeroBanner, 'id' | 'created_at'> = {
        image_url: formData.image_url,
        image_mobile_url: formData.image_mobile_url || null,
        link_url: formData.link_url,
        is_active: formData.is_active,
        transition_time: formData.transition_time,
        display_order: editingBanner ? editingBanner.display_order : 0,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };
      
      if (editingBanner) {
        await heroBannerService.updateBanner(editingBanner.id, bannerData);
        alert('✅ Banner atualizado com sucesso!');
      } else {
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
        image_mobile_url: '',
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
      image_mobile_url: banner.image_mobile_url || '',
      link_url: banner.link_url,
      is_active: banner.is_active,
      transition_time: banner.transition_time,
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
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

  const formatDate = (dateString?: string | null) => {
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
                image_mobile_url: '',
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
              maxWidth: '700px',
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
                {/* Imagem Desktop */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    🖥️ Imagem Desktop *
                  </label>
                  
                  {formData.image_url && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        width: '100%',
                        height: '180px',
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '12px',
                        border: '2px solid #e5e7eb',
                        background: '#f3f4f6'
                      }}>
                        <img 
                          src={formData.image_url} 
                          alt="Preview Desktop" 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            background: '#f3f4f6'
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('❌ Arquivo muito grande. Máximo: 5MB');
                          return;
                        }
                        handleUploadImage(file, 'desktop');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: uploadingDesktop ? '#f3f4f6' : 'white'
                    }}
                    disabled={uploadingDesktop}
                  />
                  
                  {uploadingDesktop && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                      <div style={{ animation: 'spin 1s linear infinite' }}>🔄</div>
                      Enviando imagem desktop...
                    </div>
                  )}
                  
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', lineHeight: '1.4' }}>
                    <strong>📐 Dimensão recomendada:</strong> 1920x600px (16:5)<br/>
                    <strong>📦 Formato:</strong> JPG, PNG ou WebP<br/>
                    <strong>⚡ Tamanho máximo:</strong> 5MB
                  </p>
                </div>

                {/* Imagem Mobile */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    📱 Imagem Mobile (opcional)
                  </label>
                  
                  {formData.image_mobile_url && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        width: '100%',
                        height: '180px',
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '12px',
                        border: '2px solid #e5e7eb',
                        background: '#f3f4f6'
                      }}>
                        <img 
                          src={formData.image_mobile_url} 
                          alt="Preview Mobile" 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            background: '#f3f4f6'
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('❌ Arquivo muito grande. Máximo: 5MB');
                          return;
                        }
                        handleUploadImage(file, 'mobile');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: uploadingMobile ? '#f3f4f6' : 'white'
                    }}
                    disabled={uploadingMobile}
                  />
                  
                  {uploadingMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                      <div style={{ animation: 'spin 1s linear infinite' }}>🔄</div>
                      Enviando imagem mobile...
                    </div>
                  )}
                  
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', lineHeight: '1.4' }}>
                    <strong>📐 Dimensão recomendada:</strong> 750x600px (5:4) ou 750x422px (16:9)<br/>
                    <strong>💡 Dica:</strong> Se não enviar, usará a imagem desktop no mobile<br/>
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
                    🔗 URL de Destino *
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
                    ⏱️ Tempo de Transição (segundos)
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
                      📅 Data de Início (opcional)
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
                      📅 Data de Término (opcional)
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
                      ✅ Banner ativo (visível no site)
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
          <div className="global-loading-container" style={{ padding: '60px 20px' }}>
            <div className="global-spinner"></div>
            <p className="global-loading-text">Carregando banners...</p>
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
              <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '12px', color: '#0369a1', marginBottom: '4px' }}>Total</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7' }}>{heroBanners.length}</div>
              </div>
              
              <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '12px', color: '#059669', marginBottom: '4px' }}>Ativos</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{heroBanners.filter(b => b.is_active).length}</div>
              </div>
              
              <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px' }}>Inativos</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{heroBanners.filter(b => !b.is_active).length}</div>
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
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ color: '#9ca3af', fontSize: '16px', fontWeight: 'bold', minWidth: '24px' }}>
                    {banner.display_order + 1}
                  </div>
                  
                  {/* Preview Desktop */}
                  <div style={{
                    width: '80px',
                    height: '45px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid #e5e7eb',
                    background: '#f3f4f6'
                  }}>
                    <img 
                      src={banner.image_url} 
                      alt="Desktop"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Preview Mobile (se existir) */}
                  <div style={{
                    width: '40px',
                    height: '45px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid #e5e7eb',
                    background: '#f3f4f6'
                  }}>
                    <img 
                      src={banner.image_mobile_url || banner.image_url} 
                      alt="Mobile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {!banner.image_mobile_url && (
                      <div style={{ fontSize: '8px', textAlign: 'center', background: '#fef3c7' }}>usa desktop</div>
                    )}
                  </div>
                  
                  {/* Informações */}
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '500', 
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {banner.link_url}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span>🕒 {banner.transition_time}s</span>
                      <span>📅 {formatDate(banner.start_date)} → {formatDate(banner.end_date)}</span>
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
                    whiteSpace: 'nowrap'
                  }}>
                    {banner.is_active ? '✅ ATIVO' : '⏸️ INATIVO'}
                  </div>
                  
                  {/* Ações */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => handleEdit(banner)} style={{
                      background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe',
                      padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                    }}>✏️</button>
                    
                    <button onClick={() => handleToggleActive(banner)} style={{
                      background: banner.is_active ? '#fef3c7' : '#d1fae5',
                      color: banner.is_active ? '#92400e' : '#065f46',
                      padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                    }}>{banner.is_active ? '⏸️' : '▶️'}</button>
                    
                    <button onClick={() => handleDelete(banner.id)} style={{
                      background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
                      padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                    }}>🗑️</button>
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
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                💡 Dicas para imagens responsivas
              </h4>
              <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: '1.6' }}>
                <li><strong>Desktop:</strong> 1920x600px (16:5) - imagem horizontal completa</li>
                <li><strong>Mobile:</strong> 750x600px (5:4) ou 750x422px (16:9) - imagem mais alta</li>
                <li><strong>Dica:</strong> No mobile, centralize o texto e use letras maiores</li>
                <li><strong>Se não enviar imagem mobile</strong>, usará a imagem desktop redimensionada</li>
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