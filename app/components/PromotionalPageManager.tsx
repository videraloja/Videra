// app/admin/themes/components/PromotionalPageManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { promotionalPagesService, PromotionalPage } from '@/lib/promotionalPagesService';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function PromotionalPageManager() {
  const [pages, setPages] = useState<PromotionalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<PromotionalPage | null>(null);
  
  // Formulário de criação
  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    description: '',
    is_active: true
  });

  // Carregar páginas
  const loadPages = async () => {
    setLoading(true);
    try {
      const pagesData = await promotionalPagesService.getAllPages();
      setPages(pagesData);
    } catch (error) {
      console.error('❌ Erro ao carregar páginas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  // Gerar slug automático a partir do título - MELHORADO!
  const generateSlug = (title: string) => {
    if (!title || title.trim() === '') return '';
    
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais (mantém hífen)
      .replace(/\s+/g, '-') // Espaços para hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, '') // Remove hífens do início e fim
      .trim();
  };

  // Criar nova página
  const handleCreatePage = async () => {
    if (!newPage.title.trim()) {
      alert('Digite um título para a página');
      return;
    }

    try {
      // 🔥 CORREÇÃO: GERAR SLUG SE ESTIVER VAZIO
      let slug = newPage.slug;
      if (!slug || slug.trim() === '') {
        slug = generateSlug(newPage.title);
      }
      
      // Validar slug gerado
      if (!slug || slug.length < 3) {
        alert('O slug gerado é muito curto. Digite um título mais descritivo ou preencha o slug manualmente.');
        return;
      }
      
      const pageData = {
        slug,
        title: newPage.title,
        description: newPage.description,
        filters: {},
        product_ids: [],
        is_active: newPage.is_active,
        theme_id: undefined
      };

      const createdPage = await promotionalPagesService.createPage(pageData);
      
      if (createdPage) {
        alert(`✅ Página "${newPage.title}" criada com sucesso!`);
        setShowCreateModal(false);
        setNewPage({ title: '', slug: '', description: '', is_active: true });
        loadPages();
        
        // Redirecionar para edição
        setTimeout(() => {
          window.location.href = `/admin/promocao/edit/${createdPage.id}`;
        }, 500);
      }
    } catch (error) {
      console.error('❌ Erro ao criar página:', error);
      alert('❌ Erro ao criar página. Tente novamente.');
    }
  };

  // Excluir página
  const handleDeletePage = async () => {
    if (!pageToDelete) return;

    try {
      const success = await promotionalPagesService.deletePage(pageToDelete.id);
      
      if (success) {
        alert(`✅ Página "${pageToDelete.title}" excluída!`);
        setShowDeleteModal(false);
        setPageToDelete(null);
        loadPages();
      }
    } catch (error) {
      console.error('❌ Erro ao excluir página:', error);
      alert('❌ Erro ao excluir página. Tente novamente.');
    }
  };

  // Alternar status da página
  const togglePageStatus = async (page: PromotionalPage) => {
    try {
      const updatedPage = await promotionalPagesService.updatePage(page.id, {
        is_active: !page.is_active
      });
      
      if (updatedPage) {
        alert(`✅ Página ${updatedPage.is_active ? 'ativada' : 'desativada'}!`);
        loadPages();
      }
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
    }
  };

  // Estatísticas
  const activePages = pages.filter(p => p.is_active).length;
  const expiredPages = pages.filter(p => 
    p.end_date && new Date(p.end_date) < new Date()
  ).length;

  return (
    <div>
      {/* 📊 ESTATÍSTICAS */}
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
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total de Páginas</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
            {pages.length}
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Ativas</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {activePages}
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Expiradas</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {expiredPages}
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>URL Base</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#8b5cf6' }}>
            /promocao/[slug]
          </div>
        </div>
      </div>

      {/* 📋 LISTA DE PÁGINAS */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
            Páginas Promocionais ({pages.length})
          </h2>
          <button 
            onClick={() => setShowCreateModal(true)}
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
            ➕ Nova Página
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Carregando páginas...</p>
          </div>
        ) : pages.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Nenhuma página encontrada
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              Crie sua primeira página promocional clicando em "Nova Página"
            </p>
          </div>
        ) : (
          <div style={{ padding: '0' }}>
            {pages.map((page, index) => {
              const isExpired = page.end_date && new Date(page.end_date) < new Date();
              const hasFilters = Object.keys(page.filters || {}).length > 0;
              const hasProducts = page.product_ids && page.product_ids.length > 0;
              
              return (
                <div 
                  key={page.id}
                  style={{ 
                    padding: '20px',
                    borderBottom: index < pages.length - 1 ? '1px solid #f3f4f6' : 'none',
                    background: !page.is_active ? '#f9fafb' : isExpired ? '#fef2f2' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ 
                          fontSize: '16px', 
                          fontWeight: '600',
                          color: !page.is_active ? '#9ca3af' : '#1f2937'
                        }}>
                          {page.title}
                          {!page.is_active && (
                            <span style={{
                              background: '#9ca3af',
                              color: 'white',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              marginLeft: '8px'
                            }}>
                              Inativa
                            </span>
                          )}
                          {isExpired && (
                            <span style={{
                              background: '#ef4444',
                              color: 'white',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              marginLeft: '8px'
                            }}>
                              Expirada
                            </span>
                          )}
                        </h3>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                          {page.description || 'Sem descrição'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          URL: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                            /promocao/{page.slug}
                          </code>
                        </div>
                      </div>
                      
                      {/* TAGS */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {hasFilters && (
                          <span style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            🎯 Filtros: {Object.keys(page.filters || {}).length}
                          </span>
                        )}
                        
                        {hasProducts && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            📦 Produtos: {page.product_ids.length}
                          </span>
                        )}
                        
                        {page.theme_id && (
                          <span style={{
                            background: '#f3e8ff',
                            color: '#7c3aed',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            🎨 Tema Especial
                          </span>
                        )}
                        
                        {page.start_date && (
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            🗓️ {new Date(page.start_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* BOTÕES DE AÇÃO */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Link
                        href={`/admin/promocao/edit/${page.id}`}
                        style={{
                          background: '#f8fafc',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ✏️ Editar
                      </Link>
                      
                      <button
                        onClick={() => togglePageStatus(page)}
                        style={{
                          background: page.is_active ? '#fef2f2' : '#dcfce7',
                          color: page.is_active ? '#dc2626' : '#166534',
                          border: `1px solid ${page.is_active ? '#fecaca' : '#bbf7d0'}`,
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {page.is_active ? '⏸️ Desativar' : '▶️ Ativar'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setPageToDelete(page);
                          setShowDeleteModal(true);
                        }}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        🗑️ Excluir
                      </button>
                      
                      <a
                        href={`/promocao/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#e0e7ff',
                          color: '#3730a3',
                          border: '1px solid #c7d2fe',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        👁️ Ver Página
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ℹ️ INFORMAÇÕES */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>💡 Como funciona</h3>
        <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
          <p><strong>🎯 Páginas Promocionais:</strong> Crie páginas específicas para campanhas, promoções ou coleções especiais.</p>
          <p><strong>🔗 URL Amigável:</strong> Cada página tem uma URL única: <code>/promocao/[nome-da-pagina]</code></p>
          <p><strong>🎨 Temas Personalizados:</strong> Cada página pode ter um tema visual diferente.</p>
          <p><strong>🎯 Filtros Inteligentes:</strong> Defina filtros para mostrar produtos automaticamente.</p>
          <p><strong>📦 Produtos Específicos:</strong> Selecione produtos específicos manualmente.</p>
          <p><strong>🗓️ Datas de Validade:</strong> Defina período de exibição (opcional).</p>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO - CORRIGIDO! */}
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
            maxWidth: '500px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              ➕ Criar Nova Página
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
                  Título da Página *
                </label>
                <input
                  type="text"
                  value={newPage.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    // 🔥 CORREÇÃO: SEMPRE gerar novo slug quando o título mudar
                    setNewPage(prev => ({
                      ...prev,
                      title,
                      slug: generateSlug(title) // <-- SEMPRE gera slug novo!
                    }));
                  }}
                  placeholder="Ex: Promoção de Natal Pokémon 2025"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Slug (URL) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>/promocao/</span>
                  <input
                    type="text"
                    value={newPage.slug}
                    onChange={(e) => setNewPage(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="promocao-natal-2025"
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Gerado automaticamente a partir do título. Você pode editar manualmente se preferir.
                </p>
                {newPage.slug && newPage.slug.length < 3 && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                    ⚠️ Slug muito curto! Use um título mais descritivo.
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Descrição (opcional)
                </label>
                <textarea
                  value={newPage.description}
                  onChange={(e) => setNewPage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva esta promoção..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={newPage.is_active}
                    onChange={(e) => setNewPage(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Ativar página imediatamente</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCreatePage}
                disabled={!newPage.title.trim()}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: !newPage.title.trim() ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: !newPage.title.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                ✅ Criar e Configurar
              </button>
              
              <button
                onClick={() => setShowCreateModal(false)}
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

      {/* MODAL DE EXCLUSÃO */}
      {showDeleteModal && pageToDelete && (
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
              🗑️ Excluir Página
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
                  Tem certeza que deseja excluir esta página?
                </p>
                <p style={{ fontSize: '14px', color: '#ef4444', textAlign: 'center' }}>
                  Esta ação não pode ser desfeita! A página será removida permanentemente.
                </p>
              </div>

              <div style={{ 
                padding: '12px', 
                background: '#f8fafc', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {pageToDelete.title}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  URL: /promocao/{pageToDelete.slug}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Criada em: {new Date(pageToDelete.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDeletePage}
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setPageToDelete(null);
                }}
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
    </div>
  );
}