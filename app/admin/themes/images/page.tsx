'use client';
export default function ThemesImagesPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          🖼️ Gerenciador de Imagens
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Gerencie imagens de capa e backgrounds para cada tema
        </p>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        textAlign: 'center',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
          Sistema de Imagens em Desenvolvimento
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Em breve você poderá fazer upload e gerenciar imagens para cada tema e página.
        </p>
        <button 
          onClick={() => window.history.back()}
          style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}