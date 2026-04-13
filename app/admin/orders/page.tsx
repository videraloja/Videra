'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AuthGuard from '@/app/components/AuthGuard';
import ThemeToggle from '../../components/ThemeToggle';

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
  order_id: string;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
}

// 🆕 Interface para reserva
interface Reservation {
  id: string;
  order_id: string;
  expires_at: string;
}

function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago' | 'cancelado'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 🆕 Estado para reservas ativas
  const [activeReservations, setActiveReservations] = useState<Map<string, Reservation>>(new Map());
  const [reservationStatus, setReservationStatus] = useState<Map<string, { active: boolean; expiresAt: Date | null; timeLeft: string }>>(new Map());

  useEffect(() => {
    const loadOrders = async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erro ao carregar pedidos:', ordersError);
        return;
      }

      setOrders(ordersData || []);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');

      if (itemsError) {
        console.error('Erro ao carregar itens:', itemsError);
        return;
      }

      const grouped: Record<string, OrderItem[]> = {};
      (itemsData || []).forEach((item) => {
        if (!grouped[item.order_id]) grouped[item.order_id] = [];
        grouped[item.order_id].push(item);
      });

      setOrderItems(grouped);
      
      // 🆕 Buscar reservas ativas para todos os pedidos
      await loadReservations(ordersData || []);
      
      setLoading(false);
    };

    loadOrders();
  }, []);

