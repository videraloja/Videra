"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AuthGuard from "@/app/components/AuthGuard";
import ThemeToggle from "@/app/components/ThemeToggle";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  supplier_code?: string;
  cost_price?: number;
  image_url?: string;
  category?: string;
  product_type?: string;
  collection?: string;
  rarity?: string;
  card_set?: string;
  tags?: string[];
  // 🆕 CAMPOS PARA PROMOÇÕES
  original_price?: number;
  on_sale?: boolean;
  sale_price?: number;
}

// EDIÇÃO DE PRODUTOS EXISTENTES
// Componente principal com toda a lógica existente
function EditProductContent() {
  const router = useRouter();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    supplier_code: "",
    cost_price: "",
    image_url: "",
    category: "",
    product_type: "",
    collection: "",
    rarity: "",
    card_set: "",
    tags: [] as string[],
    // 🆕 CAMPOS PARA PROMOÇÕES
    on_sale: false,
    original_price: "",
    sale_price: ""
  });
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          price: data.price.toString(),
          stock: data.stock.toString(),
          supplier_code: data.supplier_code || "",
          cost_price: data.cost_price?.toString() || "",
          image_url: data.image_url || "",
          category: data.category || "",
          product_type: data.product_type || "",
          collection: data.collection || "",
          rarity: data.rarity || "",
          card_set: data.card_set || "",
          tags: data.tags || [],
          // 🆕 CAMPOS PARA PROMOÇÕES
          on_sale: data.on_sale || false,
          original_price: data.original_price?.toString() || data.price.toString(),
          sale_price: data.sale_price?.toString() || ""
        });
        setPreviewUrl(data.image_url || "");
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      alert("Erro ao carregar produto");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 FUNÇÃO PARA CALCULAR DESCONTO AUTOMATICAMENTE
  const calculateDiscount = () => {
    if (formData.original_price && formData.sale_price) {
      const original = parseFloat(formData.original_price);
      const sale = parseFloat(formData.sale_price);
      if (original > 0 && sale > 0) {
        return Math.round(((original - sale) / original) * 100);
      }
    }
    return 0;
  };

  // 🆕 ATUALIZA PREÇO ORIGINAL QUANDO ATIVA/DESATIVA PROMOÇÃO
  const handlePromotionToggle = (isOnSale: boolean) => {
    if (isOnSale) {
      // Ativando promoção - usa preço atual como original
      setFormData(prev => ({
        ...prev,
        on_sale: true,
        original_price: prev.original_price || prev.price,
        sale_price: prev.sale_price || prev.price
      }));
    } else {
      // Desativando promoção - mantém dados mas desativa
      setFormData(prev => ({
        ...prev,
        on_sale: false
      }));
    }
  };

  // Função para fazer upload da imagem
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    
    try {
      // Gera um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Faz upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pega a URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
      setPreviewUrl(urlData.publicUrl);
      
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verifica se é uma imagem
      if (!file.type.startsWith('image/')) {
        alert("Por favor, selecione apenas imagens");
        return;
      }

      // Verifica tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5MB");
        return;
      }

      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        supplier_code: formData.supplier_code || null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        image_url: formData.image_url || null,
        category: formData.category || null,
        product_type: formData.product_type || null,
        collection: formData.collection || null,
        rarity: formData.rarity || null,
        card_set: formData.card_set || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        // 🆕 DADOS DE PROMOÇÃO
        on_sale: formData.on_sale,
        original_price: formData.on_sale && formData.original_price ? parseFloat(formData.original_price) : null,
        sale_price: formData.on_sale && formData.sale_price ? parseFloat(formData.sale_price) : null
      };

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      alert("Produto atualizado com sucesso!");
      router.push("/admin/products");
      
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      alert("Erro ao atualizar produto");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'on_sale') {
        handlePromotionToggle(checked);
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Atualiza preview se for URL manual
      if (name === "image_url") {
        setPreviewUrl(value);
      }

      // 🆕 ATUALIZA PREÇO DE VENDA QUANDO PROMOÇÃO ESTÁ ATIVA
      if (name === "price" && !formData.on_sale) {
        setFormData(prev => ({
          ...prev,
          price: value
        }));
      }
    }
  };

  // 🆕 FUNÇÃO PARA LIDAR COM TAGS
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 🎨 ESTILOS QUE RESPEITAM O TEMA
  const sectionStyle = {
    background: 'var(--bg-secondary)',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid var(--border-color)',
    margin: '16px 0'
  };

  const titleStyle = {
    color: 'var(--text-primary)',
    marginBottom: '16px',
    fontSize: '18px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const labelStyle = { 
    display: "block", 
    marginBottom: 8, 
    fontWeight: 600,
    color: 'var(--text-primary)'
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid var(--border-color)",
    borderRadius: 6,
    fontSize: 16,
    background: 'var(--bg-card)',
    color: 'var(--text-primary)'
  };

  const smallInputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid var(--border-color)",
    borderRadius: 6,
    fontSize: 14,
    background: 'var(--bg-card)',
    color: 'var(--text-primary)'
  };

  if (loading) {
    return (
      <div style={{ 
        padding: 24, 
        maxWidth: 600, 
        margin: "0 auto",
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        minHeight: '100vh',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p>Carregando produto...</p>
      </div>
    );
  }

  const discountPercent = calculateDiscount();

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 600, 
      margin: "0 auto",
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: 16 
        }}>
          <button
            onClick={() => router.push("/admin/products")}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Voltar para Produtos
          </button>
          <ThemeToggle />
        </div>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0
        }}>
          ✏️ Editar Produto
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)', 
          marginTop: 4,
          margin: 0
        }}>
          Atualize as informações do produto
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{ 
        background: 'var(--bg-card)', 
        padding: 24, 
        borderRadius: 12, 
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Nome do Produto */}
          <div>
            <label style={labelStyle}>
              Nome do Produto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          {/* 🆕 SEÇÃO DE CATEGORIA */}
          <div>
            <label style={labelStyle}>
              Categoria
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Selecione uma categoria</option>
              <option value="pokemon">Pokémon TCG</option>
              <option value="board-games">Jogos de Tabuleiro</option>
              <option value="acessorios">Acessórios TCG</option>
              <option value="hot-wheels">Hot Wheels</option>
            </select>
          </div>

          {/* 🆕 SEÇÃO DE PROMOÇÕES */}
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              🏷️ Configurações de Promoção
            </h3>
            
            {/* Toggle de Promoção */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: formData.on_sale ? '16px' : '0'
            }}>
              <input
                type="checkbox"
                id="on_sale"
                name="on_sale"
                checked={formData.on_sale}
                onChange={handleChange}
                style={{
                  width: '18px',
                  height: '18px'
                }}
              />
              <label htmlFor="on_sale" style={{
                ...labelStyle,
                margin: 0,
                cursor: 'pointer'
              }}>
                Este produto está em promoção
              </label>
            </div>

            {/* Campos de Preço com Promoção */}
            {formData.on_sale && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '16px',
                background: 'var(--bg-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                {/* Preço Original */}
                <div>
                  <label style={{ 
                    ...labelStyle,
                    fontSize: '14px'
                  }}>
                    Preço Original (R$)
                  </label>
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleChange}
                    required={formData.on_sale}
                    min="0"
                    step="0.01"
                    style={smallInputStyle}
                  />
                </div>

                {/* Preço Promocional */}
                <div>
                  <label style={{ 
                    ...labelStyle,
                    fontSize: '14px'
                  }}>
                    Preço Promocional (R$)
                  </label>
                  <input
                    type="number"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={handleChange}
                    required={formData.on_sale}
                    min="0"
                    step="0.01"
                    style={smallInputStyle}
                  />
                </div>

                {/* Display do Desconto */}
                {discountPercent > 0 && (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '8px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    🎉 Desconto de {discountPercent}% OFF
                  </div>
                )}

                {/* Preço de Venda Normal (quando não tem promoção) */}
                <div style={{
                  gridColumn: '1 / -1',
                  marginTop: '8px'
                }}>
                  <label style={{ 
                    ...labelStyle,
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                  }}>
                    Preço de Venda Normal (R$)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      ...smallInputStyle,
                      background: 'var(--bg-secondary)',
                      opacity: 0.7
                    }}
                    disabled={formData.on_sale}
                  />
                  <small style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '12px', 
                    display: 'block', 
                    marginTop: '4px' 
                  }}>
                    Quando a promoção terminar, este será o preço normal
                  </small>
                </div>
              </div>
            )}

            {/* Preço Normal (quando não tem promoção) */}
            {!formData.on_sale && (
              <div>
                <label style={labelStyle}>
                  Preço de Venda (R$) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* 🆕 CAMPOS ESPECÍFICOS PARA POKÉMON TCG */}
          {formData.category === 'pokemon' && (
            <div style={sectionStyle}>
              <h3 style={titleStyle}>
                ⚡ Configurações Pokémon TCG
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                {/* Product Type */}
                <div>
                  <label style={{ 
                    ...labelStyle,
                    fontSize: '14px'
                  }}>
                    Tipo de Produto
                  </label>
                  <select 
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleChange}
                    style={smallInputStyle}
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="deck">Deck Pré-construído</option>
                    <option value="booster-pack">Booster Pack</option>
                    <option value="booster-box">Booster Box</option>
                    <option value="elite-trainer-box">Elite Trainer Box (ETB)</option>
                    <option value="single">Carta Avulsa</option>
                    <option value="collection-box">Collection Box</option>
                    <option value="mini-box">Mini Box</option>
                    <option value="triple-box">Triple Box</option>
                    <option value="quadruple-box">Quadruple Box</option>
                    <option value="accessory">Acessório Pokémon</option>
                  </select>
                </div>

                {/* Collection */}
                <div>
                  <label style={{ 
                    ...labelStyle,
                    fontSize: '14px'
                  }}>
                    Coleção
                  </label>
                  <select 
                    name="collection"
                    value={formData.collection}
                    onChange={handleChange}
                    style={smallInputStyle}
                  >
                    <option value="">Selecione a coleção</option>
                    <option value="scarlet-violet">Scarlet & Violet</option>
                    <option value="paldea-evolved">Paldea Evolved</option>
                    <option value="crown-zenith">Crown Zenith</option>
                    <option value="brilliant-stars">Brilliant Stars</option>
                    <option value="lost-origin">Lost Origin</option>
                    <option value="silver-tempest">Silver Tempest</option>
                    <option value="fusion-strike">Fusion Strike</option>
                    <option value="chilling-reign">Chilling Reign</option>
                    <option value="darkness-ablaze">Darkness Ablaze</option>
                    <option value="evolving-skies">Evolving Skies</option>
                    <option value="celebrations">Celebrations</option>
                    <option value="pokemon-go">Pokémon GO</option>
                  </select>
                </div>

                {/* Rarity */}
                <div>
                  <label style={{ 
                    ...labelStyle,
                    fontSize: '14px'
                  }}>
                    Raridade
                  </label>
                  <select 
                    name="rarity"
                    value={formData.rarity}
                    onChange={handleChange}
                    style={smallInputStyle}
                  >
                    <option value="">Selecione a raridade</option>
                    <option value="common">Comum</option>
                    <option value="uncommon">Incomum</option>
                    <option value="rare">Rara</option>
                    <option value="holo-rare">Rara Holo</option>
                    <option value="ultra-rare">Ultra Rara</option>
                    <option value="secret-rare">Rara Secreta</option>
                    <option value="rainbow-rare">Rainbow Rare</option>
                    <option value="pre-constructed">Pré-construído</option>
                    <option value="booster-pack">Booster Pack</option>
                  </select>
                </div>

                {/* Card Set */}
                <div>
                  <label style={{ 
                    ...labelStyle,
                    fontSize: '14px'
                  }}>
                    Set de Cartas
                  </label>
                  <input
                    type="text"
                    name="card_set"
                    value={formData.card_set}
                    onChange={handleChange}
                    placeholder="Ex: Base Set, Fusion Strike"
                    style={smallInputStyle}
                  />
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ 
                  ...labelStyle,
                  fontSize: '14px'
                }}>
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="Ex: vmax, full-art, first-edition, charizard"
                  style={smallInputStyle}
                />
                <small style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '12px', 
                  display: 'block', 
                  marginTop: '4px' 
                }}>
                  Use tags para busca avançada: vmax, full-art, rainbow, etc.
                </small>
              </div>
            </div>
          )}

          {/* Estoque */}
          <div>
            <label style={labelStyle}>
              Estoque *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              style={inputStyle}
            />
          </div>

          {/* Código e Preço de Custo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>
                Código do Fornecedor
              </label>
              <input
                type="text"
                name="supplier_code"
                value={formData.supplier_code}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Preço de Custo (R$)
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 🆕 SEÇÃO DE UPLOAD DE IMAGEM ATUALIZADA */}
          <div>
            <label style={labelStyle}>
              Imagem do Produto
            </label>
            
            {/* Upload por arquivo */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 4, 
                color: 'var(--text-secondary)', 
                fontSize: 14 
              }}>
                Fazer upload de nova imagem:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px dashed var(--border-color)",
                  borderRadius: 6,
                  background: uploading ? 'var(--bg-secondary)' : 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  opacity: uploading ? 0.6 : 1
                }}
              />
              {uploading && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Fazendo upload...</p>}
            </div>

            {/* Ou por URL */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: 4, 
                color: 'var(--text-secondary)', 
                fontSize: 14 
              }}>
                Ou usar URL da imagem:
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                style={inputStyle}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
          </div>

          {/* Pré-visualização */}
          {(previewUrl || formData.image_url) && (
            <div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: 12 
              }}>
                <label style={labelStyle}>
                  Pré-visualização:
                </label>
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  🗑️ Remover
                </button>
              </div>
              <img
                src={previewUrl || formData.image_url}
                alt="Pré-visualização"
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)"
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Botões */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={saving || uploading}
              style={{
                background: "#2563eb",
                color: "white",
                padding: "12px 24px",
                border: "none",
                borderRadius: 8,
                cursor: (saving || uploading) ? "not-allowed" : "pointer",
                fontWeight: 600,
                flex: 1,
                opacity: (saving || uploading) ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!saving && !uploading) {
                  e.currentTarget.style.background = "#1d4ed8";
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && !uploading) {
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {saving ? "💾 Salvando..." : "💾 Salvar Alterações"}
            </button>
            
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              style={{
                background: "transparent",
                color: 'var(--text-secondary)',
                padding: "12px 24px",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>

      {/* Rodapé Informativo */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: 'var(--bg-secondary)', 
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: 14,
          margin: 0
        }}>
          💡 <strong>Dica:</strong> Campos marcados com * são obrigatórios. Ative "Em promoção" para mostrar preços riscados no site.
        </p>
      </div>
    </div>
  );
}

// Componente exportado com proteção
export default function EditProductPage() {
  return (
    <AuthGuard>
      <EditProductContent />
    </AuthGuard>
  );
}