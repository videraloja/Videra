"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AuthGuard from "@/app/components/AuthGuard";
import ThemeToggle from "@/app/components/ThemeToggle";

// Componente principal com toda a lógica existente
function OrderDetailsContent() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("DEBUG OrderDetailsPage loaded — versão protegida com tema");

  // Busca os dados do pedido e dos itens
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!id) return;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError) {
        console.error("Erro ao buscar pedido:", orderError);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          quantity,
          price,
          products (
            id,
            name,
            image_url
          )
        `)
        .eq("order_id", id);

      if (itemsError) {
        console.error("Erro ao buscar itens:", itemsError);
        return;
      }

      setOrder(orderData);
      setItems(itemsData || []);
      setLoading(false);
    };

    fetchOrderData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order.status) return; // evita ação repetida

    console.log("⚙️ Iniciando mudança de status para:", newStatus);

    // 1️⃣ Atualiza o status do pedido
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id);

    if (orderError) {
      console.error("❌ Erro ao atualizar status:", orderError);
      alert("Erro ao alterar status.");
      return;
    }

    // 2️⃣ Se o status for "pago", reduz o estoque
    if (newStatus === "pago") {
      for (const item of items) {
        if (item.quantity > 0 && item.products?.id) {
          // 🔹 Converte para número (o banco espera bigint e integer)
          const productIdNum = Number(item.products.id);
          const qtyNum = Number(item.quantity);

          console.log("🧾 Chamando decrease_stock:", {
            product_id_input: productIdNum,
            quantity_input: qtyNum,
          });

          // 🔹 Tenta primeiro via função RPC
          const { error: stockError } = await supabase.rpc("decrease_stock", {
            product_id_input: productIdNum,
            quantity_input: qtyNum,
          });

          // 🔹 Caso a função RPC falhe (por permissão ou ambiguidade), faz fallback direto
          if (stockError) {
            console.warn("⚠️ Falha na RPC, tentando atualização direta:", stockError);

            // CORREÇÃO: Busca o stock atual primeiro, depois atualiza
            const { data: product, error: fetchError } = await supabase
              .from("products")
              .select("stock")
              .eq("id", productIdNum)
              .single();

            if (fetchError) {
              console.error("❌ Erro ao buscar produto:", fetchError);
              continue;
            }

            const newStock = Math.max(0, (product.stock || 0) - qtyNum);
            
            const { error: directError } = await supabase
              .from("products")
              .update({ stock: newStock })
              .eq("id", productIdNum);

            if (directError) {
              console.error("❌ Falha na atualização direta:", directError);
            } else {
              console.log(`✅ Estoque atualizado manualmente para o produto ${productIdNum}`);
            }
          } else {
            console.log(`✅ Estoque atualizado com sucesso para o produto ${productIdNum}`);
          }
        }
      }
    }

    // 3️⃣ Se o status for "cancelado", devolve o estoque (APENAS se estava pago)
    if (newStatus === "cancelado" && order.status === "pago") {
      console.log("🔄 Iniciando devolução de estoque...");
      
      for (const item of items) {
        const productId = Number(item.products?.id);
        const quantity = Number(item.quantity);

        if (productId && quantity > 0) {
          console.log(`↩️ Devolvendo ${quantity} unidades para produto: ${productId}`);

          // 🔍 DEBUG: Busca o produto ANTES da atualização
          const { data: productBefore, error: fetchError } = await supabase
            .from("products")
            .select("stock, name")
            .eq("id", productId)
            .single();

          if (fetchError) {
            console.error("❌ Erro ao buscar produto:", fetchError);
            continue;
          }

          console.log(`📊 ANTES - Produto: ${productBefore.name}, Stock: ${productBefore.stock}`);

          const newStock = (productBefore.stock || 0) + quantity;
          console.log(`🧮 Cálculo: ${productBefore.stock} + ${quantity} = ${newStock}`);

          // 🔍 Atualiza o estoque
          const { error: stockError, data: updateResult } = await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", productId)
            .select(); // ← IMPORTANTE: pede para retornar os dados atualizados

          if (stockError) {
            console.error("❌ Erro ao devolver estoque:", stockError);
          } else {
            console.log("✅ UpdateResult:", updateResult);
            
            // 🔍 DEBUG: Busca o produto DEPOIS da atualização para confirmar
            const { data: productAfter } = await supabase
              .from("products")
              .select("stock")
              .eq("id", productId)
              .single();
              
            console.log(`📊 DEPOIS - Stock atual: ${productAfter?.stock}`);
            console.log(`✅ Estoque devolvido para produto ${productId}`);
          }
        }
      }
    }

    alert(`Status alterado para "${newStatus}"`);
    router.refresh();
  };

  const handleItemUpdate = async (itemId: string, newQty: number) => {
    const { error } = await supabase
      .from("order_items")
      .update({ quantity: newQty })
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao atualizar item:", error);
      alert("Erro ao alterar quantidade.");
      return;
    }

    alert("Quantidade atualizada!");
    router.refresh();
  };

  const handleItemCancel = async (itemId: string) => {
    const confirmCancel = confirm("Deseja realmente cancelar este item?");
    if (!confirmCancel) return;

    const { error } = await supabase
      .from("order_items")
      .update({ quantity: 0 })
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao cancelar item:", error);
      alert("Erro ao cancelar item.");
      return;
    }

    alert("Item cancelado!");
    router.refresh();
  };

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
      <p>Carregando detalhes do pedido...</p>
    </div>
  );

  if (!order) return (
    <div style={{ 
      padding: 24, 
      textAlign: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <p>Pedido não encontrado.</p>
    </div>
  );

  const statusColor = getStatusColor(order.status);

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 960, 
      margin: "0 auto",
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 24 
      }}>
        <div>
          <button
            onClick={() => router.push("/admin/orders")}
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
            ← Voltar para Pedidos
          </button>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            📦 Detalhes do Pedido
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginTop: 4,
            margin: 0
          }}>
            Gerencie este pedido específico
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Informações do Pedido */}
      <div style={{ 
        background: 'var(--bg-card)', 
        padding: 24, 
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow)',
        marginBottom: 24
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: 16 
        }}>
          <div>
            <h2 style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              marginBottom: 8,
              color: 'var(--text-primary)'
            }}>
              Pedido #{order.id?.slice(0, 8)}
            </h2>
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              flexWrap: 'wrap',
              fontSize: 14, 
              color: 'var(--text-secondary)' 
            }}>
              <span><strong>👤 Cliente:</strong> {order.client_name}</span>
              <span><strong>📞 WhatsApp:</strong> {order.client_whatsapp}</span>
              <span><strong>📅 Data:</strong> {new Date(order.created_at).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          
          <div
            style={{
              background: statusColor.bg,
              color: statusColor.text,
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              border: `1px solid ${statusColor.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {getStatusIcon(order.status)} {order.status.toUpperCase()}
          </div>
        </div>

        {/* Botões de Status */}
        <div style={{ 
          display: "flex", 
          gap: 8, 
          marginTop: 16, 
          flexWrap: "wrap" 
        }}>
          <button 
            onClick={() => handleStatusChange("pendente")} 
            style={{ 
              background: order.status === "pendente" ? "#f59e0b" : "var(--bg-secondary)",
              color: order.status === "pendente" ? "white" : "var(--text-primary)",
              padding: "10px 16px", 
              border: "1px solid #f59e0b",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            🟡 Pendente
          </button>
          <button 
            onClick={() => handleStatusChange("pago")} 
            style={{ 
              background: order.status === "pago" ? "#16a34a" : "var(--bg-secondary)",
              color: order.status === "pago" ? "white" : "var(--text-primary)",
              padding: "10px 16px", 
              border: "1px solid #16a34a",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            🟢 Pago
          </button>
          <button 
            onClick={() => handleStatusChange("cancelado")} 
            style={{ 
              background: order.status === "cancelado" ? "#dc2626" : "var(--bg-secondary)",
              color: order.status === "cancelado" ? "white" : "var(--text-primary)",
              padding: "10px 16px", 
              border: "1px solid #dc2626",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            🔴 Cancelado
          </button>
        </div>
      </div>

      {/* Itens do Pedido */}
      <div style={{ 
        background: 'var(--bg-card)', 
        padding: 24, 
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow)'
      }}>
        <h2 style={{ 
          fontSize: 20, 
          fontWeight: 600, 
          marginBottom: 16,
          color: 'var(--text-primary)'
        }}>
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
                background: item.quantity === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                opacity: item.quantity === 0 ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                {item.products?.image_url ? (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    style={{ 
                      width: 80, 
                      height: 80, 
                      objectFit: "cover", 
                      borderRadius: 8, 
                      border: "1px solid var(--border-color)" 
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: 8, 
                    background: "var(--bg-secondary)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    color: "var(--text-secondary)",
                    fontSize: 12
                  }}>
                    Sem imagem
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontWeight: 700, 
                    marginBottom: 6,
                    color: 'var(--text-primary)'
                  }}>
                    {item.products?.name || "(produto removido)"}
                  </p>
                  <p style={{ 
                    color: 'var(--text-secondary)',
                    fontSize: 14
                  }}>
                    {item.quantity} × R$ {item.price.toFixed(2)}
                  </p>
                  <p style={{ 
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: 16,
                    marginTop: 4
                  }}>
                    Total: R$ {(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ 
                    fontSize: 14, 
                    color: 'var(--text-secondary)',
                    fontWeight: 600
                  }}>
                    Qtd:
                  </span>
                  <input
                    type="number"
                    min="0"
                    defaultValue={item.quantity}
                    onBlur={(e) => handleItemUpdate(item.id, Number(e.target.value))}
                    style={{ 
                      width: 70, 
                      padding: 8, 
                      borderRadius: 6, 
                      border: "1px solid var(--border-color)", 
                      textAlign: "center",
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)'
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
                    fontSize: 12
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
          💡 <strong>Dica:</strong> Alterne entre os status para gerenciar automaticamente o estoque dos produtos.
        </p>
      </div>
    </div>
  );
}

// Componente exportado com proteção
export default function OrderDetailsPage() {
  return (
    <AuthGuard>
      <OrderDetailsContent />
    </AuthGuard>
  );
}