"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "../../components/ThemeToggle";
import AuthGuard from "@/app/components/AuthGuard";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  supplier_code?: string;
  cost_price?: number;
  image_url?: string;
  created_at: string;
  category?: string;
  product_type?: string;
  collection?: string;
}

// 🆕 TIPOS PARA FILTROS
interface Filters {
  category: string;
  searchTerm: string;
}

// Componente principal com toda a lógica existente
function ProductsContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🆕 ESTADOS PARA FILTROS
  const [filters, setFilters] = useState<Filters>({
    category: '',
    searchTerm: ""
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      alert("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
      
      alert("Produto excluído com sucesso!");
      loadProducts();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto");
    }
  };

  // 🆕 FILTRAGEM AVANÇADA
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      product.supplier_code?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      product.collection?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      product.product_type?.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesCategory = !filters.category || product.category === filters.category;

    return matchesSearch && matchesCategory;
  });

  // 🆕 EXTRAIR CATEGORIAS ÚNICAS
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // 🆕 FUNÇÃO PARA BADGE DE CATEGORIA
  const getCategoryBadge = (category?: string) => {
    if (!category) return null;

    const badgeStyles = {
      pokemon: { background: '#ef4444', color: 'white', icon: '⚡' },
      'board-games': { background: '#059669', color: 'white', icon: '🎲' },
      'acessorios': { background: '#7c3aed', color: 'white', icon: '🛡️' },
      'hot-wheels': { background: '#dc2626', color: 'white', icon: '🏎️' }
    };

    const style = badgeStyles[category as keyof typeof badgeStyles] || 
                 { background: '#6b7280', color: 'white', icon: '📦' };

    return (
      <span style={{
        background: style.background,
        color: style.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {style.icon} {category.toUpperCase()}
      </span>
    );
  };

  // 🆕 FUNÇÃO PARA BADGE DE TIPO (POKÉMON)
  const getTypeBadge = (productType?: string) => {
    if (!productType) return null;

    const typeNames: { [key: string]: string } = {
      'deck': 'DECK',
      'booster-pack': 'BOOSTER',
      'booster-box': 'BOX',
      'elite-trainer-box': 'ETB',
      'single': 'CARTA',
      'collection-box': 'COLLECTION',
      'mini-box': 'MINI BOX',
      'triple-box': 'TRIPLE',
      'quadruple-box': 'QUADRUPLE',
      'accessory': 'ACESSÓRIO'
    };

    return (
      <span style={{
        background: '#8b5cf6',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: '500'
      }}>
        {typeNames[productType] || productType.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        padding: 24, 
        maxWidth: 1200, 
        margin: "0 auto",
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        minHeight: '100vh'
      }}>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 1200, 
      margin: "0 auto",
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 24 
      }}>
        <div>
          <button
            onClick={() => router.push("/admin")}
            style={{
              background: '#6b7280',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Voltar para Admin
          </button>
          <h1 style={{ 
            fontSize: 24, 
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            🛍️ Gerenciar Produtos
          </h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ThemeToggle />
          <button
            onClick={() => router.push("/admin/products/new")}
            style={{
              background: "#7c3aed",
              color: "white",
              padding: "12px 20px",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            ➕ Adicionar Produto
          </button>
        </div>
      </div>

      {/* 🆕 BARRA DE FILTROS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto', 
        gap: '16px', 
        marginBottom: 24,
        alignItems: 'end'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Filtro por Categoria */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}>
              📂 Filtrar por Categoria
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                minWidth: '180px'
              }}
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Barra de Pesquisa */}
          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}>
              🔍 Buscar Produtos
            </label>
            <input
              type="text"
              placeholder="Buscar por nome, código, coleção ou tipo..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                fontSize: "14px",
                background: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* 🆕 BOTÃO LIMPAR FILTROS */}
        {(filters.category || filters.searchTerm) && (
          <button
            onClick={() => setFilters({ category: '', searchTerm: '' })}
            style={{
              background: 'transparent',
              color: '#ef4444',
              padding: '10px 16px',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            🗑️ Limpar Filtros
          </button>
        )}
      </div>

      {/* Lista de Produtos */}
      <div style={{ 
        background: "var(--bg-card)", 
        borderRadius: 12, 
        overflow: "hidden",
        boxShadow: "var(--shadow)",
        border: "1px solid var(--border-color)"
      }}>
        {filteredProducts.length === 0 ? (
          <div style={{ 
            padding: 40, 
            textAlign: "center", 
            color: "var(--text-secondary)" 
          }}>
            {filters.searchTerm || filters.category ? 
              "Nenhum produto encontrado com os filtros aplicados" : 
              "Nenhum produto cadastrado"
            }
          </div>
        ) : (
          <div style={{ display: "grid", gap: 1, background: "var(--bg-secondary)" }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "var(--bg-card)",
                  padding: "20px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "16px",
                  alignItems: "center"
                }}
              >
                {/* Imagem do Produto */}
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 8, 
                  overflow: "hidden",
                  border: "1px solid var(--border-color)"
                }}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ 
                      width: "100%", 
                      height: "100%", 
                      background: "var(--bg-secondary)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: 12
                    }}>
                      Sem imagem
                    </div>
                  )}
                </div>

                {/* 🆕 INFORMAÇÕES DO PRODUTO EXPANDIDAS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ 
                      fontSize: 18, 
                      fontWeight: 600, 
                      margin: 0,
                      color: "var(--text-primary)"
                    }}>
                      {product.name}
                    </h3>
                    {getCategoryBadge(product.category)}
                    {product.category === 'pokemon' && getTypeBadge(product.product_type)}
                  </div>
                  
                  <div style={{ 
                    display: "flex", 
                    gap: 16, 
                    flexWrap: "wrap", 
                    fontSize: 14, 
                    color: "var(--text-secondary)",
                    marginBottom: '4px'
                  }}>
                    <span>
                      <strong>Preço:</strong> R$ {product.price.toFixed(2)}
                    </span>
                    <span>
                      <strong>Estoque:</strong> {product.stock}
                    </span>
                    {product.supplier_code && (
                      <span>
                        <strong>Código:</strong> {product.supplier_code}
                      </span>
                    )}
                  </div>

                  {/* 🆕 INFORMAÇÕES ESPECÍFICAS */}
                  <div style={{ 
                    display: "flex", 
                    gap: 12, 
                    flexWrap: "wrap", 
                    fontSize: 13, 
                    color: "var(--text-muted)" 
                  }}>
                    {product.collection && (
                      <span>
                        <strong>Coleção:</strong> {product.collection}
                      </span>
                    )}
                    {product.cost_price && (
                      <span>
                        <strong>Custo:</strong> R$ {product.cost_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14
                    }}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🆕 RESUMO EXPANDIDO */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: "var(--bg-secondary)", 
        borderRadius: 8,
        border: "1px solid var(--border-color)"
      }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <p style={{ 
            color: "var(--text-secondary)", 
            fontSize: 14,
            margin: 0
          }}>
            📊 <strong>Total:</strong> {filteredProducts.length} produto(s) • 
            <strong> Estoque total:</strong> {filteredProducts.reduce((sum, p) => sum + p.stock, 0)} unidades
          </p>
          
          {/* 🆕 ESTATÍSTICAS POR CATEGORIA */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {categories.map(category => {
                const categoryCount = filteredProducts.filter(p => p.category === category).length;
                if (categoryCount === 0) return null;
                
                return (
                  <span key={category} style={{ 
                    color: "var(--text-secondary)", 
                    fontSize: 14 
                  }}>
                    <strong>{category}:</strong> {categoryCount}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente exportado com proteção
export default function ProductsPage() {
  return (
    <AuthGuard>
      <ProductsContent />
    </AuthGuard>
  );
}