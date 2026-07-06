"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AuthGuard from "@/app/components/AuthGuard";
import ThemeToggle from "../../components/ThemeToggle";

// 🆕 INTERFACES COMPLETAS
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

// Componente principal com toda a lógica existente
function PedidosContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date()); // 🆕 Para o cronômetro

  // 🆕 Atualiza o tempo a cada segundo para o cronômetro
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🆕 ESTADOS DOS FILTROS COM PERSISTÊNCIA NO LOCALSTORAGE
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago' | 'cancelado'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ordersStatusFilter') as any) || 'all';
    }
    return 'all';
  });
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ordersMonthFilter') || 'all';
    }
    return 'all';
  });
  const [startDate, setStartDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ordersStartDate') || '';
    }
    return '';
  });
  const [endDate, setEndDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ordersEndDate') || '';
    }
    return '';
  });
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ordersSearchTerm') || '';
    }
    return '';
  });
  const [preorderFilter, setPreorderFilter] = useState<'all' | 'preorder'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ordersPreorderFilter') as any) || 'all';
    }
    return 'all';
  });

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Erro ao buscar pedidos:", error);
      else setOrders(data as Order[] || []);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(id, name, image_url)');

      if (itemsError) {
        console.error('Erro ao carregar itens:', itemsError);
        setLoading(false);
        return;
      }

      const grouped: Record<string, any[]> = {};
      (itemsData || []).forEach((item) => {
        if (!grouped[item.order_id]) grouped[item.order_id] = [];
        grouped[item.order_id].push(item);
      });

      setOrderItems(grouped as Record<string, OrderItem[]>);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  // 🆕 Efeitos para salvar os filtros no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('ordersStatusFilter', statusFilter);
  }, [statusFilter]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('ordersMonthFilter', monthFilter);
  }, [monthFilter]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('ordersStartDate', startDate);
  }, [startDate]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('ordersEndDate', endDate);
  }, [endDate]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('ordersSearchTerm', searchTerm);
  }, [searchTerm]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('ordersPreorderFilter', preorderFilter);
  }, [preorderFilter]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'pago': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'cancelado': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const getUniqueMonths = () => {
    const months = orders.map(order => {
      const date = new Date(order.created_at);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    
    const uniqueMonths = [...new Set(months)].sort().reverse();
    
    return [
      { value: 'all', label: 'Todos os Meses' },
      ...uniqueMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return {
          value: month,
          label: `${monthNames[parseInt(monthNum) - 1]} ${year}`
        };
      })
    ];
  };

  const filteredOrders = useMemo(() => orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    
    const orderDate = new Date(order.created_at);
    const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    const monthMatch = monthFilter === 'all' || orderMonth === monthFilter;
    
    const preorderMatch = preorderFilter === 'all' || order.is_preorder === true;

    const orderDateISO = order.created_at.substring(0, 10);
    let dateMatch = true;
    if (startDate && endDate) {
      dateMatch = orderDateISO >= startDate && orderDateISO <= endDate;
    } else if (startDate) {
      dateMatch = orderDateISO >= startDate;
    } else if (endDate) {
      dateMatch = orderDateISO <= endDate;
    }
    
    let searchMatch = true;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      searchMatch = !!(
        order.order_code?.toLowerCase().includes(searchLower) ||
        order.payment_method?.toLowerCase().includes(searchLower) ||
        order.pickup_option?.toLowerCase().includes(searchLower)
      );
    }
    
    return statusMatch && monthMatch && dateMatch && searchMatch && preorderMatch;
  }), [orders, statusFilter, monthFilter, startDate, endDate, searchTerm, preorderFilter]);

  const ordersForList = useMemo(() => filteredOrders.map((order) => {
    const items = orderItems[order.id] || [];
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      id: order.id,
      order_code: order.order_code,
      payment_method: order.payment_method,
      pickup_option: order.pickup_option,
      observations: order.observations,
      total,
      status: order.status,
      created_at: order.created_at,
      is_preorder: order.is_preorder,
      items_count: items.length,
    };
  }), [filteredOrders, orderItems]);

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'pendente').length;
  const paidOrders = filteredOrders.filter(o => o.status === 'pago').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelado').length;
  const totalValue = ordersForList.reduce((sum, order) => sum + order.total, 0);

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // 🆕 FUNÇÃO PARA FORMATAR TEMPO RESTANTE
  const formatTimeRemaining = (expiryDate: Date) => {
    const total = expiryDate.getTime() - now.getTime();
    if (total <= 0) {
      return 'Expirado';
    }
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);

    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  if (loading) return (
    <div style={{ 
      padding: 24, 
      textAlign: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh'
    }}>
      <div className="global-loading-container">
        <div className="global-spinner"></div>
        <p className="global-loading-text">Carregando pedidos...</p>
      </div>
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
            Pedidos Videra
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

      {/* Cards de estatísticas */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ 
          background: 'var(--bg-card)', 
          padding: 20, 
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Pedidos no Período</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{totalOrders}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            R$ {totalValue.toFixed(2)}
          </div>
        </div>
        <div style={{ 
          background: 'var(--bg-card)', 
          padding: 20, 
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: '#f59e0b', marginBottom: 8 }}>Pendentes</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{pendingOrders}</div>
        </div>
        <div style={{ 
          background: 'var(--bg-card)', 
          padding: 20, 
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: '#10b981', marginBottom: 8 }}>Pagos</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{paidOrders}</div>
        </div>
        <div style={{ 
          background: 'var(--bg-card)', 
          padding: 20, 
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 8 }}>Cancelados</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{cancelledOrders}</div>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div style={{ 
        background: 'var(--bg-card)', 
        padding: 24, 
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        marginBottom: 24
      }}>
        {/* Pesquisa */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            Pesquisar Pedido
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Código, forma de pagamento, etc..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
            {searchTerm && (
              <button onClick={clearSearch} style={{ padding: '10px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {/* Status */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
              Status do Pedido
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'}}
            >
              <option value="all">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
              <option value="cancelado">Cancelados</option> 
            </select>
          </div>

          {/* Tipo de Pedido */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
              Tipo de Pedido
            </label>
             <select
              value={preorderFilter}
              onChange={(e) => setPreorderFilter(e.target.value as any)}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'}}
            >
              <option value="all">Todos</option>
              <option value="preorder">Pré-Vendas</option>
            </select>
          </div>

          {/* 🆕 Filtro por Mês */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
              Mês do Pedido
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'}}
            >
              {getUniqueMonths().map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          {/* Filtro de Data */}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                Data de Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              onClick={clearDateFilters}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Limpar Datas
            </button>
          </div>
        </div>
      </div>

      {ordersForList.length === 0 ? (
        <div style={{ 
          padding: 60, 
          textAlign: 'center', 
          color: 'var(--text-secondary)',
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            marginBottom: 8,
            color: 'var(--text-primary)'
          }}>
            Nenhum pedido encontrado
          </h3>
          <p style={{ margin: 0 }}>
            Tente ajustar os filtros ou a busca.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ordersForList.map((order, index) => {
            const statusColor = getStatusColor(order.status);

            // 🆕 LÓGICA PARA TEMPO DE RESERVA
            const isPendingPreorder = order.is_preorder && order.status === 'pendente';
            let reservationDisplay;
            if (isPendingPreorder) {
              const expiryDate = new Date(new Date(order.created_at).getTime() + 60 * 60 * 1000);
              const timeRemaining = formatTimeRemaining(expiryDate);
              if (timeRemaining === 'Expirado') {
                reservationDisplay = 'RESERVA EXPIRADA';
              } else {
                reservationDisplay = `RESERVA EXPIRA EM ${timeRemaining}`;
              }
            } else if (order.is_preorder) {
              reservationDisplay = `${order.status.toUpperCase()} (PRÉ-VENDA)`;
            } else {
              reservationDisplay = order.status.toUpperCase();
            }

            return (
              <div
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                style={{
                  background: order.is_preorder
                    ? 'linear-gradient(135deg, var(--bg-card) 0%, #f3e8ff 150%)'
                    : 'var(--bg-card)',
                  border: order.is_preorder ? '2px solid #7c3aed' : '1px solid var(--border-color)',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div className="order-card-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      minWidth: '50px',
                      textAlign: 'center'
                    }}>
                      #{ordersForList.length - index}
                    </span>
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      {order.order_code}
                    </h3>
                    {order.is_preorder && (
                      <div
                        style={{
                          background: '#7c3aed',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        PRÉ-VENDA
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      background: statusColor.bg,
                      color: statusColor.text,
                      padding: '6px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1px solid ${statusColor.border}`,
                      // 🎨 Cor especial para reserva expirada
                      ...(isPendingPreorder && reservationDisplay === 'RESERVA EXPIRADA' && { background: '#fee2e2', color: '#991b1b', border: '1px solid #ef4444' })
                    }}
                  >
                    {reservationDisplay}
                  </div>
                </div>

                <div className="order-card-body" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <span><strong>Data:</strong> {new Date(order.created_at).toLocaleString('pt-BR')}</span>
                  <span><strong>Itens:</strong> {order.items_count}</span>
                  <span><strong>Total:</strong> R$ {order.total.toFixed(2)}</span>
                  <span><strong>Pagamento:</strong> {order.payment_method}</span>
                  <span><strong>Retirada:</strong> {order.pickup_option}</span>
                </div>

                {order.observations && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                      <strong>Obs:</strong> <span style={{ color: 'var(--text-secondary)' }}>{order.observations}</span>
                    </p>
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
          <strong>Dica:</strong> Clique em um pedido para ver mais detalhes e gerenciar o status.
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