// app/components/ProductDetailStyleEditor.tsx
// Editor granular dos estilos da PÁGINA DE PRODUTO (/produto/[slug]), em paralelo
// ao Editor Granular (Cards) que já existe pro card pequeno da vitrine. Mesmo
// padrão: edita um draftTheme via ThemeEditorContext, salva com saveDraft().
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useThemeEditor } from '../contexts/ThemeEditorContext';
import { useTheme } from '../contexts/ThemeContext';
import { ProductDetailStyles } from '../types';

const fontWeightOptions = [
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' }
];

function getDefaultDetailStyles(): ProductDetailStyles {
  return {
    productName: { color: '#1f2937', fontSize: '32px', fontWeight: '700' },
    price: { color: '#059669', fontSize: '32px', fontWeight: '700' },
    originalPrice: { color: '#6b7280', fontSize: '18px', fontWeight: '500', strikethrough: true },
    salePrice: { color: '#dc2626', fontSize: '32px', fontWeight: '700' },
    stockInfo: { color: '#6b7280', fontSize: '15px', fontWeight: '500' },
    description: { color: '#6b7280', fontSize: '15px', fontWeight: '400' },
    collectionName: { color: '#7c3aed', fontSize: '13px', fontWeight: '600' },
    brandBadge: { backgroundColor: '#ede9fe', textColor: '#5b21b6', position: 'left', fontSize: '13px', fontWeight: '700', borderRadius: '8px', padding: '6px 12px' },
    preorderBadge: { backgroundColor: '#f3e8ff', textColor: '#7c3aed', borderColor: '#e9d5ff' },
    addToCart: { backgroundColor: '#7c3aed', textColor: '#ffffff', hoverBackgroundColor: '#6d28d9', disabledBackgroundColor: '#9ca3af' },
    backButton: { backgroundColor: '#ffffff', textColor: '#1f2937', size: '40px' },
    galleryThumbnailBorderColor: '#e5e7eb',
    galleryThumbnailActiveBorderColor: '#7c3aed'
  };
}

