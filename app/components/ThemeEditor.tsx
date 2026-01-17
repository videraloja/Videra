// app/components/ThemeEditor.tsx - VERSÃO CORRIGIDA
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useThemeEditor } from '../contexts/ThemeEditorContext';
import { useTheme } from '../contexts/ThemeContext';
import { ProductCardPreview } from './ProductCardPreview';
import { ComponentStyles, ProductCardStyles } from '../types';

export function ThemeEditor() {
  const { editorState, setDraftTheme, updateDraftProperty, saveDraft } = useThemeEditor();
  const { currentThemeConfig, allThemes, updateThemeConfig } = useTheme();
  
  const [selectedTheme, setSelectedTheme] = useState(currentThemeConfig?.id || 'default');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    card: true,
    typography: true,
    prices: true,
    badges: true,
    buttons: true
  });
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('🔍 ThemeEditor - Estado:', {
    hasDraftTheme: !!editorState.draftTheme,
    draftThemeId: editorState.draftTheme?.id,
    selectedTheme,
    allThemesCount: allThemes.length,
    draftThemeHasStyles: !!editorState.draftTheme?.componentStyles?.productCard
  });

  // 🆕 CORREÇÃO: CARREGAR TEMA INICIAL APENAS UMA VEZ
  useEffect(() => {
    if (allThemes.length > 0 && !editorState.draftTheme && !isInitialized) {
      const themeToLoad = allThemes.find(t => t.id === selectedTheme) || allThemes[0];
      if (themeToLoad) {
        console.log('🎯 Carregando tema inicial:', themeToLoad.name);
        
        // 🆕 CORREÇÃO CRÍTICA: Garantir que o tema tenha componentStyles
        const themeWithStyles = {
          ...themeToLoad,
          componentStyles: themeToLoad.componentStyles || {
            productCard: getDefaultCardStyles()
          }
        };
        
        setDraftTheme(themeWithStyles);
        setIsInitialized(true);
      }
    }
  }, [allThemes, editorState.draftTheme, selectedTheme, setDraftTheme, isInitialized]);

  // 🆕 CORREÇÃO: ATUALIZAR TEMA QUANDO SELECIONADO
  const handleThemeChange = useCallback((themeId: string) => {
    setSelectedTheme(themeId);
    const theme = allThemes.find(t => t.id === themeId);
    if (theme && editorState.draftTheme?.id !== theme.id) {
      console.log('🔄 Mudando para tema:', theme.name);
      
      // 🆕 CORREÇÃO: Garantir que o novo tema tenha estilos
      const themeWithStyles = {
        ...theme,
        componentStyles: theme.componentStyles || {
          productCard: getDefaultCardStyles()
        }
      };
      
      setDraftTheme(themeWithStyles);
    }
  }, [allThemes, setDraftTheme, editorState.draftTheme?.id]);

  // 🆕 FUNÇÃO PARA OBTER ESTILOS PADRÃO DO CARD
  const getDefaultCardStyles = (): ProductCardStyles => {
    return {
      productName: { 
        color: '#1f2937', 
        fontSize: '16px', 
        fontWeight: '600',
        fontFamily: 'inherit',
        textAlign: 'left' as const,
        textTransform: 'none' as const
      },
      price: { 
        color: '#059669', 
        fontSize: '18px', 
        fontWeight: '700',
        fontFamily: 'inherit',
        textAlign: 'left' as const,
        textTransform: 'none' as const
      },
      originalPrice: { 
        color: '#6b7280', 
        fontSize: '16px', 
        fontWeight: '500',
        fontFamily: 'inherit',
        textAlign: 'left' as const,
        textTransform: 'none' as const,
        strikethrough: true 
      },
      salePrice: { 
        color: '#dc2626', 
        fontSize: '20px', 
        fontWeight: '700',
        fontFamily: 'inherit',
        textAlign: 'left' as const,
        textTransform: 'none' as const
      },
      stockInfo: { 
        color: '#6b7280', 
        fontSize: '14px', 
        fontWeight: '500',
        fontFamily: 'inherit',
        textAlign: 'left' as const,
        textTransform: 'none' as const
      },
      collectionName: { 
        color: '#7c3aed', 
        fontSize: '12px', 
        fontWeight: '600',
        fontFamily: 'inherit',
        textAlign: 'left' as const,
        textTransform: 'none' as const
      },
      description: { 
        color: '#6b7280', 
        fontSize: '14px', 
        fontWeight: '400',
        fontFamily: 'inherit',
        textAlign: 'left' as const,
        textTransform: 'none' as const
      },
      badgeDiscount: {
        backgroundColor: '#dc2626',
        textColor: '#ffffff',
        position: 'right' as const,
        fontSize: '12px',
        fontWeight: '700',
        borderRadius: '12px',
        padding: '4px 8px'
      },
      badgeType: {
        backgroundColor: '#7c3aed', 
        textColor: '#ffffff',
        position: 'left' as const,
        fontSize: '12px',
        fontWeight: '700',
        borderRadius: '12px',
        padding: '4px 8px'
      },
      badgeUrgent: {
        backgroundColor: '#dc2626',
        textColor: '#ffffff', 
        position: 'bottom-left' as const,
        fontSize: '12px',
        fontWeight: '700',
        borderRadius: '12px',
        padding: '4px 8px'
      },
      addToCart: {
        backgroundColor: '#7c3aed',
        textColor: '#ffffff',
        hoverBackgroundColor: '#6d28d9',
        disabledBackgroundColor: '#9ca3af',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '600'
      },
      cardBackground: '#ffffff',
      borderColor: '#e5e7eb',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      hoverShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      cornerRadius: '12px',
      imageOverlay: 'rgba(0, 0, 0, 0)',
      padding: '16px'
    };
  };

  // 🆕 FUNÇÃO PARA ATUALIZAR ESTILOS DE COMPONENTES
  const updateComponentStyle = useCallback((component: keyof ComponentStyles, property: string, value: any) => {
    const path = `componentStyles.${component}.${property}`;
    console.log('📝 Atualizando estilo:', { path, value });
    updateDraftProperty(path, value);
  }, [updateDraftProperty]);

  // 🆕 FUNÇÃO PARA VALIDAR COR HEX
  const isValidHex = (color: string): boolean => {
    if (!color) return true; // Permitir vazio durante digitação
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  // 🆕 FUNÇÃO PARA ATUALIZAR COR
  const updateColor = useCallback((component: keyof ComponentStyles, property: string, value: string) => {
    console.log('🎨 Atualizando cor:', { component, property, value });
    
    // Permitir string vazia durante digitação, mas validar no blur
    if (value === '' || value === '#' || isValidHex(value)) {
      updateComponentStyle(component, property, value);
    }
  }, [updateComponentStyle]);

  // 🆕 TOGGLE SEÇÃO EXPANDIDA
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // 🆕 FUNÇÃO PARA SALVAR
  const handleSave = useCallback(() => {
    if (!editorState.draftTheme) return;

    console.log('💾 Salvando tema:', editorState.draftTheme.name);
    
    // 🆕 CORREÇÃO: Garantir que o tema salvo tenha componentStyles
    const themeToSave = {
      ...editorState.draftTheme,
      componentStyles: editorState.draftTheme.componentStyles || {
        productCard: getDefaultCardStyles()
      }
    };
    
    updateThemeConfig(themeToSave.id, themeToSave);
    saveDraft();
    alert(`💾 Tema "${editorState.draftTheme.name}" salvo com sucesso!`);
  }, [editorState.draftTheme, updateThemeConfig, saveDraft]);

  // 🆕 MOSTRAR LOADING APENAS SE NÃO HOUVER TEMAS
  if (allThemes.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>🎨</div>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Carregando temas...</p>
      </div>
    );
  }

  // 🆕 OBTER CARD STYLES COM FALLBACK SEGURO
  const cardStyles = editorState.draftTheme?.componentStyles?.productCard || getDefaultCardStyles();

  console.log('🎴 CardStyles disponíveis:', !!cardStyles, cardStyles);

  // 🆕 OPÇÕES PARA SELECTS
  const fontWeightOptions = [
    { value: '400', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' }
  ];

  const fontSizeOptions = [
    { value: '10px', label: 'Muito Pequeno (10px)' },
    { value: '12px', label: 'Pequeno (12px)' },
    { value: '14px', label: 'Normal (14px)' },
    { value: '16px', label: 'Médio (16px)' },
    { value: '18px', label: 'Grande (18px)' },
    { value: '20px', label: 'Extra Grande (20px)' },
    { value: '24px', label: 'Título (24px)' }
  ];

  const borderRadiusOptions = [
    { value: '0px', label: 'Quadrado (0px)' },
    { value: '4px', label: 'Suave (4px)' },
    { value: '8px', label: 'Arredondado (8px)' },
    { value: '12px', label: 'Muito Arredondado (12px)' },
    { value: '16px', label: 'Extra Arredondado (16px)' },
    { value: '20px', label: 'Pílula (20px)' },
    { value: '24px', label: 'Círculo (24px)' }
  ];

  const paddingOptions = [
    { value: '8px', label: 'Compacto (8px)' },
    { value: '12px', label: 'Confortável (12px)' },
    { value: '16px', label: 'Espaçoso (16px)' },
    { value: '20px', label: 'Muito Espaçoso (20px)' },
    { value: '24px', label: 'Extra Espaçoso (24px)' }
  ];

  // 🆕 COMPONENTE REUTILIZÁVEL PARA CONTROLE DE COR
  const ColorControl = React.memo(({ 
    label, 
    value, 
    property 
  }: { 
    label: string; 
    value: string; 
    property: string;
  }) => {
    const handleColorChange = (newValue: string) => {
      updateColor('productCard', property, newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      handleColorChange(newValue);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // Se não começar com #, adicionar
      if (newValue && !newValue.startsWith('#') && newValue.length > 0) {
        handleColorChange('#' + newValue);
      }
    };

    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>
          {label}:
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            style={{ 
              width: '50px', 
              height: '36px', 
              borderRadius: '6px', 
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              flexShrink: 0
            }}
          />
          <input
            type="text"
            value={value || ''}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="#000000"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: `1px solid ${isValidHex(value) ? '#d1d5db' : '#ef4444'}`,
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'monospace',
              backgroundColor: isValidHex(value) ? 'white' : '#fef2f2'
            }}
          />
        </div>
        {!isValidHex(value) && value && (
          <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
            Formato HEX inválido. Use #RRGGBB ou #RGB
          </p>
        )}
      </div>
    );
  });

  ColorControl.displayName = 'ColorControl';

  // 🆕 COMPONENTE REUTILIZÁVEL PARA SELECT
  const SelectControl = React.memo(({ 
    label, 
    value, 
    onChange,
    options 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>
        {label}:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '13px',
          backgroundColor: 'white'
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ));

  SelectControl.displayName = 'SelectControl';

  // 🆕 SEÇÃO EXPANDÍVEL
  const ExpandableSection = React.memo(({ 
    title, 
    icon, 
    children, 
    sectionKey 
  }: { 
    title: string; 
    icon: string;
    children: React.ReactNode;
    sectionKey: string;
  }) => (
    <div style={{ 
      marginBottom: '16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: '#f8fafc',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}
      >
        <span>
          {icon} {title}
        </span>
        <span style={{ transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>
      {expandedSections[sectionKey] && (
        <div style={{ padding: '16px', background: 'white' }}>
          {children}
        </div>
      )}
    </div>
  ));

  ExpandableSection.displayName = 'ExpandableSection';

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '380px 1fr',
      gap: '24px',
      padding: '24px',
      minHeight: '600px',
      backgroundColor: '#f8fafc'
    }}>
      {/* 🎨 PAINEL DE CONTROLES */}
      <div style={{ 
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        height: 'fit-content',
        overflowY: 'auto',
        maxHeight: '800px'
      }}>
        <h3 style={{ 
          marginBottom: '20px', 
          color: '#1e293b',
          fontSize: '20px',
          fontWeight: '700'
        }}>
          🎴 Editor de Cards
        </h3>
        
        {/* SELETOR DE TEMA */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '600', 
            fontSize: '14px',
            color: '#374151'
          }}>
            Tema para Editar:
          </label>
          <select 
            value={selectedTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: '#f9fafb'
            }}
          >
            {allThemes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
          <p style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            marginTop: '6px'
          }}>
            Editando: {editorState.draftTheme?.name || 'Nenhum tema selecionado'}
          </p>
        </div>

        {/* CONTEÚDO */}
        <div>
          <ExpandableSection title="Configurações do Card" icon="🎭" sectionKey="card">
            <ColorControl
              label="Fundo do Card"
              value={cardStyles.cardBackground}
              property="cardBackground"
            />
            
            <ColorControl
              label="Cor da Borda"
              value={cardStyles.borderColor}
              property="borderColor"
            />

            <ColorControl
              label="Cor do Fundo da Imagem"
              value={cardStyles.imageOverlay}
              property="imageOverlay"
            />

            <SelectControl
              label="Border Radius"
              value={cardStyles.cornerRadius}
              onChange={(value) => updateComponentStyle('productCard', 'cornerRadius', value)}
              options={borderRadiusOptions}
            />

            <SelectControl
              label="Espaçamento Interno"
              value={cardStyles.padding || '16px'}
              onChange={(value) => updateComponentStyle('productCard', 'padding', value)}
              options={paddingOptions}
            />
          </ExpandableSection>

          <ExpandableSection title="Tipografia" icon="📝" sectionKey="typography">
            <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Nome do Produto</h5>
            <ColorControl
              label="Cor do Texto"
              value={cardStyles.productName.color}
              property="productName.color"
            />
            <SelectControl
              label="Tamanho da Fonte"
              value={cardStyles.productName.fontSize}
              onChange={(value) => updateComponentStyle('productCard', 'productName.fontSize', value)}
              options={fontSizeOptions}
            />
            <SelectControl
              label="Peso da Fonte"
              value={cardStyles.productName.fontWeight}
              onChange={(value) => updateComponentStyle('productCard', 'productName.fontWeight', value)}
              options={fontWeightOptions}
            />

            <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: '600', marginTop: '16px' }}>Nome da Coleção</h5>
            <ColorControl
              label="Cor do Texto"
              value={cardStyles.collectionName.color}
              property="collectionName.color"
            />
            <SelectControl
              label="Tamanho da Fonte"
              value={cardStyles.collectionName.fontSize}
              onChange={(value) => updateComponentStyle('productCard', 'collectionName.fontSize', value)}
              options={fontSizeOptions}
            />

            <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: '600', marginTop: '16px' }}>Informação de Estoque</h5>
            <ColorControl
              label="Cor do Texto"
              value={cardStyles.stockInfo.color}
              property="stockInfo.color"
            />
            <SelectControl
              label="Tamanho da Fonte"
              value={cardStyles.stockInfo.fontSize}
              onChange={(value) => updateComponentStyle('productCard', 'stockInfo.fontSize', value)}
              options={fontSizeOptions}
            />
          </ExpandableSection>

          <ExpandableSection title="Preços" icon="💰" sectionKey="prices">
            <ColorControl
              label="Cor do Preço Normal"
              value={cardStyles.price.color}
              property="price.color"
            />
            <SelectControl
              label="Tamanho da Fonte"
              value={cardStyles.price.fontSize}
              onChange={(value) => updateComponentStyle('productCard', 'price.fontSize', value)}
              options={fontSizeOptions}
            />

            <ColorControl
              label="Cor do Preço Original"
              value={cardStyles.originalPrice.color}
              property="originalPrice.color"
            />

            <ColorControl
              label="Cor do Preço Promocional"
              value={cardStyles.salePrice.color}
              property="salePrice.color"
            />
            <SelectControl
              label="Tamanho da Fonte"
              value={cardStyles.salePrice.fontSize}
              onChange={(value) => updateComponentStyle('productCard', 'salePrice.fontSize', value)}
              options={fontSizeOptions}
            />
          </ExpandableSection>

          <ExpandableSection title="Badges" icon="🔴" sectionKey="badges">
            <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: '600' }}>Badge de Desconto</h5>
            <ColorControl
              label="Cor de Fundo"
              value={cardStyles.badgeDiscount.backgroundColor}
              property="badgeDiscount.backgroundColor"
            />
            <ColorControl
              label="Cor do Texto"
              value={cardStyles.badgeDiscount.textColor}
              property="badgeDiscount.textColor"
            />

            <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: '600', marginTop: '16px' }}>Badge de Tipo</h5>
            <ColorControl
              label="Cor de Fundo"
              value={cardStyles.badgeType.backgroundColor}
              property="badgeType.backgroundColor"
            />
            <ColorControl
              label="Cor do Texto"
              value={cardStyles.badgeType.textColor}
              property="badgeType.textColor"
            />

            <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: '600', marginTop: '16px' }}>Badge Urgente</h5>
            <ColorControl
              label="Cor de Fundo"
              value={cardStyles.badgeUrgent.backgroundColor}
              property="badgeUrgent.backgroundColor"
            />
            <ColorControl
              label="Cor do Texto"
              value={cardStyles.badgeUrgent.textColor}
              property="badgeUrgent.textColor"
            />
          </ExpandableSection>

          <ExpandableSection title="Botões" icon="🛒" sectionKey="buttons">
            <ColorControl
              label="Cor do Botão"
              value={cardStyles.addToCart.backgroundColor}
              property="addToCart.backgroundColor"
            />

            <ColorControl
              label="Cor do Texto"
              value={cardStyles.addToCart.textColor}
              property="addToCart.textColor"
            />

            <ColorControl
              label="Cor do Hover"
              value={cardStyles.addToCart.hoverBackgroundColor}
              property="addToCart.hoverBackgroundColor"
            />

            <ColorControl
              label="Cor do Botão Desativado"
              value={cardStyles.addToCart.disabledBackgroundColor}
              property="addToCart.disabledBackgroundColor"
            />

            <SelectControl
              label="Border Radius"
              value={cardStyles.addToCart.borderRadius}
              onChange={(value) => updateComponentStyle('productCard', 'addToCart.borderRadius', value)}
              options={borderRadiusOptions}
            />
          </ExpandableSection>

          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              marginTop: '16px'
            }}
          >
            💾 Salvar Alterações
          </button>
        </div>
      </div>

      {/* PREVIEW */}
      <div style={{ 
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        height: 'fit-content'
      }}>
        <h4 style={{ 
          marginBottom: '20px', 
          color: '#1e293b',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Preview do Card
        </h4>
        <ProductCardPreview cardStyles={cardStyles} />
        <p style={{ 
          marginTop: '16px', 
          fontSize: '12px', 
          color: '#64748b',
          textAlign: 'center'
        }}>
          As alterações são refletidas em tempo real
        </p>
      </div>
    </div>
  );
}