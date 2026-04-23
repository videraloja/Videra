// app/components/ConditionalFooter.tsx
'use client';

import { usePathname } from 'next/navigation';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Lista de rotas onde o footer NÃO deve aparecer
  const hideFooterRoutes = ['/cart'];
  
  if (hideFooterRoutes.includes(pathname)) {
    return null;
  }

  // Retorna o footer completo (o mesmo que estava no layout)
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      marginTop: 'auto',
      padding: '48px 20px 32px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '32px',
        textAlign: 'center'
      }}>
        {/* 1. Endereço */}
        <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'var(--primary-color)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '24px',
            opacity: 0.9
          }}>📍</div>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
            Rua Áurea Graciano, 15 - Col. Santo Antônio<br />
            Manaus - AM, 69093-045
          </p>
        </div>

        {/* 2. Horário de funcionamento */}
        <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'var(--primary-color)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '24px',
            opacity: 0.9
          }}>🕒</div>
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <p style={{ margin: 0 }}><strong>Segunda</strong> 8h – 21h</p>
            <p style={{ margin: 0 }}><strong>Terça</strong> 8h – 18h</p>
            <p style={{ margin: 0 }}><strong>Quarta</strong> 8h – 21h</p>
            <p style={{ margin: 0 }}><strong>Quinta</strong> 8h – 18h</p>
            <p style={{ margin: 0 }}><strong>Sexta</strong> 8h – 18h</p>
            <p style={{ margin: 0 }}><strong>Sábado</strong> 8h – 13h</p>
            <p style={{ margin: 0, opacity: 0.7 }}><strong>Domingo</strong> Fechado</p>
          </div>
        </div>

        {/* 3. WhatsApp */}
        <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
          <a href="https://wa.me/5592986446677" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#25D366',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: '28px',
              transition: 'transform 0.2s ease'
            }}>💬</div>
            <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>(92) 98644-6677</span>
          </a>
        </div>

        {/* 4. Instagram */}
        <div style={{ flex: '1 1 180px', minWidth: '140px' }}>
          <a href="https://www.instagram.com/videra_lojavirtual?igsh=bzBoYmFpanVvM2N5" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(45deg, #f09433, #d62976, #962fbf)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: '28px',
              transition: 'transform 0.2s ease'
            }}>📷</div>
            <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>@videra_lojavirtual</span>
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div style={{
        textAlign: 'center',
        marginTop: '56px',
        paddingTop: '24px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        opacity: 0.7
      }}>
        © {new Date().getFullYear()} Videra Colecionáveis. Todos os direitos reservados.
      </div>
    </footer>
  );
}