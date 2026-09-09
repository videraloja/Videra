// app/components/ProductDetailStyleEditor.tsx
// Editor granular dos estilos da PÁGINA DE PRODUTO (/produto/[slug]), em paralelo
// ao Editor Granular (Cards) que já existe pro card pequeno da vitrine. Mesmo
// padrão: edita um draftTheme via ThemeEditorContext, salva com saveDraft().
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useThemeEditor } from '../contexts/ThemeEditorContext';
import { useTheme } from '../contexts/ThemeContext';
import { ProductDetailStyles } from '../types';
import { mergeDetailStyles } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabaseClient';
import { compressImage, formatFileSize } from '@/lib/imageCompression';

const fontWeightOptions = [
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' }
];

// Sempre mescla com os padrões (nunca usa um productDetail salvo cru): um tema
// salvo com o formato antigo (de antes de collectionLine/brandLine existirem)
// não pode quebrar o editor — os campos que faltam caem no padrão, e ao salvar
// de novo o tema já sai migrado pro formato atual.
function getDefaultDetailStyles(raw?: Partial<ProductDetailStyles> | null): ProductDetailStyles {
  return mergeDetailStyles(raw);
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
            productDetail: getDefaultDetailStyles(themeToLoad.componentStyles?.productDetail)
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
          productDetail: getDefaultDetailStyles(theme.componentStyles?.productDetail)
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

  // Upload de ícone — mesmo bucket (product-images) e mesma compressão
  // (lib/imageCompression.ts) já usados pra imagem de capa e galeria dos
  // produtos. Não é um sistema novo, só outra pasta dentro do mesmo bucket.
  const [uploadingIcon, setUploadingIcon] = useState<'back' | 'search' | 'share' | null>(null);
  const [iconCompressionInfo, setIconCompressionInfo] = useState<Record<string, string>>({});

  const handleIconUpload = useCallback(async (file: File, icon: 'back' | 'search' | 'share') => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingIcon(icon);
    try {
      const compressed = await compressImage(file);
      setIconCompressionInfo(prev => ({
        ...prev,
        [icon]: compressed.skipped
          ? `Imagem já era pequena (${formatFileSize(compressed.originalSize)}) — enviada sem reprocessar.`
          : `${formatFileSize(compressed.originalSize)} → ${formatFileSize(compressed.compressedSize)} (WebP)`
      }));

      const fileExt = compressed.file.name.split('.').pop();
      const fileName = `${icon}-${Date.now()}.${fileExt}`;
      const filePath = `nav-icons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressed.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      const propertyKey = icon === 'back' ? 'backIconUrl' : icon === 'search' ? 'searchIconUrl' : 'shareIconUrl';
      updateStyle(`navIcons.${propertyKey}`, urlData.publicUrl);
    } catch (err) {
      console.error('Erro no upload do ícone:', err);
      alert('Erro ao enviar imagem');
    } finally {
      setUploadingIcon(null);
    }
  }, [updateStyle]);

  const removeIcon = useCallback((icon: 'back' | 'search' | 'share') => {
    const propertyKey = icon === 'back' ? 'backIconUrl' : icon === 'search' ? 'searchIconUrl' : 'shareIconUrl';
    updateStyle(`navIcons.${propertyKey}`, undefined);
  }, [updateStyle]);

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

  const styles: ProductDetailStyles = getDefaultDetailStyles(editorState.draftTheme?.componentStyles?.productDetail);

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

          <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: 600, marginTop: '16px' }}>Descrição e Estoque</h5>
          <ColorControl label="Cor da Descrição" value={styles.description.color} property="description.color" />
          <ColorControl
            label={`Cor do link "Ver mais" ${styles.descriptionLinkColor ? '' : '(usando a cor de texto do tema — sem cor própria definida)'}`}
            value={styles.descriptionLinkColor || ''}
            property="descriptionLinkColor"
          />
          <ColorControl label="Cor do Estoque" value={styles.stockInfo.color} property="stockInfo.color" />
        </ExpandableSection>

        <ExpandableSection title="Coleção e Marca" icon="🏷️" sectionKey="brand">
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Duas linhas de texto simples ("Coleção: X" / "Marca: Y"), cada uma só aparece quando o produto tem o valor preenchido.</p>
          <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: 600 }}>Linha "Coleção:"</h5>
          <ColorControl label="Cor do rótulo (Coleção:)" value={styles.collectionLine.labelColor} property="collectionLine.labelColor" />
          <ColorControl label="Cor do valor" value={styles.collectionLine.valueColor} property="collectionLine.valueColor" />
          <FontSizeControl label="Tamanho" value={styles.collectionLine.fontSize || '14px'} property="collectionLine.fontSize" />
          <SelectControl
            label="Peso da fonte"
            value={styles.collectionLine.fontWeight || '500'}
            onChange={(v) => updateStyle('collectionLine.fontWeight', v)}
            options={fontWeightOptions}
          />

          <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: 600, marginTop: '16px' }}>Linha "Marca:"</h5>
          <ColorControl label="Cor do rótulo (Marca:)" value={styles.brandLine.labelColor} property="brandLine.labelColor" />
          <ColorControl label="Cor do valor" value={styles.brandLine.valueColor} property="brandLine.valueColor" />
          <FontSizeControl label="Tamanho" value={styles.brandLine.fontSize || '14px'} property="brandLine.fontSize" />
          <SelectControl
            label="Peso da fonte"
            value={styles.brandLine.fontWeight || '500'}
            onChange={(v) => updateStyle('brandLine.fontWeight', v)}
            options={fontWeightOptions}
          />
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

        <ExpandableSection title="Ícones de Navegação" icon="🔘" sectionKey="navicons">
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
            Voltar (leva pra categoria do produto), Buscar e Compartilhar — usados na barra fixa do celular e no botão de voltar do desktop (o mesmo ícone de "Voltar" aparece nos dois lugares). Sem imagem enviada, cada um usa um desenho padrão.
          </p>
          <ColorControl label="Fundo do círculo" value={styles.navIcons.backgroundColor} property="navIcons.backgroundColor" />
          <ColorControl label="Cor do ícone padrão (quando não há imagem)" value={styles.navIcons.iconColor} property="navIcons.iconColor" />

          {([
            { key: 'back' as const, label: 'Voltar', url: styles.navIcons.backIconUrl },
            { key: 'search' as const, label: 'Buscar', url: styles.navIcons.searchIconUrl },
            { key: 'share' as const, label: 'Compartilhar', url: styles.navIcons.shareIconUrl },
          ]).map(({ key, label, url }) => (
            <div key={key} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <h5 style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', fontWeight: 600 }}>{label}</h5>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {url && (
                  <img src={url} alt={label} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e7eb', objectFit: 'cover' }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingIcon === key}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIconUpload(f, key); }}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => removeIcon(key)}
                    style={{ padding: '4px 10px', fontSize: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Remover
                  </button>
                )}
              </div>
              {uploadingIcon === key && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Enviando...</p>}
              {uploadingIcon !== key && iconCompressionInfo[key] && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>📦 {iconCompressionInfo[key]}</p>}
            </div>
          ))}
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: styles.navIcons.backgroundColor, color: styles.navIcons.iconColor, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {styles.navIcons.backIconUrl ? <img src={styles.navIcons.backIconUrl} alt="Voltar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '←'}
          </span>
        </div>
        <h1 style={{ color: styles.productName.color, fontSize: styles.productName.fontSize, fontWeight: styles.productName.fontWeight as any, marginBottom: '8px' }}>Produto de Exemplo</h1>
        <p style={{ margin: '0 0 4px 0', fontSize: styles.collectionLine.fontSize, fontWeight: styles.collectionLine.fontWeight as any }}>
          <span style={{ color: styles.collectionLine.labelColor }}>Coleção: </span>
          <span style={{ color: styles.collectionLine.valueColor }}>Coleção Exemplo</span>
        </p>
        <p style={{ margin: '0 0 16px 0', fontSize: styles.brandLine.fontSize, fontWeight: styles.brandLine.fontWeight as any }}>
          <span style={{ color: styles.brandLine.labelColor }}>Marca: </span>
          <span style={{ color: styles.brandLine.valueColor }}>Marca Exemplo</span>
        </p>
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
