'use client';

interface Order {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface OrdersListProps {
  orders: Order[];
}

export default function OrdersList({ orders }: OrdersListProps) {
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'pago':
        return {
          bg: '#d1fae5',     // verde claro (fundo)
          text: '#065f46',   // verde escuro (texto)
          border: '#a7f3d0'  // verde borda
        };
      case 'pendente':
        return {
          bg: '#fef9c3',     // amarelo claro (fundo)
          text: '#92400e',   // amarelo escuro (texto)
          border: '#fde68a'  // amarelo borda
        };
      case 'cancelado':
        return {
          bg: '#fee2e2',     // vermelho claro (fundo)
          text: '#991b1b',   // vermelho escuro (texto)
          border: '#fecaca'  // vermelho borda
        };
      default:
        return {
          bg: '#f4f4f5',     // cinza claro (fundo)
          text: '#6b7280',   // cinza escuro (texto)
          border: '#e5e7eb'  // cinza borda
        };
    }
  };

  if (orders.length === 0) return (
    <p style={{
      color: 'var(--text-secondary)',
      textAlign: 'center',
      padding: 20
    }}>
      Nenhum pedido encontrado.
    </p>
  );

  return (
    <div style={{ 
      padding: 24,
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <h1 style={{ 
        fontSize: 24, 
        fontWeight: 700, 
        marginBottom: 16,
        color: 'var(--text-primary)'
      }}>
        📦 Pedidos Recebidos
      </h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {orders.map((order) => {
          const statusColors = getStatusColors(order.status);
          
          return (
            <li
              key={order.id}
              style={{
                border: `1px solid ${statusColors.border}`,
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                background: statusColors.bg,
                boxShadow: 'var(--shadow)',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <p style={{ margin: '4px 0', color: statusColors.text }}>
                <strong>👤 Cliente:</strong> {order.customer_name}
              </p>
              <p style={{ margin: '4px 0', color: statusColors.text }}>
                <strong>💰 Total:</strong> R$ {order.total.toFixed(2)}
              </p>
              <p style={{ margin: '4px 0', color: statusColors.text }}>
                <strong>📅 Data:</strong>{' '}
                {new Date(order.created_at).toLocaleString('pt-BR')}
              </p>
              <p style={{ margin: '4px 0', color: statusColors.text }}>
                <strong>🧾 Status:</strong>{' '}
                <span style={{ 
                  textTransform: 'capitalize',
                  color: statusColors.text,
                  fontWeight: 600
                }}>
                  {order.status}
                </span>
              </p>

              <a
                href={`/admin/orders/${order.id}`}
                style={{
                  color: 'var(--accent-color)',
                  textDecoration: 'none',
                  display: 'inline-block',
                  marginTop: 8,
                  fontWeight: 600
                }}
              >
                🔍 Ver detalhes / editar
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}