export function ProductDetailStyleEditor() {
  const { editorState, setDraftTheme, updateDraftProperty } = useThemeEditor();
  const { currentThemeConfig, allThemes, updateThemeConfig } = useTheme();

  const [selectedTheme, setSelectedTheme] = useState(currentThemeConfig?.id || 'default');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    typography: true,
    brand: true,
    preorder: true,
    button: true,
    back: true,
    gallery: true
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (allThemes.length > 0 && !editorState.draftTheme && !isInitialized) {
      const themeToLoad = allThemes.find(t => t.id === selectedTheme) || allThemes[0];
      if (themeToLoad) {
        setDraftTheme({
          ...themeToLoad,
          componentStyles: {
            ...(themeToLoad.componentStyles || {}),
            productDetail: themeToLoad.componentStyles?.productDetail || getDefaultDetailStyles()
          }
        });
        setIsInitialized(true);
      }
    }
  }, [allThemes, editorState.draftTheme, selectedTheme, setDraftTheme, isInitialized]);

  const handleThemeChange = useCallback((themeId: string) => {
    setSelectedTheme(themeId);
    const theme = allThemes.find(t => t.id === themeId);
    if (theme && editorState.draftTheme?.id !== theme.id) {
      setDraftTheme({
        ...theme,
        componentStyles: {
          ...(theme.componentStyles || {}),
          productDetail: theme.componentStyles?.productDetail || getDefaultDetailStyles()
        }
      });
    }
  }, [allThemes, setDraftTheme, editorState.draftTheme?.id]);

  const updateStyle = useCallback((property: string, value: any) => {
    updateDraftProperty(`componentStyles.productDetail.${property}`, value);
  }, [updateDraftProperty]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleSave = useCallback(() => {
    if (!editorState.draftTheme) return;
    updateThemeConfig(editorState.draftTheme.id, editorState.draftTheme);
    alert(`💾 Estilos da página de produto salvos no tema "${editorState.draftTheme.name}"!`);
  }, [editorState.draftTheme, updateThemeConfig]);

  if (allThemes.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Carregando temas...</p>
      </div>
    );
  }

  const styles: ProductDetailStyles = editorState.draftTheme?.componentStyles?.productDetail || getDefaultDetailStyles();

  const ColorControl = ({ label, value, property }: { label: string; value: string; property: string }) => (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>{label}:</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => updateStyle(property, e.target.value)}
          style={{ width: '50px', height: '36px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', flexShrink: 0 }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updateStyle(property, e.target.value)}
          placeholder="#000000"
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}
        />
      </div>
    </div>
  );

  const SelectControl = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>{label}:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', backgroundColor: 'white' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const FontSizeControl = ({ label, value, property }: { label: string; value: string; property: string }) => {
    const numeric = parseInt(value, 10) || 16;
    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>{label}: {numeric}px</label>
        <input
          type="range"
          min={10}
          max={48}
          value={numeric}
          onChange={(e) => updateStyle(property, `${e.target.value}px`)}
          style={{ width: '100%' }}
        />
      </div>
    );
  };

  const ExpandableSection = ({ title, icon, children, sectionKey }: { title: string; icon: string; children: React.ReactNode; sectionKey: string }) => (
    <div style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => toggleSection(sectionKey)}
        style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#374151' }}
      >
        <span>{icon} {title}</span>
        <span style={{ transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {expandedSections[sectionKey] && <div style={{ padding: '16px', background: 'white' }}>{children}</div>}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', padding: '24px', minHeight: '600px', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', height: 'fit-content', overflowY: 'auto', maxHeight: '800px' }}>
        <h3 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '20px', fontWeight: 700 }}>🖼️ Editor da Página de Produto</h3>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Tema para Editar:</label>
          <select
            value={selectedTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb' }}
          >
            {allThemes.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
          </select>
        </div>

        <ExpandableSection title="Título e Preço" icon="📝" sectionKey="typography">
          <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: 600 }}>Nome do Produto</h5>
          <ColorControl label="Cor" value={styles.productName.color} property="productName.color" />
          <FontSizeControl label="Tamanho" value={styles.productName.fontSize || '32px'} property="productName.fontSize" />

          <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: 600, marginTop: '16px' }}>Preço</h5>
          <ColorControl label="Cor (preço normal)" value={styles.price.color} property="price.color" />
          <ColorControl label="Cor (preço promocional)" value={styles.salePrice.color} property="salePrice.color" />
          <ColorControl label="Cor (preço riscado)" value={styles.originalPrice.color} property="originalPrice.color" />
          <FontSizeControl label="Tamanho" value={styles.price.fontSize || '32px'} property="price.fontSize" />

          <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: 600, marginTop: '16px' }}>Coleção e Descrição</h5>
          <ColorControl label="Cor da Coleção" value={styles.collectionName.color} property="collectionName.color" />
          <ColorControl label="Cor da Descrição" value={styles.description.color} property="description.color" />
          <ColorControl label="Cor do Estoque" value={styles.stockInfo.color} property="stockInfo.color" />
        </ExpandableSection>

        <ExpandableSection title="Marca" icon="🏷️" sectionKey="brand">
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Selo de marca/fabricante — mostrado só quando o produto tem marca conhecida.</p>
          <ColorControl label="Fundo" value={styles.brandBadge.backgroundColor} property="brandBadge.backgroundColor" />
          <ColorControl label="Texto" value={styles.brandBadge.textColor} property="brandBadge.textColor" />
        </ExpandableSection>

        <ExpandableSection title="Tarja de Pré-venda" icon="📦" sectionKey="preorder">
          <ColorControl label="Fundo" value={styles.preorderBadge.backgroundColor} property="preorderBadge.backgroundColor" />
          <ColorControl label="Texto" value={styles.preorderBadge.textColor} property="preorderBadge.textColor" />
          <ColorControl label="Borda" value={styles.preorderBadge.borderColor} property="preorderBadge.borderColor" />
        </ExpandableSection>

        <ExpandableSection title="Botão Adicionar ao Carrinho" icon="🛒" sectionKey="button">
          <ColorControl label="Fundo" value={styles.addToCart.backgroundColor} property="addToCart.backgroundColor" />
          <ColorControl label="Texto" value={styles.addToCart.textColor} property="addToCart.textColor" />
          <ColorControl label="Fundo (hover)" value={styles.addToCart.hoverBackgroundColor} property="addToCart.hoverBackgroundColor" />
          <ColorControl label="Fundo (desabilitado)" value={styles.addToCart.disabledBackgroundColor} property="addToCart.disabledBackgroundColor" />
        </ExpandableSection>

        <ExpandableSection title="Botão Voltar" icon="⬅️" sectionKey="back">
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Leva sempre para a categoria do produto (ou início, se não tiver categoria).</p>
          <ColorControl label="Fundo" value={styles.backButton.backgroundColor} property="backButton.backgroundColor" />
          <ColorControl label="Ícone" value={styles.backButton.textColor} property="backButton.textColor" />
          <SelectControl
            label="Tamanho"
            value={styles.backButton.size}
            onChange={(v) => updateStyle('backButton.size', v)}
            options={[{ value: '32px', label: 'Pequeno (32px)' }, { value: '40px', label: 'Médio (40px)' }, { value: '48px', label: 'Grande (48px)' }]}
          />
        </ExpandableSection>

        <ExpandableSection title="Galeria de Imagens" icon="🖼️" sectionKey="gallery">
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Miniaturas extras abaixo da foto principal (só aparecem em produtos com mais de uma imagem).</p>
          <ColorControl label="Borda da miniatura" value={styles.galleryThumbnailBorderColor} property="galleryThumbnailBorderColor" />
          <ColorControl label="Borda da miniatura selecionada" value={styles.galleryThumbnailActiveBorderColor} property="galleryThumbnailActiveBorderColor" />
        </ExpandableSection>

        <button
          onClick={handleSave}
          style={{ width: '100%', padding: '14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
        >
          💾 Salvar Estilos da Página de Produto
        </button>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>Pré-visualização simplificada — abra a página de um produto real pra ver o resultado completo.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: styles.backButton.size, height: styles.backButton.size, borderRadius: '50%', background: styles.backButton.backgroundColor, color: styles.backButton.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>←</div>
          <span style={{ backgroundColor: styles.brandBadge.backgroundColor, color: styles.brandBadge.textColor, padding: '6px 12px', borderRadius: '8px', fontSize: styles.brandBadge.fontSize, fontWeight: styles.brandBadge.fontWeight as any }}>Marca Exemplo</span>
        </div>
        <h1 style={{ color: styles.productName.color, fontSize: styles.productName.fontSize, fontWeight: styles.productName.fontWeight as any, marginBottom: '12px' }}>Produto de Exemplo</h1>
        <div style={{ color: styles.price.color, fontSize: styles.price.fontSize, fontWeight: styles.price.fontWeight as any, marginBottom: '16px' }}>R$ 99,90</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: styles.preorderBadge.backgroundColor, color: styles.preorderBadge.textColor, border: `1px solid ${styles.preorderBadge.borderColor}`, padding: '10px 16px', borderRadius: '10px', marginBottom: '16px' }}>
          📦 Pré-venda
        </div>
        <p style={{ color: styles.description.color, fontSize: styles.description.fontSize, marginBottom: '20px' }}>Texto de descrição de exemplo do produto.</p>
        <button style={{ background: styles.addToCart.backgroundColor, color: styles.addToCart.textColor, border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Adicionar ao Carrinho</button>
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#f3f4f6', border: `2px solid ${i === 0 ? styles.galleryThumbnailActiveBorderColor : styles.galleryThumbnailBorderColor}` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailStyleEditor;
