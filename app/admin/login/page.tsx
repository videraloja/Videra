"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            🔐 Acesso Admin
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Painel Administrativo Videra
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
              placeholder="seu@email.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
              placeholder="Sua senha"
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#7c3aed',
              color: 'white',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Entrando...' : '🔐 Entrar'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: '6px',
          border: '1px solid var(--border-color)'
        }}>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '12px',
            textAlign: 'center',
            margin: 0
          }}>
            💡 <strong>Primeiro acesso?</strong><br />
            Configure um usuário no Supabase Authentication
          </p>
        </div>
      </div>
    </div>
  );
}