// app/admin/themes/page.tsx - VERSÃO ATUALIZADA COM AUTHGUARD
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';
import { usePageTheme, PAGE_IDS } from '../../contexts/PageThemeContext';
import { ThemeEditor } from '../../components/ThemeEditor';
import { supabase } from '@/lib/supabaseClient';
import CarouselEditor from '../../components/CarouselEditor';
import AuthGuard from '../../components/AuthGuard'; // 🆕 IMPORT DO AUTHGUARD
import HeroBannerManager from '../../components/HeroBannerManager';
import PromotionalPageManager from '../../components/PromotionalPageManager';

function ThemesAdminPageContent() {
  const { allThemes, activateSeasonalTheme, deactivateSeasonalTheme, currentThemeConfig, isLoading, createNewTheme, deleteTheme } = useTheme();
  const { pageThemes, setPageTheme, clearPageTheme, currentPageId } = usePageTheme();
  
  const [showPageModal, setShowPageModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [themeToDelete, setThemeToDelete] = useState<any>(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [baseThemeId, setBaseThemeId] = useState('default');
  const [isCreating, setIsCreating] = useState(false);
  const [activeSection, setActiveSection] = useState<'themes' | 'editor' | 'carrosséis' | 'hero' | 'promo'>('themes');
  const [isActivating, setIsActivating] = useState<string | null>(null);

  const handleActivateTheme = async (themeId: string, themeName: string) => {
    if (confirm(`Ativar tema "${themeName}" globalmente?`)) {
      setIsActivating(themeId);
      try {
        await activateSeasonalTheme(themeId);
        alert(`✅ Tema "${themeName}" ativado com sucesso!`);
        setTimeout(() => window.location.reload(), 800);
      } catch (error) {
        alert('❌ Erro ao ativar tema. Tente novamente.');
      } finally {
        setIsActivating(null);
      }
    }
  };

  const handleDeactivateTheme = async (themeId: string, themeName: string) => {
    if (themeId === 'default') {
      if (confirm(`O tema padrão não pode ser desativado. Deseja continuar?`)) {
        return;
      }
    }
    
    if (confirm(`Desativar tema "${themeName}" e voltar para o tema padrão?`)) {
      setIsActivating('default');
      try {
        await activateSeasonalTheme('default');
        alert(`✅ Tema padrão ativado! O tema "${themeName}" foi desativado.`);
        setTimeout(() => window.location.reload(), 800);
      } catch (error) {
        alert('❌ Erro ao desativar tema. Tente novamente.');
      } finally {
        setIsActivating(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>🎨</div>
        <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>Carregando temas...</div>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>Aguarde enquanto carregamos sua biblioteca de temas</div>
      </div>
    );
  }

  if (!allThemes || allThemes.length === 0) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Nenhum tema encontrado</h1>
        <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '24px' }}>
          Não foi possível carregar os temas. Isso pode ser um problema temporário.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  const themes = allThemes.map(theme => ({
    ...theme,
    status: theme.isActive ? 'ativo' : 'inativo',
    type: theme.id === 'default' ? 'sistema' : 'sazonal',
    appliedPages: Object.entries(pageThemes)
      .filter(([_, pageTheme]) => pageTheme.themeId === theme.id)
      .map(([pageId]) => PAGE_IDS[pageId as keyof typeof PAGE_IDS] || pageId)
  }));

  const handleOpenPageModal = (themeId: string) => {
    setSelectedTheme(themeId);
    setShowPageModal(true);
  };

  const handleApplyToPage = async (pageId: string) => {
    const theme = allThemes.find(t => t.id === selectedTheme);
    const pageName = PAGE_IDS[pageId as keyof typeof PAGE_IDS] || pageId;
    
    if (theme && confirm(`Aplicar tema "${theme.name}" à página "${pageName}"?`)) {
      try {
        console.log(`🎯 Aplicando tema ${selectedTheme} à página ${pageId}...`);
        
        const { error } = await supabase
          .from('page_themes')
          .upsert({
            page_path: pageId,
            theme_id: selectedTheme,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'page_path',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error('❌ Erro ao salvar tema no Supabase:', error);
          alert('❌ Erro ao aplicar tema. Tente novamente.');
          return;
        }
        
        console.log(`✅ Tema salvo no Supabase para página ${pageId}`);
        
        setPageTheme(pageId, selectedTheme);
        setShowPageModal(false);
        setSelectedTheme('');
        
        alert(`🎉 Tema "${theme.name}" aplicado à página "${pageName}"!`);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('❌ Erro ao aplicar tema:', error);
        alert('❌ Erro ao aplicar tema. Tente novamente.');
      }
    }
  };

  const handleRemoveFromPage = async (pageId: string, themeName: string) => {
    const pageName = PAGE_IDS[pageId as keyof typeof PAGE_IDS] || pageId;
    
    if (confirm(`Remover tema "${themeName}" da página "${pageName}"?`)) {
      try {
        console.log(`🗑️ Removendo tema da página ${pageId}...`);
        
        const { error } = await supabase
          .from('page_themes')
          .delete()
          .eq('page_path', pageId);
        
        if (error) {
          console.error('❌ Erro ao remover tema do Supabase:', error);
          alert('❌ Erro ao remover tema. Tente novamente.');
          return;
        }
        
        console.log(`✅ Tema removido do Supabase para página ${pageId}`);
        
        clearPageTheme(pageId);
        
        alert(`✅ Tema "${themeName}" removido da página "${pageName}"!`);
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('❌ Erro ao remover tema:', error);
        alert('❌ Erro ao remover tema. Tente novamente.');
      }
    }
  };

  const handleOpenCreateModal = () => {
    setNewThemeName('');
    setBaseThemeId('default');
    setShowCreateModal(true);
  };

  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) {
      alert('Por favor, digite um nome para o novo tema');
      return;
    }

    setIsCreating(true);

    try {
      const newTheme = await createNewTheme(baseThemeId, newThemeName.trim());
      
      setShowCreateModal(false);
      setNewThemeName('');
      setIsCreating(false);
      
      alert(`🎉 Tema "${newThemeName}" criado com sucesso! Redirecionando para edição...`);
      
      setTimeout(() => {
        window.location.href = `/admin/themes/edit/${newTheme.id}`;
      }, 500);
      
    } catch (error) {
      console.error('Erro ao criar tema:', error);
      alert('❌ Erro ao criar tema. Tente novamente.');
      setIsCreating(false);
    }
  };

  const handleOpenDeleteModal = (theme: any) => {
    setThemeToDelete(theme);
    setShowDeleteModal(true);
  };

  const handleDeleteTheme = () => {
    if (themeToDelete) {
      deleteTheme(themeToDelete.id);
      setShowDeleteModal(false);
      setThemeToDelete(null);
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const activeThemesCount = themes.filter(theme => theme.status === 'ativo').length;
  const seasonalThemesCount = themes.filter(theme => theme.type === 'sazonal').length;
  const pagesWithCustomThemes = Object.keys(pageThemes).length;

  const renderThemesSection = () => (
    <>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Temas Ativos</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {activeThemesCount}
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Temas Sazonais</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {seasonalThemesCount}
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Tema Atual</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {currentThemeConfig?.name || 'Carregando...'}
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Páginas Personalizadas</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899' }}>
            {pagesWithCustomThemes}
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Todos os Temas ({themes.length})</h2>
          <button 
            onClick={handleOpenCreateModal}
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
              gap: '6px'
            }}
          >
            ➕ Novo Tema
          </button>
        </div>

        <div style={{ padding: '0' }}>
          {themes.map((theme, index) => (
            <div 
              key={theme.id}
              style={{ 
                padding: '20px',
                borderBottom: index < themes.length - 1 ? '1px solid #f3f4f6' : 'none',
                background: theme.status === 'ativo' ? '#f0f9ff' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: theme.type === 'sazonal' ? '#fef3c7' : '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>
                    {theme.type === 'sazonal' ? '🎪' : '🏠'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>
                      {theme.name}
                      {theme.status === 'ativo' && (
                        <span style={{
                          background: '#10b981',
                          color: 'white',
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          marginLeft: '8px'
                        }}>
                          Ativo
                        </span>
                      )}
                      {theme.id === 'default' && (
                        <span style={{
                          background: '#6b7280',
                          color: 'white',
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          marginLeft: '8px'
                        }}>
                          Sistema
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                      {theme.description}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link 
                    href={`/admin/themes/edit/${theme.id}`}
                    style={{
                      background: '#f8fafc',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Editar
                  </Link>
                  
                  <button 
                    onClick={() => handleOpenPageModal(theme.id)}
                    style={{
                      background: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    🎯 Aplicar à Página
                  </button>
                  
                  {theme.id !== 'default' && (
                    <button 
                      onClick={() => handleOpenDeleteModal(theme)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Excluir
                    </button>
                  )}
                  
                  {theme.status === 'inativo' ? (
                    <button 
                      onClick={() => handleActivateTheme(theme.id, theme.name)}
                      disabled={isActivating === theme.id}
                      style={{
                        background: isActivating === theme.id ? '#9ca3af' : '#7c3aed',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: isActivating === theme.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isActivating === theme.id ? '⏳ Ativando...' : 'Ativar'}
                    </button>
                  ) : theme.id === 'default' ? (
                    <button 
                      disabled
                      style={{
                        background: '#d1d5db',
                        color: '#6b7280',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'not-allowed'
                      }}
                    >
                      🔒 Sistema
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleDeactivateTheme(theme.id, theme.name)}
                      disabled={isActivating === 'default'}
                      style={{
                        background: isActivating === 'default' ? '#9ca3af' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: isActivating === 'default' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isActivating === 'default' ? '⏳ Desativando...' : 'Desativar'}
                    </button>
                  )}
                </div>
              </div>

              {theme.appliedPages.length > 0 && (
                <div style={{ 
                  marginTop: '12px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '8px' }}>
                    🎯 Aplicado nas páginas:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {theme.appliedPages.map((pageName, index) => {
                      const pageId = Object.entries(PAGE_IDS).find(([_, name]) => name === pageName)?.[0] || pageName;
                      return (
                        <span 
                          key={index}
                          style={{
                            background: '#e0e7ff',
                            color: '#3730a3',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {pageName}
                          <button 
                            onClick={() => handleRemoveFromPage(pageId, theme.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '0',
                              marginLeft: '4px'
                            }}
                            title={`Remover de ${pageName}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        marginTop: '30px',
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>💡 Como funciona</h3>
        <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
          <p><strong>🎯 Temas por Página:</strong> Aplique temas específicos a páginas individuais. Eles terão prioridade sobre o tema global.</p>
          <p><strong>🌍 Tema Global:</strong> Ative um tema para aplicar em todo o site (exceto páginas com temas específicos).</p>
          <p><strong>🎨 Criar Novo Tema:</strong> Use "Novo Tema" para criar um tema personalizado baseado em um tema existente.</p>
          <p><strong>⚠️ Tema Padrão:</strong> O tema padrão é do sistema e não pode ser excluído ou desativado permanentemente.</p>
          <p><strong>📊 Hierarquia:</strong> Página Específico → Global → Padrão</p>
        </div>
      </div>
    </>
  );

  const renderEditorSection = () => (
    <div style={{ marginTop: '20px' }}>
      <ThemeEditor />
    </div>
  );

  const renderCarouselsSection = () => (
    <div style={{ marginTop: '20px' }}>
      <CarouselEditor pageSlug="pokemontcg" />
    </div>
  );
  const renderHeroSection = () => (
  <div style={{ marginTop: '20px' }}>
    <HeroBannerManager />
  </div>
);


  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              🎨 Gerenciador de Personalização
            </h1>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Gerencie temas, estilos de cards e configurações de carrosséis
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          backgroundColor: '#f8fafc',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveSection('themes')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeSection === 'themes' ? '#7c3aed' : 'transparent',
              color: activeSection === 'themes' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📋 Lista de Temas
          </button>
          <button
            onClick={() => setActiveSection('editor')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeSection === 'editor' ? '#7c3aed' : 'transparent',
              color: activeSection === 'editor' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🎴 Editor Granular (Cards)
          </button>
          <button
            onClick={() => setActiveSection('carrosséis')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeSection === 'carrosséis' ? '#7c3aed' : 'transparent',
              color: activeSection === 'carrosséis' ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🎠 Editor de Carrosséis
          </button>
          <button
  onClick={() => setActiveSection('hero')}
  style={{
    flex: 1,
    padding: '12px 16px',
    background: activeSection === 'hero' ? '#7c3aed' : 'transparent',
    color: activeSection === 'hero' ? 'white' : '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }}
>
  🖼️ Hero Banners
</button>
{/* 🆕 ADICIONE ESTE BOTÃO DEPOIS DO BOTÃO "HERO BANNERS": */}
<button
  onClick={() => setActiveSection('promo')}
  style={{
    flex: 1,
    padding: '12px 16px',
    background: activeSection === 'promo' ? '#7c3aed' : 'transparent',
    color: activeSection === 'promo' ? 'white' : '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }}
>
  🔥 Promoções
</button>
        </div>
      </div>

      {showPageModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              🎯 Aplicar Tema à Página
            </h3>
            
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              Selecione a página onde deseja aplicar este tema:
            </p>

            <div style={{ marginBottom: '20px' }}>
              {Object.entries(PAGE_IDS).map(([pageId, pageName]) => {
                const currentTheme = pageThemes[pageId]?.themeId;
                const isApplied = currentTheme === selectedTheme;
                
                return (
                  <button
                    key={pageId}
                    onClick={() => handleApplyToPage(pageId)}
                    disabled={isApplied}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      marginBottom: '8px',
                      background: isApplied ? '#10b981' : '#f8fafc',
                      color: isApplied ? 'white' : '#374151',
                      border: `1px solid ${isApplied ? '#10b981' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isApplied ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>
                      {pageName.charAt(0).toUpperCase() + pageName.slice(1).replace('-', ' ')}
                    </span>
                    {isApplied && <span>✅</span>}
                  </button>
                );
              })}
            </div>
          

            <button
              onClick={() => setShowPageModal(false)}
              style={{
                width: '100%',
                padding: '12px 16px',
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
          </div>
        </div>
      )}

      {showCreateModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            width: '90%',
            maxWidth: '450px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              🎨 Criar Novo Tema
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Nome do Tema *
                </label>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="Ex: Meu Tema Personalizado"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleCreateTheme();
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Copiar configurações de:
                </label>
                <select
                  value={baseThemeId}
                  onChange={(e) => setBaseThemeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  {allThemes.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name} {theme.isActive && '⭐'}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  O novo tema começará com as mesmas cores e configurações do tema selecionado.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCreateTheme}
                disabled={!newThemeName.trim() || isCreating}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: (!newThemeName.trim() || isCreating) ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (!newThemeName.trim() || isCreating) ? 'not-allowed' : 'pointer'
                }}
              >
                {isCreating ? '⏳ Criando...' : '✅ Criar Tema'}
              </button>
              
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: isCreating ? '#9ca3af' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isCreating ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && themeToDelete && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            width: '90%',
            maxWidth: '450px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#ef4444' }}>
              🗑️ Excluir Tema
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                padding: '16px', 
                background: '#fef2f2', 
                borderRadius: '8px',
                border: '1px solid #fecaca',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '12px' }}>⚠️</div>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', textAlign: 'center', marginBottom: '8px' }}>
                  Tem certeza que deseja excluir este tema?
                </p>
                <p style={{ fontSize: '14px', color: '#ef4444', textAlign: 'center' }}>
                  Esta ação não pode ser desfeita!
                </p>
              </div>

              <div style={{ 
                padding: '12px', 
                background: '#f8fafc', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {themeToDelete.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {themeToDelete.description}
                </div>
                {themeToDelete.appliedPages && themeToDelete.appliedPages.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
                    ⚠️ Este tema está aplicado em {themeToDelete.appliedPages.length} página(s)
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDeleteTheme}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🗑️ Sim, Excluir
              </button>
              
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
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
            </div>
          </div>
        </div>
      )}

      {activeSection === 'themes' && renderThemesSection()}
      {activeSection === 'editor' && renderEditorSection()}
      {activeSection === 'carrosséis' && renderCarouselsSection()}
      {activeSection === 'hero' && renderHeroSection()}
      {activeSection === 'promo' && (
  <div style={{ marginTop: '20px' }}>
    <PromotionalPageManager />
   </div>
      )}
      
    </div> 
  );
}
// 🆕 ENVOLVA O CONTEÚDO COM AUTHGUARD
export default function ThemesAdminPage() {
  return (
    <AuthGuard>
      <ThemesAdminPageContent />
    </AuthGuard>
  );
}