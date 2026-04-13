"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AuthGuard from "@/app/components/AuthGuard";
import ThemeToggle from "@/app/components/ThemeToggle";

interface Order {
  id: string;
  order_code: string;
  status: string;
  payment_method: string;
  pickup_option: string;
  observations: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: number;
    name: string;
    image_url: string;
  } | null;
}

interface Reservation {
  id: string;
  order_id: string;
  expires_at: string;
}

function OrderDetailsContent() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🆕 Estado para informações da reserva
  const [reservation, setReservation] = useState<{
    active: boolean;
    timeLeft: string;
    expiresAt: Date | null;
    isExpiringSoon: boolean;
  } | null>(null);

  // Função para buscar reserva e calcular tempo restante
  const fetchReservation = async (orderId: string) => {
    const { data, error } = await supabase
      .from("reservations")
      .select("id, expires_at")
      .eq("order_id", orderId)
      .maybeSingle(); // pode não existir

    if (error) {
      console.error("Erro ao buscar reserva:", error);
      return null;
    }

    if (!data) return null;

    const nowUtc = Date.now();
    let expiresStr = data.expires_at;
    if (!expiresStr.endsWith("Z")) expiresStr += "Z";
    const expiresUtc = new Date(expiresStr).getTime();
    const diffMs = expiresUtc - nowUtc;

    if (diffMs > 0) {
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      let timeLeft = "";
      if (hours > 0) {
        timeLeft = `${hours}h ${minutes}min`;
      } else {
        timeLeft = `${minutes}min`;
      }
      return {
        active: true,
        timeLeft,
        expiresAt: new Date(expiresUtc),
        isExpiringSoon: totalMinutes < 10,
      };
    } else {
      return {
        active: false,
        timeLeft: "Expirada",
        expiresAt: null,
        isExpiringSoon: false,
      };
    }
  };

  // Carregar dados do pedido e reserva
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!id) return;

      // Buscar pedido
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError) {
        console.error("Erro ao buscar pedido:", orderError);
        return;
      }

      // Buscar itens manualmente
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      if (itemsError) {
        console.error("Erro ao buscar itens:", itemsError);
        return;
      }

      // Buscar produtos relacionados
      const productIds = [...new Set(itemsData.map((item) => item.product_id))];
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, image_url")
        .in("id", productIds);

      const productsMap = new Map();
      productsData?.forEach((p) => productsMap.set(p.id, p));

      const formattedItems = itemsData.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        products: productsMap.get(item.product_id) || null,
      }));

      setOrder(orderData);
      setItems(formattedItems);

      // Buscar reserva
      const res = await fetchReservation(id as string);
      setReservation(res);

      setLoading(false);
    };

    fetchOrderData();
  }, [id]);

  // 🆕 Atualizar reserva a cada 10 segundos
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      const res = await fetchReservation(id as string);
      setReservation(res);
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    // ... (mantenha a mesma lógica que você já tem)
    // (não vou repetir para não poluir, mas você deve manter o código existente)
  };

  const handleItemUpdate = async (itemId: string, newQty: number) => {
    // ... (mantenha)
  };

  const handleItemCancel = async (itemId: string) => {
    // ... (mantenha)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
      case "pago":
        return { bg: "#d1fae5", text: "#065f46", border: "#10b981" };
      case "cancelado":
        return { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" };
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#9ca3af" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendente":
        return "🟡";
      case "pago":
        return "🟢";
      case "cancelado":
        return "🔴";
      default:
        return "⚪";
    }
  };

  // 🆕 Renderizar badge da reserva
  const renderReservationBadge = () => {
    if (!reservation) return null;
    if (reservation.active) {
      if (reservation.isExpiringSoon) {
        return (
          <div
            style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "4px 12px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🔴</span> ⚠️ Expira em {reservation.timeLeft}
          </div>
        );
      }
      return (
        <div
          style={{
            background: "#dbeafe",
            color: "#2563eb",
            padding: "4px 12px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>⏳</span> 🕐 Reservado ({reservation.timeLeft})
        </div>
      );
    }
    if (reservation.timeLeft === "Expirada") {
      return (
        <div
          style={{
            background: "#fef3c7",
            color: "#d97706",
            padding: "4px 12px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>⚠️</span> ⏰ Reserva expirada
        </div>
      );
    }
    return null;
  };

  if (loading)
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          minHeight: "100vh",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p>Carregando detalhes do pedido...</p>
      </div>
    );

  if (!order)
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          minHeight: "100vh",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <p>Pedido não encontrado.</p>
      </div>
    );

  const statusColor = getStatusColor(order.status);
  const totalValue = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 960,
        margin: "0 auto",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        minHeight: "100vh",
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <button
            onClick={() => router.push("/admin/orders")}
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              padding: "8px 16px",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              cursor: "pointer",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ← Voltar para Pedidos
          </button>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            📦 Detalhes do Pedido
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: 4,
              margin: 0,
            }}
          >
            Gerencie este pedido específico
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Informações do Pedido */}
      <div
        style={{
          background: "var(--bg-card)",
          padding: 24,
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
                color: "var(--text-primary)",
              }}
            >
              🏷️ {order.order_code}
            </h2>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: 14,
                color: "var(--text-secondary)",
              }}
            >
              <span>
                <strong>💳 Pagamento:</strong> {order.payment_method}
              </span>
              <span>
                <strong>📦 Retirada:</strong> {order.pickup_option}
              </span>
              <span>
                <strong>📅 Data:</strong>{" "}
                {new Date(order.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
            {order.observations && (
              <div
                style={{
                  marginTop: 12,
                  padding: 8,
                  background: "#fef3c7",
                  borderRadius: 8,
                  color: "#92400e",
                  fontSize: 13,
                }}
              >
                💬 <strong>Observações:</strong> {order.observations}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div
              style={{
                background: statusColor.bg,
                color: statusColor.text,
                padding: "8px 16px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                border: `1px solid ${statusColor.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {getStatusIcon(order.status)} {order.status.toUpperCase()}
            </div>
            {/* 🆕 Badge de reserva */}
            {renderReservationBadge()}
          </div>
        </div>

        {/* Botões de Status */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => handleStatusChange("pendente")}
            style={{
              background:
                order.status === "pendente" ? "#f59e0b" : "var(--bg-secondary)",
              color:
                order.status === "pendente" ? "white" : "var(--text-primary)",
              padding: "10px 16px",
              border: "1px solid #f59e0b",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🟡 Pendente
          </button>
          <button
            onClick={() => handleStatusChange("pago")}
            style={{
              background:
                order.status === "pago" ? "#16a34a" : "var(--bg-secondary)",
              color: order.status === "pago" ? "white" : "var(--text-primary)",
              padding: "10px 16px",
              border: "1px solid #16a34a",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🟢 Pago
          </button>
          <button
            onClick={() => handleStatusChange("cancelado")}
            style={{
              background:
                order.status === "cancelado" ? "#dc2626" : "var(--bg-secondary)",
              color:
                order.status === "cancelado" ? "white" : "var(--text-primary)",
              padding: "10px 16px",
              border: "1px solid #dc2626",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🔴 Cancelado
          </button>
        </div>
      </div>

      {/* Itens do Pedido */}
      <div
        style={{
          background: "var(--bg-card)",
          padding: 24,
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
            color: "var(--text-primary)",
          }}
        >
          🛍️ Itens do Pedido ({items.length})
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                padding: 16,
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background:
                  item.quantity === 0
                    ? "var(--bg-secondary)"
                    : "var(--bg-card)",
                opacity: item.quantity === 0 ? 0.6 : 1,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flex: 1,
                  minWidth: 200,
                }}
              >
                {item.products?.image_url ? (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid var(--border-color)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      background: "var(--bg-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-secondary)",
                      fontSize: 12,
                    }}
                  >
                    Sem imagem
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      marginBottom: 6,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.products?.name || "(produto removido)"}
                  </p>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 14,
                    }}
                  >
                    {item.quantity} × R$ {item.price.toFixed(2)}
                  </p>
                  <p
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      fontSize: 16,
                      marginTop: 4,
                    }}
                  >
                    Total: R$ {(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    Qtd:
                  </span>
                  <input
                    type="number"
                    min="0"
                    defaultValue={item.quantity}
                    onBlur={(e) =>
                      handleItemUpdate(item.id, Number(e.target.value))
                    }
                    style={{
                      width: 70,
                      padding: 8,
                      borderRadius: 6,
                      border: "1px solid var(--border-color)",
                      textAlign: "center",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <button
                  onClick={() => handleItemCancel(item.id)}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total do Pedido */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "2px solid var(--border-color)",
            textAlign: "right",
          }}
        >
          <span
            style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}
          >
            TOTAL DO PEDIDO: R$ {totalValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botão WhatsApp */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => {
            const message = `Olá! Gostaria de informações sobre o pedido *${order.order_code}*`;
            window.open(
              `https://wa.me/5592986446677?text=${encodeURIComponent(message)}`,
              "_blank"
            );
          }}
          style={{
            background: "#25D366",
            color: "white",
            padding: "12px 24px",
            border: "none",
            borderRadius: 40,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
          }}
        >
          📱 Falar com cliente sobre o pedido {order.order_code}
        </button>
      </div>

      {/* Rodapé */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "var(--bg-secondary)",
          borderRadius: 8,
          border: "1px solid var(--border-color)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 14,
            margin: 0,
          }}
        >
          💡 <strong>Dica:</strong> Alterne entre os status para gerenciar
          automaticamente o estoque dos produtos.
        </p>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <AuthGuard>
      <OrderDetailsContent />
    </AuthGuard>
  );
}