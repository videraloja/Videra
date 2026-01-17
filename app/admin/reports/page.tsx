"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { utils, writeFile } from 'xlsx';
import ThemeToggle from "../../components/ThemeToggle";
import AuthGuard from "@/app/components/AuthGuard";

interface ReportData {
  supplier_code: string;
  name: string;
  quantity_sold: number;
  current_stock: number;
  sale_price: number;
  cost_price: number;
  total_sales: number;
  total_cost: number;
}

// Componente principal com toda a lógica existente
function ReportsContent() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert("Selecione as datas");
      return;
    }

    setLoading(true);

    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, created_at")
        .eq("status", "pago")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`);

      if (ordersError) throw ordersError;

      const orderIds = orders?.map(order => order.id) || [];

      if (orderIds.length === 0) {
        setReportData([]);
        setLoading(false);
        return;
      }

      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          quantity,
          price,
          products (
            id,
            name,
            supplier_code,
            stock,
            cost_price
          )
        `)
        .in("order_id", orderIds)
        .gt("quantity", 0);

      if (itemsError) throw itemsError;

      const productMap = new Map();

      orderItems?.forEach((item: any) => {
        const product = item.products;
        if (!product) return;

        const productId = product.id;
        const currentData = productMap.get(productId) || {
          supplier_code: product.supplier_code || "N/A",
          name: product.name,
          quantity_sold: 0,
          current_stock: product.stock || 0,
          sale_price: item.price,
          cost_price: product.cost_price || 0,
          total_sales: 0,
          total_cost: 0
        };

        currentData.quantity_sold += item.quantity;
        currentData.total_sales += item.quantity * item.price;
        currentData.total_cost += item.quantity * (product.cost_price || 0);

        productMap.set(productId, currentData);
      });

      const report = Array.from(productMap.values());
      setReportData(report);

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const totals = reportData.reduce((acc, item) => ({
    totalQuantity: acc.totalQuantity + item.quantity_sold,
    totalSales: acc.totalSales + item.total_sales,
    totalCost: acc.totalCost + item.total_cost
  }), { totalQuantity: 0, totalSales: 0, totalCost: 0 });

  const exportToExcel = (type: 'supplier' | 'admin') => {
    if (reportData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const excelData = reportData.map(item => {
      if (type === 'supplier') {
        return {
          'Código do Produto': item.supplier_code || 'N/A',
          'Nome do Produto': item.name,
          'Quantidade Vendida': item.quantity_sold,
          'Estoque Atual': item.current_stock,
          'Valor de Repasse (R$)': item.total_cost
        };
      } else {
        return {
          'Código': item.supplier_code || 'N/A',
          'Produto': item.name,
          'Quantidade Vendida': item.quantity_sold,
          'Estoque Atual': item.current_stock,
          'Valor Bruto (R$)': item.total_sales,
          'Valor Líquido (R$)': item.total_cost,
          'Margem (R$)': item.total_sales - item.total_cost
        };
      }
    });

    const totalsRow = type === 'supplier' 
      ? {
          'Código do Produto': 'TOTAIS',
          'Nome do Produto': '',
          'Quantidade Vendida': totals.totalQuantity,
          'Estoque Atual': '',
          'Valor de Repasse (R$)': totals.totalCost
        }
      : {
          'Código': 'TOTAIS',
          'Produto': '',
          'Quantidade Vendida': totals.totalQuantity,
          'Estoque Atual': '',
          'Valor Bruto (R$)': totals.totalSales,
          'Valor Líquido (R$)': totals.totalCost,
          'Margem (R$)': totals.totalSales - totals.totalCost
        };

    const dataWithTotals = [...excelData, totalsRow];
    const worksheet = utils.json_to_sheet(dataWithTotals);
    const workbook = utils.book_new();
    
    if (worksheet['!ref']) {
      const range = utils.decode_range(worksheet['!ref']);
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2E5BFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "1E40AF" } },
            left: { style: "thin", color: { rgb: "1E40AF" } },
            bottom: { style: "thin", color: { rgb: "1E40AF" } },
            right: { style: "thin", color: { rgb: "1E40AF" } }
          }
        };
      }

      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellAddress]) continue;

          const isTotalRow = row === range.e.r;
          
          worksheet[cellAddress].s = {
            font: { 
              bold: isTotalRow,
              color: { rgb: isTotalRow ? "FFFFFF" : "000000" }
            },
            fill: { 
              fgColor: { rgb: isTotalRow ? "059669" : (row % 2 === 0 ? "F8FAFC" : "FFFFFF") } 
            },
            alignment: { 
              horizontal: (type === 'supplier' && col >= 2) || (type === 'admin' && col >= 3) ? "right" : "left",
              vertical: "center" 
            },
            border: {
              top: { style: "thin", color: { rgb: "E2E8F0" } },
              left: { style: "thin", color: { rgb: "E2E8F0" } },
              bottom: { style: "thin", color: { rgb: "E2E8F0" } },
              right: { style: "thin", color: { rgb: "E2E8F0" } }
            }
          };
        }
      }

      const columnWidths = type === 'supplier' 
        ? [
            { wch: 15 },
            { wch: 30 },
            { wch: 12 },
            { wch: 12 },
            { wch: 15 }
          ]
        : [
            { wch: 15 },
            { wch: 30 },
            { wch: 12 },
            { wch: 12 },
            { wch: 15 },
            { wch: 15 },
            { wch: 12 }
          ];

      worksheet['!cols'] = columnWidths;
    }

    utils.book_append_sheet(workbook, worksheet, "Relatório");

    const fileName = type === 'supplier'
      ? `Relatorio_Repasse_${startDate}_a_${endDate}.xlsx`
      : `Relatorio_Vendas_${startDate}_a_${endDate}.xlsx`;

    writeFile(workbook, fileName);
  };

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <button
            onClick={() => router.push('/admin')}
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
          <h1 style={{ 
            fontSize: 24, 
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            📊 Relatórios de Vendas
          </h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Filtros */}
      <div style={{ 
        background: "var(--bg-card)", 
        padding: 20, 
        borderRadius: 8, 
        boxShadow: "var(--shadow)",
        marginBottom: 24,
        border: "1px solid var(--border-color)"
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "end", flexWrap: "wrap" }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: 4, 
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Data Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ 
                padding: "8px 12px", 
                border: "1px solid var(--border-color)", 
                borderRadius: 4,
                background: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: "block", 
              marginBottom: 4, 
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Data Fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ 
                padding: "8px 12px", 
                border: "1px solid var(--border-color)", 
                borderRadius: 4,
                background: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <button
            onClick={generateReport}
            disabled={loading}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Gerando..." : "📈 Gerar Relatório"}
          </button>
        </div>
      </div>

      {reportData.length > 0 && (
        <>
          {/* Cards de Resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ 
              background: "#dcfce7", 
              padding: 16, 
              borderRadius: 8,
              border: "1px solid #bbf7d0"
            }}>
              <div style={{ fontSize: 14, color: "#166534" }}>Total Vendido</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#166534" }}>
                {totals.totalQuantity} unidades
              </div>
            </div>
            <div style={{ 
              background: "#dbeafe", 
              padding: 16, 
              borderRadius: 8,
              border: "1px solid #bfdbfe"
            }}>
              <div style={{ fontSize: 14, color: "#1e40af" }}>Vendas Brutas</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1e40af" }}>
                R$ {totals.totalSales.toFixed(2)}
              </div>
            </div>
            <div style={{ 
              background: "#fef3c7", 
              padding: 16, 
              borderRadius: 8,
              border: "1px solid #fde68a"
            }}>
              <div style={{ fontSize: 14, color: "#92400e" }}>Total Repasse</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#92400e" }}>
                R$ {totals.totalCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Botões de Export */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <button
              onClick={() => exportToExcel('supplier')}
              style={{
                background: "#059669",
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
              📋 Excel para Distribuidor
            </button>
            
            <button
              onClick={() => exportToExcel('admin')}
              style={{
                background: "#2563eb",
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
              📈 Meu Relatório Completo
            </button>
          </div>

          {/* Tabela de Relatório */}
          <div style={{ 
            background: "var(--bg-card)", 
            borderRadius: 8, 
            overflow: "hidden", 
            boxShadow: "var(--shadow)",
            border: "1px solid var(--border-color)"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "left", 
                    borderBottom: "1px solid var(--border-color)",
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}>Código</th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "left", 
                    borderBottom: "1px solid var(--border-color)",
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}>Produto</th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "right", 
                    borderBottom: "1px solid var(--border-color)",
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}>Vendidos</th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "right", 
                    borderBottom: "1px solid var(--border-color)",
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}>Estoque</th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "right", 
                    borderBottom: "1px solid var(--border-color)",
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}>Vendas Brutas</th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "right", 
                    borderBottom: "1px solid var(--border-color)",
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}>Repasse</th>
                  <th style={{ 
                    padding: "12px 16px", 
                    textAlign: "right", 
                    borderBottom: "1px solid var(--border-color)",
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}>Margem</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, index) => (
                  <tr key={index} style={{ 
                    borderBottom: "1px solid var(--border-color)",
                    background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                  }}>
                    <td style={{ 
                      padding: "12px 16px",
                      color: 'var(--text-primary)'
                    }}>{item.supplier_code}</td>
                    <td style={{ 
                      padding: "12px 16px",
                      color: 'var(--text-primary)'
                    }}>{item.name}</td>
                    <td style={{ 
                      padding: "12px 16px", 
                      textAlign: "right",
                      color: 'var(--text-primary)'
                    }}>{item.quantity_sold}</td>
                    <td style={{ 
                      padding: "12px 16px", 
                      textAlign: "right",
                      color: 'var(--text-primary)'
                    }}>{item.current_stock}</td>
                    <td style={{ 
                      padding: "12px 16px", 
                      textAlign: "right",
                      color: 'var(--text-primary)'
                    }}>R$ {item.total_sales.toFixed(2)}</td>
                    <td style={{ 
                      padding: "12px 16px", 
                      textAlign: "right",
                      color: 'var(--text-primary)'
                    }}>R$ {item.total_cost.toFixed(2)}</td>
                    <td style={{ 
                      padding: "12px 16px", 
                      textAlign: "right",
                      color: 'var(--text-primary)'
                    }}>R$ {(item.total_sales - item.total_cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ 
                  background: "var(--bg-secondary)", 
                  fontWeight: 600 
                }}>
                  <td style={{ 
                    padding: "12px 16px",
                    color: 'var(--text-primary)'
                  }} colSpan={2}>TOTAIS</td>
                  <td style={{ 
                    padding: "12px 16px", 
                    textAlign: "right",
                    color: 'var(--text-primary)'
                  }}>{totals.totalQuantity}</td>
                  <td style={{ 
                    padding: "12px 16px", 
                    textAlign: "right",
                    color: 'var(--text-primary)'
                  }}>-</td>
                  <td style={{ 
                    padding: "12px 16px", 
                    textAlign: "right",
                    color: 'var(--text-primary)'
                  }}>R$ {totals.totalSales.toFixed(2)}</td>
                  <td style={{ 
                    padding: "12px 16px", 
                    textAlign: "right",
                    color: 'var(--text-primary)'
                  }}>R$ {totals.totalCost.toFixed(2)}</td>
                  <td style={{ 
                    padding: "12px 16px", 
                    textAlign: "right",
                    color: 'var(--text-primary)'
                  }}>R$ {(totals.totalSales - totals.totalCost).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {reportData.length === 0 && !loading && (
        <div style={{ 
          textAlign: "center", 
          padding: 40, 
          background: "var(--bg-card)", 
          borderRadius: 8,
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border-color)"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ 
            marginBottom: 8,
            color: 'var(--text-primary)'
          }}>Nenhum dado para exibir</h3>
          <p style={{ 
            color: "var(--text-secondary)"
          }}>Selecione o período e gere o relatório</p>
        </div>
      )}
    </div>
  );
}

// Componente exportado com proteção
export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportsContent />
    </AuthGuard>
  );
}