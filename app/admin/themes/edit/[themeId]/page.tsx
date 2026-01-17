'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useThemeEditor } from '../../../../contexts/ThemeEditorContext';
import ColorPicker from '../../../../components/ColorPicker';
import EmojiSelector from '../../../../components/EmojiSelector';

export default function EditThemePage() {
  const params = useParams();
  const router = useRouter();
  const themeId = params.themeId as string;
  
  const { allThemes, activateSeasonalTheme, currentThemeConfig, refreshThemes } = useTheme();
  const { editorState, setDraftTheme, updateDraftProperty, setActiveTab, saveDraft, resetDraft } = useThemeEditor();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false); // 🆕 CONTROLE DE TENTATIVAS

  // 🔧 CORREÇÃO COMPLETA: useEffect sem loop
  useEffect(() => {
    // 🆕 Só executar uma vez quando o themeId mudar OU quando allThemes for carregado
    if (hasAttemptedLoad) return;

    const loadThemeForEditing = async () => {
      try {
        console.log('🔍 Iniciando carregamento do tema:', themeId);
        
        let themeToEdit = allThemes.find(theme => theme.id === themeId);
        
        // 🆕 Se não encontrou nos temas carregados, tentar recarregar uma vez
        if (!themeToEdit && allThemes.length > 0) {
          console.log('🔄 Tema não encontrado no context, tentando localStorage...');
          const savedThemes = localStorage.getItem('videra-themes');
          if (savedThemes) {
            const parsedThemes = JSON.parse(savedThemes);
            themeToEdit = parsedThemes.find((theme: any) => theme.id === themeId);
          }
        }

        if (themeToEdit) {
          console.log('✅ Tema encontrado:', themeToEdit.name);
          setDraftTheme(JSON.parse(JSON.stringify(themeToEdit)));
          setError(null);
        } else {
          console.error('❌ Tema não encontrado após todas as tentativas:', themeId);
          setError(`Tema "${themeId}" não foi encontrado. Ele pode ter sido excluído.`);
        }
      } catch (err) {
        console.error('❌ Erro crítico ao carregar tema:', err);
        setError('Erro inesperado ao carregar o tema.');
      } finally {
        setIsLoading(false);
        setHasAttemptedLoad(true); // 🆕 MARCA QUE JÁ TENTOU CARREGAR
      }
    };

    // 🆕 Estratégia de carregamento: 
    // 1. Se allThemes já tem dados, carrega imediatamente
    // 2. Se não, espera um pouco e tenta recarregar
    if (allThemes.length > 0) {
      loadThemeForEditing();
    } else {
      console.log('⏳ Aguardando temas carregarem...');
      const timer = setTimeout(() => {
        refreshThemes();
        loadThemeForEditing();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [themeId, allThemes.length, hasAttemptedLoad]); // 🆕 DEPENDÊNCIAS CORRETAS

  // 🔧 Função para atualizar propriedades
  const handleUpdateProperty = (path: string, value: any) => {
    updateDraftProperty(path, value);
  };

  const handleSave = () => {
    if (editorState.draftTheme) {
      console.log('💾 Salvando tema:', editorState.draftTheme.name);
      saveDraft();
      // 🆕 Redirecionar após salvar com sucesso
      setTimeout(() => {
        router.push('/admin/themes');
      }, 1500);
    }
  };

  const handleActivate = () => {
    if (editorState.draftTheme) {
      console.log('🚀 Ativando tema:', editorState.draftTheme.name);
      activateSeasonalTheme(editorState.draftTheme.id);
      setTimeout(() => {
        router.push('/admin/themes');
      }, 1000);
    }
  };

  // 🆕 Função para tentar recarregar o tema
  const handleRetry = () => {
    setHasAttemptedLoad(false);
    setIsLoading(true);
    setError(null);
    refreshThemes();
  };

  // 🔧 Loading state
  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          fontSize: '48px', 
          marginBottom: '16px',
          animation: 'pulse 2s infinite' 
        }}>⏳</div>
        <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
          Carregando tema...
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
          ID: {themeId}
        </div>
      </div>
    );
  }

  // 🆕 Tratamento de erro
  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#ef4444' }}>
          Erro ao Carregar Tema
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '16px' }}>
          {error}
        </p>
        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
          ID: {themeId}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleRetry}
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
          <button 
            onClick={() => router.push('/admin/themes')}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Voltar para Lista
          </button>
          <button 
            onClick={() => router.push('/admin/themes')}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ➕ Criar Novo Tema
          </button>
        </div>
      </div>
    );
  }

  if (!editorState.draftTheme) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Tema não disponível
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '24px' }}>
          Não foi possível carregar o tema para edição.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={handleRetry}
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
          <button 
            onClick={() => router.push('/admin/themes')}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  const draft = editorState.draftTheme;
  const isActive = currentThemeConfig?.id === draft.id;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <button 
            onClick={() => router.push('/admin/themes')}
            style={{
              padding: '8px 12px',
              background: '#f8fafc',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Voltar
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>
            Editando: {draft.name}
          </h1>
          {isActive && (
            <span style={{
              background: '#10b981',
              color: 'white',
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              Ativo
            </span>
          )}
        </div>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Personalize as cores, emojis e configurações deste tema
        </p>
        <div style={{ 
          padding: '12px', 
          background: '#f8fafc', 
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
          color: '#6b7280',
          marginTop: '8px'
        }}>
          <strong>ID:</strong> {draft.id} • <strong>Tipo:</strong> {draft.id === 'default' ? 'Sistema' : 'Personalizado'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
        {/* Editor Principal */}
        <div>
          {/* Abas de Navegação */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            {(['colors', 'emojis', 'images', 'effects'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${editorState.activeTab === tab ? '#7c3aed' : 'transparent'}`,
                  color: editorState.activeTab === tab ? '#7c3aed' : '#6b7280',
                  fontWeight: editorState.activeTab === tab ? '600' : '400',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab === 'colors' && '🎨 Cores'}
                {tab === 'emojis' && '😊 Emojis'}
                {tab === 'images' && '🖼️ Imagens'}
                {tab === 'effects' && '🎪 Efeitos'}
              </button>
            ))}
          </div>

          {/* Conteúdo das Abas */}
          <div>
            {/* ABA CORES */}
            {editorState.activeTab === 'colors' && (
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Configurações de Cores</h3>
                
                <ColorPicker
                  label="Cor Primária"
                  value={draft.colors.primary}
                  onChange={(color) => handleUpdateProperty('colors.primary', color)}
                  presets={['#7c3aed', '#dc2626', '#059669', '#0369a1', '#f59e0b']}
                />
                
                <ColorPicker
                  label="Cor Secundária"
                  value={draft.colors.secondary}
                  onChange={(color) => handleUpdateProperty('colors.secondary', color)}
                />
                
                <ColorPicker
                  label="Cor de Destaque"
                  value={draft.colors.accent}
                  onChange={(color) => handleUpdateProperty('colors.accent', color)}
                />
                
                <ColorPicker
                  label="Cor de Fundo"
                  value={draft.colors.background}
                  onChange={(color) => handleUpdateProperty('colors.background', color)}
                />
                
                <ColorPicker
                  label="Cor do Texto"
                  value={draft.colors.text}
                  onChange={(color) => handleUpdateProperty('colors.text', color)}
                />
                
                <ColorPicker
                  label="Fundo do Header"
                  value={draft.colors.headerBg}
                  onChange={(color) => handleUpdateProperty('colors.headerBg', color)}
                />
                
                <ColorPicker
                  label="Fundo dos Cards"
                  value={draft.colors.cardBg}
                  onChange={(color) => handleUpdateProperty('colors.cardBg', color)}
                />
              </div>
            )}

            {/* ABA EMOJIS */}
            {editorState.activeTab === 'emojis' && (
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Emojis do Tema</h3>
                
                <EmojiSelector
                  label="Emoji do Carrinho"
                  value={draft.emojis.cart}
                  onChange={(emoji) => handleUpdateProperty('emojis.cart', emoji)}
                  category="objects"
                />
                
                <EmojiSelector
                  label="Emoji do Estoque"
                  value={draft.emojis.stock}
                  onChange={(emoji) => handleUpdateProperty('emojis.stock', emoji)}
                  category="objects"
                />
                
                <EmojiSelector
                  label="Emoji da Busca"
                  value={draft.emojis.search}
                  onChange={(emoji) => handleUpdateProperty('emojis.search', emoji)}
                  category="symbols"
                />
                
                <EmojiSelector
                  label="Emoji do Filtro"
                  value={draft.emojis.filter}
                  onChange={(emoji) => handleUpdateProperty('emojis.filter', emoji)}
                  category="symbols"
                />
                
                <EmojiSelector
                  label="Emoji da Categoria"
                  value={draft.emojis.category}
                  onChange={(emoji) => handleUpdateProperty('emojis.category', emoji)}
                  category="symbols"
                />
                
                <EmojiSelector
                  label="Emoji de Sucesso"
                  value={draft.emojis.success}
                  onChange={(emoji) => handleUpdateProperty('emojis.success', emoji)}
                  category="symbols"
                />
              </div>
            )}

            {/* ABA IMAGENS */}
            {editorState.activeTab === 'images' && (
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Imagens do Tema</h3>
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
                  <p style={{ fontSize: '16px', marginBottom: '16px' }}>Sistema de imagens em desenvolvimento</p>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>Em breve você poderá fazer upload de imagens personalizadas para cada tema</p>
                </div>
              </div>
            )}

            {/* ABA EFEITOS */}
            {editorState.activeTab === 'effects' && (
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Efeitos Especiais</h3>
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎪</div>
                  <p style={{ fontSize: '16px', marginBottom: '16px' }}>Sistema de efeitos em desenvolvimento</p>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>Em breve você poderá configurar neve, confetti e outros efeitos visuais</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Preview e Ações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Preview Rápido */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Preview Rápido</h3>
            
            <div style={{ 
              background: draft.colors.background, 
              padding: '20px', 
              borderRadius: '8px',
              border: `1px solid ${draft.colors.secondary}`
            }}>
              {/* Preview do Header */}
              <div style={{ 
                background: draft.colors.headerBg, 
                padding: '12px', 
                borderRadius: '6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>{draft.emojis.category}</span>
                <span style={{ color: draft.colors.text, fontSize: '14px', fontWeight: '500' }}>Categoria</span>
              </div>
              
              {/* Preview do Botão */}
              <button style={{
                background: draft.colors.primary,
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {draft.emojis.cart} Botão Primário
              </button>
              
              {/* Preview do Card */}
              <div style={{
                background: draft.colors.cardBg,
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${draft.colors.secondary}`,
                color: draft.colors.text
              }}>
                <div style={{ fontSize: '12px', color: draft.colors.primary, fontWeight: '500' }}>
                  {draft.emojis.success} Card de Exemplo
                </div>
                <div style={{ fontSize: '10px', color: draft.colors.text, opacity: 0.7 }}>
                  Texto do card com cores do tema
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Ações</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleSave}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                💾 Salvar Alterações
              </button>
              
              {!isActive && (
                <button
                  onClick={handleActivate}
                  style={{
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  🚀 Ativar Tema
                </button>
              )}
              
              <button
                onClick={resetDraft}
                style={{
                  background: '#f8fafc',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                🔄 Descartar Alterações
              </button>
              
              <button
                onClick={() => router.push('/admin/themes')}
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ← Voltar para Lista
              </button>
            </div>
          </div>

          {/* Informações do Tema */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Informações</h3>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>ID:</strong> {draft.id}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Tipo:</strong> {draft.id === 'default' ? 'Sistema' : 'Personalizado'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Status:</strong> {isActive ? 'Ativo' : 'Inativo'}
              </div>
              {draft.startDate && draft.endDate && (
                <>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Início:</strong> {new Date(draft.startDate).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <strong>Término:</strong> {new Date(draft.endDate).toLocaleDateString('pt-BR')}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}