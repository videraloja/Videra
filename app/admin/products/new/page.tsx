"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AuthGuard from "@/app/components/AuthGuard";
import ThemeToggle from "@/app/components/ThemeToggle";
import { getPokemonCollectionsForAdmin } from '@/lib/collections';

// Componente principal com toda a lógica existente
function NewProductContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    supplier_code: "",
    cost_price: "",
    image_url: "",
    category: "", // 🆕 NOVO CAMPO
    product_type: "", // 🆕 NOVO CAMPO
    collection: "", // 🆕 NOVO CAMPO
    rarity: "", // 🆕 NOVO CAMPO
    card_set: "", // 🆕 NOVO CAMPO
    tags: [] as string[] // 🆕 NOVO CAMPO
  });
  const [previewUrl, setPreviewUrl] = useState("");

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
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        supplier_code: formData.supplier_code || null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        image_url: formData.image_url || null,
        category: formData.category || null, // 🆕 NOVO CAMPO
        product_type: formData.product_type || null, // 🆕 NOVO CAMPO
        collection: formData.collection || null, // 🆕 NOVO CAMPO
        rarity: formData.rarity || null, // 🆕 NOVO CAMPO
        card_set: formData.card_set || null, // 🆕 NOVO CAMPO
        tags: formData.tags.length > 0 ? formData.tags : null // 🆕 NOVO CAMPO
      };

      const { error } = await supabase
        .from("products")
        .insert([productData]);

      if (error) throw error;

      alert("Produto adicionado com sucesso!");
      router.push("/admin/products");
      
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      alert("Erro ao adicionar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Atualiza preview se for URL manual
    if (name === "image_url") {
      setPreviewUrl(value);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 🆕 FUNÇÃO PARA LIDAR COM TAGS
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  // 🎨 ESTILOS QUE RESPEITAM O TEMA
  const sectionStyle = {
    background: 'var(--bg-secondary)',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid var(--border-color)',
    margin: '8px 0'
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <button
            onClick={() => router.push("/admin/products")}
            style={{
              background: '#6b7280',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
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
          fontSize: 24, 
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0
        }}>
          ➕ Adicionar Novo Produto
        </h1>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{ 
        background: 'var(--bg-card)', 
        padding: 24, 
        borderRadius: 12, 
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
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
              placeholder="Ex: Box Arco-Íris Pokémon"
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
    {getPokemonCollectionsForAdmin().map(collection => (
      <option key={collection.id} value={collection.id}>
        {collection.name}
      </option>
    ))}
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                placeholder="0.00"
              />
            </div>
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
                placeholder="0"
              />
            </div>
          </div>

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
                placeholder="Ex: PKM-001"
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
                placeholder="0.00"
              />
            </div>
          </div>

          {/* 🆕 CAMPOS ESPECÍFICOS PARA JOGOS DE TABULEIRO */}
{formData.category === 'board-games' && (
  <div style={sectionStyle}>
    <h3 style={titleStyle}>
      🎲 Configurações Jogos de Tabuleiro
    </h3>
    
    {/* Tipo de Jogo */}
    <div style={{ marginBottom: '16px' }}>
      <label style={{ 
        ...labelStyle,
        fontSize: '14px'
      }}>
        Tipo de Jogo *
      </label>
      <select 
        name="product_type"
        value={formData.product_type}
        onChange={handleChange}
        style={inputStyle}
        required
      >
        <option value="">Selecione o tipo</option>
        <option value="tabuleiro">Tabuleiro</option>
        <option value="carta">Cartas</option>
        <option value="baralho">Baralhos</option>
        <option value="outro">Outro</option>
      </select>
      <small style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '12px', 
        display: 'block', 
        marginTop: '4px' 
      }}>
        Este campo define em qual filtro o jogo aparecerá
      </small>
    </div>

    {/* Número de Jogadores */}
    <div style={{ marginBottom: '16px' }}>
      <label style={{ 
        ...labelStyle,
        fontSize: '14px'
      }}>
        Número de Jogadores (opcional)
      </label>
      <input
        type="text"
        name="card_set" // 🎯 REUSANDO CAMPO EXISTENTE
        value={formData.card_set}
        onChange={handleChange}
        placeholder="Ex: 2-4 jogadores"
        style={inputStyle}
      />
    </div>

    {/* Idade Recomendada */}
    <div style={{ marginBottom: '16px' }}>
      <label style={{ 
        ...labelStyle,
        fontSize: '14px'
      }}>
        Idade Recomendada (opcional)
      </label>
      <input
        type="text"
        name="rarity" // 🎯 REUSANDO CAMPO EXISTENTE
        value={formData.rarity}
        onChange={handleChange}
        placeholder="Ex: 8+ anos"
        style={inputStyle}
      />
    </div>

    {/* Tags para Jogos */}
    <div>
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
        placeholder="Ex: estratégia, família, party, cooperativo, clássico"
        style={inputStyle}
      />
      <small style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '12px', 
        display: 'block', 
        marginTop: '4px' 
      }}>
        Use tags para classificação: estratégia, cartas, tabuleiro, party, etc.
      </small>
    </div>
  </div>
)}

          {/* SEÇÃO DE UPLOAD DE IMAGEM (MANTIDA ORIGINAL) */}
          <div>
            <label style={labelStyle}>
              Imagem do Produto
            </label>
            
            {/* Upload por arquivo */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ 
                display: "block", 
                marginBottom: 4, 
                color: 'var(--text-secondary)', 
                fontSize: 14 
              }}>
                Fazer upload:
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
                Ou usar URL:
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

          {/* Pré-visualização (MANTIDA ORIGINAL) */}
          {(previewUrl || formData.image_url) && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={labelStyle}>
                  Pré-visualização:
                </label>
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Remover
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

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading || uploading}
              style={{
                background: "#7c3aed",
                color: "white",
                padding: "12px 24px",
                border: "none",
                borderRadius: 6,
                cursor: (loading || uploading) ? "not-allowed" : "pointer",
                fontWeight: 600,
                flex: 1,
                opacity: (loading || uploading) ? 0.6 : 1
              }}
            >
              {loading ? "Adicionando..." : "💾 Adicionar Produto"}
            </button>
            
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              style={{
                background: "transparent",
                color: 'var(--text-secondary)',
                padding: "12px 24px",
                border: "1px solid var(--border-color)",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Componente exportado com proteção
export default function NewProductPage() {
  return (
    <AuthGuard>
      <NewProductContent />
    </AuthGuard>
  );
}