const loadReservations = async (ordersList: Order[]) => {
  const orderIds = ordersList.map(o => o.id);
  if (orderIds.length === 0) return;

  const { data: reservationsData, error } = await supabase
    .from('reservations')
    .select('id, order_id, expires_at')
    .in('order_id', orderIds);

  if (error) {
    console.error('Erro ao buscar reservas:', error);
    return;
  }

  const reservationsMap = new Map();
  reservationsData?.forEach((res: Reservation) => {
    reservationsMap.set(res.order_id, res);
  });
  setActiveReservations(reservationsMap);

  const statusMap = new Map();
  const nowUtc = Date.now(); // timestamp UTC em ms

  ordersList.forEach(order => {
    const reservation = reservationsMap.get(order.id);
    
    if (reservation && order.status === 'pendente') {
      // 🔧 FORÇAR leitura como UTC: adicionar 'Z' se não tiver
      let expiresStr = reservation.expires_at;
      if (!expiresStr.endsWith('Z')) {
        expiresStr += 'Z';
      }
      const expiresUtc = new Date(expiresStr).getTime();
      const diffMs = expiresUtc - nowUtc;
      
      console.log(`🔍 Depuração pedido ${order.order_code}:`, {
        expires_at_original: reservation.expires_at,
        expires_utc: new Date(expiresUtc).toISOString(),
        now_utc: new Date(nowUtc).toISOString(),
        diff_ms: diffMs,
        diff_min: Math.floor(diffMs / 60000)
      });
      
      if (diffMs > 0) {
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        let timeLeft = '';
        if (hours > 0) {
          timeLeft = `${hours}h ${minutes}min`;
        } else {
          timeLeft = `${minutes}min`;
        }
        
        const isExpiringSoon = totalMinutes < 10;
        
        statusMap.set(order.id, {
          active: true,
          expiresAt: new Date(expiresUtc),
          timeLeft,
          isExpiringSoon
        });
      } else {
        statusMap.set(order.id, {
          active: false,
          expiresAt: null,
          timeLeft: 'Expirada',
          isExpiringSoon: false
        });
      }
    } else {
      let timeLeft = '';
      if (order.status === 'pago') timeLeft = 'Pago';
      else if (order.status === 'cancelado') timeLeft = 'Cancelado';
      else timeLeft = 'Sem reserva';
      
      statusMap.set(order.id, {
        active: false,
        expiresAt: null,
        timeLeft,
        isExpiringSoon: false
      });
    }
  });
  
  setReservationStatus(statusMap);
};

  // 🆕 Atualizar reservas a cada 10 segundos
  useEffect(() => {
    if (orders.length === 0) return;

    const interval = setInterval(() => {
      loadReservations(orders);
    }, 10000); // Atualiza a cada 10 segundos

    return () => clearInterval(interval);
  }, [orders]);

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

  // 🆕 Função para pegar cor do status da reserva
  const getReservationColor = (orderId: string) => {
    const status = reservationStatus.get(orderId);
    if (!status) return { bg: '#f3f4f6', text: '#6b7280', icon: '⚪' };
    
    if (status.active) {
      const timeLeft = status.timeLeft;
      const mins = parseInt(timeLeft);
      if (!isNaN(mins) && mins < 10) {
        return { bg: '#fee2e2', text: '#dc2626', icon: '🔴', label: `⏰ Expira em ${timeLeft}` };
      }
      return { bg: '#dbeafe', text: '#2563eb', icon: '⏳', label: `🕐 Reservado (${timeLeft})` };
    }
    
    if (status.timeLeft === 'Expirada') {
      return { bg: '#fef3c7', text: '#d97706', icon: '⚠️', label: '⏰ Reserva expirada' };
    }
    
    return { bg: '#f3f4f6', text: '#6b7280', icon: '⚪', label: status.timeLeft };
  };

  const getUniqueMonths = () => {
    const months = orders.map(order => {
      const date = new Date(order.created_at);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    
    const uniqueMonths = [...new Set(months)].sort().reverse();
    
    return [
      { value: 'all', label: '📅 Todos os meses' },
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

  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    
    const orderDate = new Date(order.created_at);
    const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    const monthMatch = monthFilter === 'all' || orderMonth === monthFilter;
    
    let dateMatch = true;
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      dateMatch = orderDateOnly.getTime() === filterDate.getTime();
    }
    
    let searchMatch = true;
if (searchTerm !== '') {
  const searchLower = searchTerm.toLowerCase();
  searchMatch = !!(
    (order.order_code && order.order_code.toLowerCase().includes(searchLower)) ||
    (order.payment_method && order.payment_method.toLowerCase().includes(searchLower)) ||
    (order.pickup_option && order.pickup_option.toLowerCase().includes(searchLower))
  );
}
    
    return statusMatch && monthMatch && dateMatch && searchMatch;
  });

  const ordersForList = filteredOrders.map((order) => {
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
      items_count: items.length,
    };
  });

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'pendente').length;
  const paidOrders = filteredOrders.filter(o => o.status === 'pago').length;
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelado').length;
  const totalValue = ordersForList.reduce((sum, order) => sum + order.total, 0);

  const clearDateFilter = () => {
    setDateFilter('');
  };

  const clearSearch = () => {
    setSearchTerm('');
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16
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
            ← Voltar
          </button>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            📦 Gestão de Pedidos
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginTop: 4,
            margin: 0
          }}>
            Gerencie todos os pedidos da sua loja
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Cards de estatísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
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

      {/* Barra de Pesquisa */}
      <div style={{ 
        background: 'var(--bg-card)', 
        padding: 24, 
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        marginBottom: 24
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            🔍 Pesquisar Pedido:
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código do pedido (ex: VID-1234), forma de pagamento ou opção de retirada..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingLeft: '40px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 14,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
              <span style={{ 
                position: 'absolute', 
                left: 12, 
                top: '50%', 
                transform: 'translateY(-50%)',
                fontSize: 18
              }}>
                🔍
              </span>
            </div>
            {searchTerm && (
              <button
                onClick={clearSearch}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                ❌ Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
              Status do Pedido:
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'all' as const, label: '📋 Todos' },
                { value: 'pendente' as const, label: '🟡 Pendentes' },
                { value: 'pago' as const, label: '🟢 Pagos' },
                { value: 'cancelado' as const, label: '🔴 Cancelados' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  style={{
                    background: statusFilter === value ? '#7c3aed' : 'var(--bg-secondary)',
                    color: statusFilter === value ? 'white' : 'var(--text-primary)',
                    padding: '8px 16px',
                    border: `1px solid ${statusFilter === value ? '#7c3aed' : 'var(--border-color)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                Filtrar por Mês:
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  fontSize: 14,
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              >
                {getUniqueMonths().map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
                Filtrar por Data:
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: 14,
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)'
                  }}
                />
                {dateFilter && (
                  <button
                    onClick={clearDateFilter}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      padding: '10px 12px',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    ❌ Limpar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {ordersForList.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Nenhum pedido encontrado
            </h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 1, background: 'var(--bg-secondary)' }}>
            {ordersForList.map((order, index) => {
              const statusColor = getStatusColor(order.status);
              const reservation = getReservationColor(order.id);
              
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderBottom: index < ordersForList.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr auto auto', 
                    gap: '16px', 
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          🏷️ {order.order_code}
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
                        {/* 🆕 Badge de status da reserva */}
                        <div
                          style={{
                            background: reservation.bg,
                            color: reservation.text,
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <span>{reservation.icon}</span>
                          <span>{reservation.label}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-secondary)' }}>
                        <span><strong>💳 Pagamento:</strong> {order.payment_method}</span>
                        <span><strong>📦 Retirada:</strong> {order.pickup_option}</span>
                        <span><strong>📦 Itens:</strong> {order.items_count}</span>
                        <span><strong>📅 Data:</strong> {new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                        <span><strong>⏰ Hora:</strong> {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {order.observations && (
                        <div style={{ marginTop: 8, fontSize: 13, color: '#f59e0b', background: '#fef3c7', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
                          💬 Obs: {order.observations}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        R$ {order.total.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const message = `Olá! Gostaria de informações sobre o pedido *${order.order_code}*`;
                          window.open(`https://wa.me/5592986446677?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        style={{
                          background: '#25D366',
                          color: 'white',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        📱 WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: 'var(--bg-secondary)', 
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          💡 <strong>Dica:</strong> Clique em qualquer pedido para ver detalhes completos e gerenciar o status.
          {pendingOrders > 0 && ` 🔴 Pedidos pendentes têm reserva de 1 hora.`}
        </p>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersContent />
    </AuthGuard>
  );
}