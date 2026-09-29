// app/admin/orders/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AuthGuard from "@/app/components/AuthGuard";
import ThemeToggle from "../../../components/ThemeToggle";

interface Order {
  id: string;
  order_code: string;
  status: string;
  payment_method: string;
  pickup_option: string;
  observations: string | null;
  created_at: string;
  is_preorder: boolean;
}

interface OrderItem {
  id: string;
  order_id: string;
  quantity: number;
  price: number;
  products: {
    id: number;
    name: string;
    image_url: string;
  } | null;
}

function OrderDetailsContent() {
  const router = useRouter();
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*, products(id, name, image_url)")
          .eq("order_id", id);

        if (itemsError) throw itemsError;
        setItems(itemsData || []);
      } catch (error) {
        console.error("Erro ao buscar detalhes do pedido:", error);
        alert("Erro ao carregar pedido.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  // Traduz a exceção da função set_order_status pra uma frase em português
  // com os números reais. Os códigos são os mesmos que create_reservations
  // já usa (INSUFFICIENT_STOCK:produto:pedido:existe).
  const explainStatusError = (rawMessage: string): string => {
    const msg = rawMessage || '';

    if (msg.includes('INSUFFICIENT_STOCK:')) {
      const [, productIdStr, requestedStr, availableStr] = msg.slice(msg.indexOf('INSUFFICIENT_STOCK:')).split(':');
      const productId = Number(productIdStr);
      const item = items.find(i => Number(i.products?.id) === productId);
      const name = item?.products?.name || `produto #${productIdStr}`;
      return `Estoque insuficiente para "${name}": o pedido pede ${requestedStr}, mas existem ${availableStr} em estoque. Nenhum item foi baixado e o status não mudou.`;
    }
    if (msg.includes('PRODUCT_MISSING:')) {
      // Só acontece ENTRANDO em pago — não dá pra vender o que não existe.
      const name = msg.slice(msg.indexOf('PRODUCT_MISSING:') + 'PRODUCT_MISSING:'.length).trim();
      return `O item "${name}" deste pedido aponta pra um produto que não existe mais no cadastro, então ele não pode ser marcado como pago. Nada foi alterado.`;
    }
    if (msg.includes('ORDER_NOT_FOUND')) return 'Este pedido não foi encontrado no banco. Recarregue a página.';
    if (msg.includes('NOT_AUTHENTICATED')) return 'Sua sessão expirou. Faça login de novo no admin.';
    if (msg.includes('INVALID_STATUS')) return 'Status inválido.';
    return `Não foi possível mudar o status. Nada foi alterado. Detalhe técnico: ${msg}`;
  };

  // Uma chamada só: a função set_order_status lê o status atual do banco,
  // confere todos os itens, baixa/devolve tudo ou nada, apaga a reserva ao
  // pagar e grava o log — tudo numa transação. O navegador não decide nada.
  const handleStatusChange = async (newStatus: string) => {
    if (!order || isUpdating || order.status === newStatus) return;

    setIsUpdating(true);
    try {
      const { data, error } = await supabase.rpc('set_order_status', {
        p_order_id: order.id,
        p_new_status: newStatus,
      });

      if (error) throw new Error(error.message);

      const { data: fresh, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();
      if (fetchError) throw new Error(fetchError.message);
      setOrder(fresh);

      const skipped: { name: string; quantity: number }[] = data?.skipped_returns || [];

      if (data?.changed === false) {
        alert(`O pedido ${order.order_code} já estava como ${String(data.to).toUpperCase()} no banco (mudado em outra aba?). Tela atualizada.`);
      } else if (skipped.length > 0) {
        // A operação concluiu, mas parte da devolução não pôde ser feita —
        // avisa alto, com nome e quantidade, e fica registrado no stock_log.
        const lista = skipped.map(s => `  • "${s.name}" — ${s.quantity} un.`).join('\n');
        alert(
          `Status do pedido ${order.order_code} atualizado para ${newStatus.toUpperCase()}.\n\n` +
          `ATENÇÃO: o estoque dos itens abaixo NÃO foi devolvido, porque o produto não existe mais no cadastro:\n${lista}\n\n` +
          `Isso ficou registrado no histórico de estoque como "devolução não aplicada". Se o produto voltar ao cadastro, ajuste o estoque à mão.`
        );
      } else {
        alert(`Status do pedido ${order.order_code} atualizado para ${newStatus.toUpperCase()}`);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      alert(explainStatusError(error?.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order || isUpdating || order.status === 'cancelado') return;
    if (!confirm(`Tem certeza que deseja CANCELAR o pedido ${order.order_code}? Se o pedido estiver como PAGO, o estoque de todos os itens volta.`)) return;
  
    await handleStatusChange("cancelado");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'cancelado': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      default: return { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" };
    }
  };

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Carregando detalhes do pedido...</div>;
  }

  if (!order) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Pedido não encontrado.</div>;
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <button onClick={() => router.push('/admin/orders')} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Voltar para Pedidos
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            Detalhes do Pedido
            {order.is_preorder && (
              <span style={{ fontSize: 14, background: '#7c3aed', color: 'white', padding: '6px 12px', borderRadius: 20, fontWeight: 600 }}>
                PRÉ-VENDA
              </span>
            )}
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, margin: 0 }}>
            Código: <strong>{order.order_code}</strong>
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Status Atual</div>
            <div style={{ ...getStatusColor(order.status), padding: '8px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, fontWeight: 600, fontSize: 14 }}>
              {(() => {
                if (order.is_preorder) {
                  if (order.status === 'pendente') {
                    return 'RESERVADO';
                  }
                  return `${order.status.toUpperCase()} (PRÉ-VENDA)`;
                }
                return order.status.toUpperCase();
              })()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Total do Pedido</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>R$ {total.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Mudar Status</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleStatusChange("pendente")}
              disabled={isUpdating || order.status === "pendente"}
              style={{ background: order.status === "pendente" ? "#f59e0b" : "var(--bg-secondary)", color: order.status === "pendente" ? "white" : "var(--text-primary)", padding: "10px 16px", border: `1px solid ${order.status === "pendente" ? "#f59e0b" : "var(--border-color)"}`, borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, opacity: isUpdating || order.status === "pendente" ? 0.6 : 1 }}>
              {order.is_preorder ? 'Reservado' : 'Pendente'}
            </button>
            <button
              onClick={() => handleStatusChange("pago")}
              disabled={isUpdating || order.status === "pago"}
              style={{ background: order.status === "pago" ? "#10b981" : "var(--bg-secondary)", color: order.status === "pago" ? "white" : "var(--text-primary)", padding: "10px 16px", border: `1px solid ${order.status === "pago" ? "#10b981" : "var(--border-color)"}`, borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, opacity: isUpdating || order.status === "pago" ? 0.6 : 1 }}>
              Pago
            </button>
            <button
              onClick={handleDeleteOrder}
              disabled={isUpdating || order.status === "cancelado"}
              style={{ background: "var(--bg-secondary)", color: "#ef4444", padding: "10px 16px", border: "1px solid var(--border-color)", borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginLeft: 'auto', opacity: isUpdating || order.status === "cancelado" ? 0.6 : 1 }}>
              Cancelar Pedido
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Pagamento</h4>
            <p style={{ margin: 0 }}>{order.payment_method}</p>
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Retirada</h4>
            <p style={{ margin: 0 }}>{order.pickup_option}</p>
          </div>
        </div>

        {order.observations && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Observações</h4>
            <p style={{ margin: 0, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>{order.observations}</p>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Itens do Pedido</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                <img src={item.products?.image_url} alt={item.products?.name} style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.products?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.quantity} un. x R$ {item.price.toFixed(2)}</div>
                </div>
                <div style={{ fontWeight: 700 }}>R$ {(item.quantity * item.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
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
