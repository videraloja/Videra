"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AuthGuard from "@/app/components/AuthGuard";
import ThemeToggle from "../../components/ThemeToggle";

// Componente principal com toda a lógica existente
function PedidosContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Erro ao buscar pedidos:", error);
      else setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  async function confirmarPedido(order: any) {
    // Atualiza estoque dos produtos
    for (const item of order.cart) {
      await supabase
        .from("products")
        .update({ stock: item.stock - item.quantity })
        .eq("id", item.id);
    }

    // Atualiza status do pedido
    await supabase
      .from("orders")
      .update({ status: "pago" })
      .eq("id", order.id);

    // Atualiza a lista local
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "pago" } : o)));
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'pago': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'cancelado': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return '🟡';
      case 'pago': return '🟢';
      case 'cancelado': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) return (
    <div style={{ 
      padding: 24, 
      textAlign: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <p>Carregando pedidos...</p>
    </div>
  );

  return (
    <div style={{ 
      padding: 24,
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      maxWidth: 1200,
      margin: '0 auto'
    }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 32 
      }}>
        <div>
          <button
            onClick={() => router.push('/admin')}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
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
            fontSize: 28, 
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            📦 Pedidos Videra
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginTop: 4,
            margin: 0
          }}>
            Visualização simplificada dos pedidos
          </p>
        </div>
        <ThemeToggle />
      </div>

      {orders.length === 0 ? (
        <div style={{ 
          padding: 60, 
          textAlign: 'center', 
          color: 'var(--text-secondary)',
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            marginBottom: 8,
            color: 'var(--text-primary)'
          }}>
            Nenhum pedido por enquanto
          </h3>
          <p style={{ margin: 0 }}>
            Os pedidos aparecerão aqui quando os clientes fizerem compras.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            
            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--bg-card)',
                  padding: '20px 24px',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: 16 
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12, 
                      marginBottom: 8 
                    }}>
                      <h3 style={{ 
                        fontSize: 18, 
                        fontWeight: 700, 
                        color: 'var(--text-primary)',
                        margin: 0
                      }}>
                        👤 {order.client_name || "—"}
                      </h3>
                      <div
                        style={{
                          background: statusColor.bg,
                          color: statusColor.text,
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          border: `1px solid ${statusColor.border}`
                        }}
                      >
                        {getStatusIcon(order.status)} {order.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: 16, 
                      flexWrap: 'wrap',
                      fontSize: 14, 
                      color: 'var(--text-secondary)' 
                    }}>
                      <span>
                        <strong>📅 Data:</strong> {new Date(order.created_at).toLocaleString('pt-BR')}
                      </span>
                      <span>
                        <strong>📦 Itens:</strong> {order.cart?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Itens do Pedido */}
                {order.cart && order.cart.length > 0 && (
                  <div style={{ 
                    marginTop: 16, 
                    paddingTop: 16, 
                    borderTop: '1px solid var(--border-color)' 
                  }}>
                    <h4 style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      marginBottom: 8,
                      color: 'var(--text-primary)'
                    }}>
                      Itens do Pedido:
                    </h4>
                    <ul style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 8 
                    }}>
                      {order.cart.map((item: any, i: number) => (
                        <li 
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 6,
                            fontSize: 14
                          }}
                        >
                          <span style={{ color: 'var(--text-primary)' }}>
                            {item.name}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {item.quantity} un. × R$ {item.price.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Botão de Confirmação */}
                {order.status === "pendente" && (
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => confirmarPedido(order)}
                      style={{
                        background: "#f59e0b",
                        color: "white",
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#d97706";
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f59e0b";
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      ✅ Confirmar pagamento e dar baixa
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
          💡 <strong>Dica:</strong> Clique em "Confirmar pagamento" para dar baixa no estoque automaticamente.
        </p>
      </div>
    </div>
  );
}

// Componente exportado com proteção
export default function PedidosPage() {
  return (
    <AuthGuard>
      <PedidosContent />
    </AuthGuard>
  );
}