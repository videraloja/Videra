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
}

// Componente principal com toda a lógica existente
function InventoryContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      alert("Erro ao carregar estoque");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStockFilter = !lowStockFilter || product.stock <= 10;
    
    return matchesSearch && matchesStockFilter;
  });

  // Estatísticas
  const totalProducts = filteredProducts.length;
  const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const lowStockCount = filteredProducts.filter(p => p.stock <= 10).length;
  const outOfStockCount = filteredProducts.filter(p => p.stock === 0).length;

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { 
      color: "#dc2626", 
      label: "ESGOTADO", 
      bg: "#fef2f2",
      textColor: "#dc2626"
    };
    if (stock <= 5) return { 
      color: "#ea580c", 
      label: "BAIXO", 
      bg: "#fff7ed",
      textColor: "#ea580c"
    };
    if (stock <= 10) return { 
      color: "#d97706", 
      label: "ATENÇÃO", 
      bg: "#fffbeb",
      textColor: "#d97706"
    };
    return { 
      color: "#059669", 
      label: "NORMAL", 
      bg: "#f0fdf4",
      textColor: "#059669"
    };
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
        <p>Carregando estoque...</p>
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
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/admin")}
          style={{
            background: '#6b7280',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          ← Voltar para Admin
        </button>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ 
              fontSize: 24, 
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0
            }}>
              📋 Estoque Completo
            </h1>
            <p style={{ 
              color: "var(--text-secondary)", 
              marginTop: 4,
              margin: 0
            }}>
              Visão geral de todos os produtos em estoque
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ThemeToggle />
            <button
              onClick={() => router.push("/admin/products/new")}
              style={{
                background: "#7c3aed",
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              ➕ Novo Produto
            </button>
          </div>
        </div>
      </div>

      {/* Cartões de Estatísticas */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ 
          background: "#dbeafe", 
          padding: 16, 
          borderRadius: 8,
          border: "1px solid #bfdbfe"
        }}>
          <div style={{ fontSize: 14, color: "#1e40af" }}>Total de Produtos</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e40af" }}>{totalProducts}</div>
        </div>
        <div style={{ 
          background: "#dcfce7", 
          padding: 16, 
          borderRadius: 8,
          border: "1px solid #bbf7d0"
        }}>
          <div style={{ fontSize: 14, color: "#166534" }}>Unidades em Estoque</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#166534" }}>{totalStock}</div>
        </div>
        <div style={{ 
          background: "#fef3c7", 
          padding: 16, 
          borderRadius: 8,
          border: "1px solid #fde68a"
        }}>
          <div style={{ fontSize: 14, color: "#92400e" }}>Valor Total (R$)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#92400e" }}>{totalValue.toFixed(2)}</div>
        </div>
        <div style={{ 
          background: "#fef2f2", 
          padding: 16, 
          borderRadius: 8,
          border: "1px solid #fecaca"
        }}>
          <div style={{ fontSize: 14, color: "#dc2626" }}>Estoque Baixo</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>{lowStockCount}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ 
        background: "var(--bg-card)", 
        padding: 20, 
        borderRadius: 8, 
        boxShadow: "var(--shadow)",
        marginBottom: 24,
        border: "1px solid var(--border-color)",
        display: "flex",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "10px 16px",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: 16,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            minWidth: "300px"
          }}
        />
        
        <label style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          cursor: "pointer",
          color: "var(--text-primary)"
        }}>
          <input
            type="checkbox"
            checked={lowStockFilter}
            onChange={(e) => setLowStockFilter(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span>Mostrar apenas estoque baixo (≤ 10 unidades)</span>
        </label>
      </div>

      {/* Tabela de Estoque */}
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
            {searchTerm || lowStockFilter ? "Nenhum produto encontrado" : "Nenhum produto em estoque"}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 1, background: "var(--bg-secondary)" }}>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              
              return (
                <div
                  key={product.id}
                  style={{
                    background: "var(--bg-card)",
                    padding: "16px 20px",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto",
                    gap: "16px",
                    alignItems: "center"
                  }}
                >
                  {/* Imagem */}
                  <div style={{ 
                    width: 60, 
                    height: 60, 
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
                        fontSize: 10
                      }}>
                        Sem imagem
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div>
                    <h3 style={{ 
                      fontSize: 16, 
                      fontWeight: 600, 
                      marginBottom: 4,
                      color: "var(--text-primary)"
                    }}>
                      {product.name}
                    </h3>
                    <div style={{ 
                      display: "flex", 
                      gap: 12, 
                      flexWrap: "wrap", 
                      fontSize: 14, 
                      color: "var(--text-secondary)" 
                    }}>
                      <span><strong>Preço:</strong> R$ {product.price.toFixed(2)}</span>
                      {product.supplier_code && (
                        <span><strong>Código:</strong> {product.supplier_code}</span>
                      )}
                    </div>
                  </div>

                  {/* Status do Estoque */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        background: stockStatus.bg,
                        color: stockStatus.textColor,
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${stockStatus.color}20`
                      }}
                    >
                      {product.stock} UN • {stockStatus.label}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: "var(--text-secondary)", 
                      marginTop: 4 
                    }}>
                      R$ {(product.stock * product.price).toFixed(2)}
                    </div>
                  </div>

                  {/* Ação Rápida */}
                  <button
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                      whiteSpace: "nowrap"
                    }}
                  >
                    ✏️ Editar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo Final */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: "var(--bg-secondary)", 
        borderRadius: 8,
        border: "1px solid var(--border-color)"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: 8 
        }}>
          <div style={{ 
            color: "var(--text-secondary)", 
            fontSize: 14 
          }}>
            📊 <strong>Resumo:</strong> {totalProducts} produto(s) • {totalStock} unidades • 
            Valor total: R$ {totalValue.toFixed(2)}
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-secondary)" }}>
            {outOfStockCount > 0 && (
              <span style={{ color: "#dc2626" }}>🚫 {outOfStockCount} esgotado(s)</span>
            )}
            {lowStockCount > 0 && (
              <span style={{ color: "#ea580c" }}>⚠️ {lowStockCount} com estoque baixo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente exportado com proteção
export default function InventoryPage() {
  return (
    <AuthGuard>
      <InventoryContent />
    </AuthGuard>
  );
}