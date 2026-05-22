"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import XLSX from 'xlsx-js-style';
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "../../components/ThemeToggle";
import AuthGuard from "@/app/components/AuthGuard";
import { getProductsWithAvailableStock } from "@/lib/productService";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  supplier_code?: string;
  cost_price?: number;
  image_url?: string;
  created_at: string;
  available_stock?: number;
  category?: string;
  reserved_qty?: number;
  margin?: string | null;
  potential_profit?: number;
  monthly_sales?: number;
  monthly_entries?: number;
}

interface Reservation {
  product_id: number;
  quantity: number;
}

interface StockLog {
  id: string;
  product_id: number;
  quantity_changed: number;
  new_stock: number;
  reason: string;
  created_at: string;
  user_email?: string;
}

// Componente principal com toda a lógica existente
function InventoryContent() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Estados para o Histórico (Logs)
  const [selectedProductLogs, setSelectedProductLogs] = useState<Product | null>(null);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // 🏗️ Técnica Pro: Busca produtos e cruza com reservas ativas via RPC
      const productsWithStock = await getProductsWithAvailableStock();
      
      // Buscar reservas detalhadas para mostrar no breakdown
      const { data: reservations } = await supabase
        .from('reservations')
        .select('product_id, quantity')
        .gte('expires_at', new Date().toISOString());

      const resMap = new Map<number, number>();
      reservations?.forEach((r: Reservation) => {
        resMap.set(r.product_id, (resMap.get(r.product_id) || 0) + r.quantity);
      });

      // 📈 Técnica Pro: Busca vendas e entradas do mês atual para a UI
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Buscar vendas reais das ordens (pago ou pendente)
      const { data: ordersThisMonth } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', startOfMonth)
        .eq('status', 'pago');
      
      const orderIdsThisMonth = ordersThisMonth?.map(o => o.id) || [];
      const salesMap = new Map<number, number>();
      
      if (orderIdsThisMonth.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .in('order_id', orderIdsThisMonth);
        items?.forEach(i => salesMap.set(i.product_id, (salesMap.get(i.product_id) || 0) + i.quantity));
      }

      // Buscar entradas (Reposição filtrando logs positivos)
      const { data: entriesThisMonth } = await supabase
        .from('stock_log')
        .select('product_id, quantity_changed')
        .gte('created_at', startOfMonth)
        .gt('quantity_changed', 0);
      
      const entriesMap = new Map<number, number>();
      entriesThisMonth?.forEach(e => entriesMap.set(e.product_id, (entriesMap.get(e.product_id) || 0) + e.quantity_changed));

      const enrichedProducts = productsWithStock.map(p => ({
        ...p,
        reserved_qty: resMap.get(p.id) || 0,
        monthly_sales: salesMap.get(p.id) || 0,
        monthly_entries: entriesMap.get(p.id) || 0,
        // Margem de lucro: ((Venda - Custo) / Venda) * 100 (Trava para preço > 0)
        margin: p.cost_price && p.price > 0 ? (((p.price - p.cost_price) / p.price) * 100).toFixed(1) : null,
        potential_profit: p.cost_price ? (p.price - p.cost_price) * p.stock : 0
      }));

      setProducts(enrichedProducts);
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
    const matchesCategory = categoryFilter === 'all' || (product.category === categoryFilter);
    
    return matchesSearch && matchesStockFilter && matchesCategory;
  });

  // Função para carregar histórico de um produto
  const loadProductLogs = async (product: Product) => {
    try {
      setSelectedProductLogs(product);
      setLoadingLogs(true);
      setLogs([]);

      const { data, error } = await supabase
        .from("stock_log")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      alert("Erro ao carregar histórico de movimentação");
    } finally {
      setLoadingLogs(false);
    }
  };

  // 📊 Função para exportar relatório para o Distribuidor
  const exportToDistributor = async () => {
    try {
      setLoading(true);
      const [year, month] = exportMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

      // 1. Buscar todos os movimentos do mês selecionado
      const { data: logsData, error: logsError } = await supabase
        .from("stock_log")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (logsError) throw logsError;

      // 2. Buscar vendas reais do mês selecionado via order_items
      const { data: ordersInMonth, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .eq("status", "pago");

      if (ordersError) throw ordersError;

      const orderIds = ordersInMonth?.map(o => o.id) || [];
      const salesMap = new Map<number, number>();

      if (orderIds.length > 0) {
        const { data: salesData, error: salesError } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .in("order_id", orderIds);
        
        if (salesError) throw salesError;
        
        salesData?.forEach(item => {
          salesMap.set(item.product_id, (salesMap.get(item.product_id) || 0) + item.quantity);
        });
      }

      // 3. Mapear entradas (Reposição) do log
      const entriesMap = new Map<number, number>();
      logsData?.forEach(log => {
        entriesMap.set(log.product_id, (entriesMap.get(log.product_id) || 0) + log.quantity_changed);
      });

      // 4. Preparar os dados consolidados (ordenados por categoria)
      const dataRows = [...products]
        .sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name))
        .map(p => {
          const soldQty = salesMap.get(p.id) || 0;
          const cost = p.cost_price || 0;
          return {
            'CATEGORIA': (p.category || 'GERAL').toUpperCase(),
            'PRODUTO': p.name,
            'CÓD. DISTR.': p.supplier_code || 'N/A',
            'ENTRADAS': entriesMap.get(p.id) || 0,
            'SAÍDAS': soldQty,
            'CUSTO UNITÁRIO': cost,
            'VALOR REPASSE': soldQty * cost,
            'ESTOQUE FÍSICO': p.stock
          };
        });

      // 5. Adicionar linha de TOTAIS ao final
      const totalRepasseGeral = dataRows.reduce((sum, row) => sum + row['VALOR REPASSE'], 0);
      const excelData = [
        ...dataRows,
        {
          'PRODUTO': 'TOTAL GERAL DE REPASSE',
          'VALOR REPASSE': totalRepasseGeral
        }
      ];

      // 6. Gerar o arquivo Excel com Formatação Profissional
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      if (worksheet['!ref']) {
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        // ❄️ Congelar a primeira linha (cabeçalho) para facilitar a leitura de listas longas
        worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

        // Configurar larguras das colunas (wch = character width)
        worksheet['!cols'] = [
          { wch: 20 }, // CATEGORIA
          { wch: 40 }, // PRODUTO
          { wch: 20 }, // CÓDIGO DISTRIBUIDOR
          { wch: 15 }, // ENTRADAS
          { wch: 15 }, // SAÍDAS
          { wch: 18 }, // CUSTO UNITÁRIO
          { wch: 18 }, // VALOR REPASSE
          { wch: 15 }, // ESTOQUE FÍSICO
        ];

        // Aplicar estilos célula a célula
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!worksheet[cell_ref]) continue;

            // 🛠️ Estilo base (Fonte, Alinhamento e Borda)
            worksheet[cell_ref].s = {
              font: { name: "Calibri", sz: 11 },
              alignment: { vertical: "center", horizontal: "center", wrapText: true },
              border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } }
              }
            };

            // 🔵 Estilo do Cabeçalho (Fundo azul escuro, texto branco negrito)
            if (R === 0) {
              worksheet[cell_ref].s = {
                ...worksheet[cell_ref].s,
                fill: { fgColor: { rgb: "1F4E78" } },
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                  top: { style: "medium", color: { rgb: "000000" } },
                  bottom: { style: "medium", color: { rgb: "000000" } }
                }
              };
            } 
            // 🟢 Estilo da Linha de Totais (Fundo verde escuro, texto branco negrito)
            else if (R === range.e.r) {
              worksheet[cell_ref].s = {
                ...worksheet[cell_ref].s,
                fill: { fgColor: { rgb: "375623" } },
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                alignment: { horizontal: "right", vertical: "center" }
              };
            }
            // ⚪ Efeito Zebra (Cinza bem clarinho nas linhas pares)
            else if (R % 2 === 1) {
              worksheet[cell_ref].s.fill = { fgColor: { rgb: "F2F2F2" } };
            }

            // 🔢 Alinhamento específico para colunas numéricas (Entradas, Saídas, Preços, Estoque)
            if (C >= 3 && R > 0 && R < range.e.r) {
              worksheet[cell_ref].s.alignment.horizontal = "right";
              
              // Formatar colunas de valor (E e F) como moeda
              if (C === 5 || C === 6) {
                worksheet[cell_ref].z = '"R$ "#,##0.00';
              }
            }
            
            // 📝 Alinhamento à esquerda para Nome do Produto (Coluna B)
            if (C === 1 && R > 0 && R < range.e.r) {
              worksheet[cell_ref].s.alignment.horizontal = "left";
            }
          }
        }
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bate_Estoque_Videra");
      
      XLSX.writeFile(workbook, `Videra_Conferencia_Estoque_${exportMonth}.xlsx`);
      alert("✅ Relatório de conferência gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao gerar documento de estoque");
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  // Estatísticas
  const totalProducts = filteredProducts.length;
  const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalInventoryValue = filteredProducts.reduce((sum, p) => sum + (p.stock * (p.cost_price || 0)), 0);
  const totalPotentialSales = filteredProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const lowStockCount = filteredProducts.filter(p => p.stock <= 10).length;
  const totalMonthlySales = filteredProducts.reduce((sum, p) => sum + (p.monthly_sales || 0), 0);
  const totalMonthlyRevenue = filteredProducts.reduce((sum, p) => sum + ((p.monthly_sales || 0) * p.price), 0);
  const outOfStockCount = filteredProducts.filter(p => p.stock === 0).length;

  const totalPotentialProfit = totalPotentialSales - totalInventoryValue;

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
            ← Início
        </button>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ 
              fontSize: 24, 
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0
            }}>
              📊 Inteligência de Estoque & Vendas
            </h1>
            <p style={{ 
              color: "var(--text-secondary)", 
              marginTop: 4,
              margin: 0
            }}>
              Gestão unificada de movimentação, lucratividade e performance mensal
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
          <div style={{ fontSize: 12, color: "#1e40af" }}>Vendas (Mês Atual)</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1e40af" }}>{totalMonthlySales} unidades</div>
          <div style={{ fontSize: 10, color: "#2563eb", marginTop: 4 }}>Receita: R$ {totalMonthlyRevenue.toFixed(2)}</div>
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
          <div style={{ fontSize: 12, color: "#92400e" }}>Capital Imobilizado (Custo)</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#92400e" }}>R$ {totalInventoryValue.toFixed(2)}</div>
          <div style={{ fontSize: 10, color: "#b45309", marginTop: 4 }}>Venda Potencial: R$ {totalPotentialSales.toFixed(2)}</div>
        </div>
        <div style={{ 
          background: "#ecfdf5", 
          padding: 16, 
          borderRadius: 8,
          border: "1px solid #a7f3d0"
        }}>
          <div style={{ fontSize: 12, color: "#065f46" }}>Lucro Estimado (Total)</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#059669" }}>R$ {totalPotentialProfit.toFixed(2)}</div>
          <div style={{ fontSize: 10, color: "#047857", marginTop: 4 }}>Margem Média: {((totalPotentialProfit / totalPotentialSales) * 100 || 0).toFixed(1)}%</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ 
        background: "var(--bg-card)", 
        padding: "16px 20px", 
        borderRadius: 8, 
        border: "1px solid var(--border-color)",
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Mês da Conferência</label>
            <input 
              type="month" 
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              style={{ padding: '8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={exportToDistributor}
            style={{ background: "#059669", color: "white", padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}
          >
            📄 Gerar Relatório p/ Distribuidor
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: '300px', margin: 0 }}>
          💡 Este relatório gera um Excel com entradas e saídas do mês para bater com o fornecedor.
        </p>
      </div>

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

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: 6,
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-primary)"
          }}
        >
          <option value="all">Todas as Categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat?.toUpperCase()}</option>
          ))}
        </select>
        
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
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    justifyContent: "space-between"
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
                  <div style={{ flex: 1.2 }}>
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
                      fontSize: 12, 
                      color: "var(--text-secondary)" 
                    }}>
                      {product.supplier_code && (
                        <span><strong>Código:</strong> {product.supplier_code}</span>
                      )}
                      <span style={{ color: 'var(--accent-color)' }}>#{product.category}</span>
                    </div>
                  </div>

                  {/* Indicadores Financeiros */}
                  <div style={{ flex: 0.8, fontSize: 13 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Venda: R$ {product.price.toFixed(2)}</div>
                    {product.cost_price && (
                      <>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Custo: R$ {product.cost_price.toFixed(2)}</div>
                        <div style={{ 
                          color: Number(product.margin) > 30 ? '#059669' : '#d97706',
                          fontWeight: 700,
                          fontSize: 11,
                          marginTop: 2
                        }}>
                          Margem: {product.margin}%
                        </div>
                      </>
                    )}
                  </div>

                  {/* Movimentação do Mês */}
                  <div style={{ flex: 0.8, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Mês atual</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#059669", fontWeight: 600 }}>Entradas</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>+{product.monthly_entries}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>Vendas</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>-{product.monthly_sales}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento de Estoque (Breakdown) */}
                  <div style={{ flex: 0.8, textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }} title="Total físico na prateleira">
                      Físico: <strong>{product.stock}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: "#ea580c" }} title="Itens em carrinhos ou pedidos pendentes">
                      Reservado: <strong>{product.reserved_qty}</strong>
                    </div>
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
                      Disponível: {Number(product.stock) - Number(product.reserved_qty || 0)}
                    </div>
                  </div>

                  {/* Ação Rápida */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => loadProductLogs(product)}
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        padding: "8px",
                        border: "1px solid var(--border-color)",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 18
                      }}
                      title="Ver Histórico"
                    >
                      📜
                    </button>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Histórico de Movimentação */}
      {selectedProductLogs && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            width: '100%', maxWidth: 700,
            borderRadius: 12, padding: 24,
            maxHeight: '90vh', overflowY: 'auto',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  📜 Histórico: {selectedProductLogs?.name}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Rastreabilidade de todas as entradas e saídas
                </p>
              </div>
              <button 
                onClick={() => setSelectedProductLogs(null)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            {loadingLogs ? (
              <p style={{ textAlign: 'center', padding: 40 }}>Carregando histórico...</p>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ color: 'var(--text-secondary)' }}>Nenhuma movimentação registrada para este produto.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {logs.map(log => (
                  <div key={log.id} style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: log.quantity_changed > 0 ? '#dcfce7' : '#fee2e2',
                        color: log.quantity_changed > 0 ? '#059669' : '#dc2626',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 14
                      }}>
                        {log.quantity_changed > 0 ? `+${log.quantity_changed}` : log.quantity_changed}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.reason}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Saldo Final</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {log.new_stock} UN
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setSelectedProductLogs(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--accent-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

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