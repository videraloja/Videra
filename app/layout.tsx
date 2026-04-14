// app/layout.tsx - FOOTER BONITÃO (endereço + WhatsApp + Instagram)
import "./globals.css";
import React from "react";
import FloatingCartButton from "./components/floatingcartbutton";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeEffects } from "./components/ThemeEffects";
import { ThemeEditorProvider } from "./contexts/ThemeEditorContext";
import { PageThemeProvider } from "./contexts/PageThemeContext";
import { CartProvider } from "./contexts/CartContext";
import CartExitHandler from './components/CartExitHandler';

export const metadata = {
  title: "Videra",
  description: "Loja oficial da Videra — Playmats e produtos Pokémon TCG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <ThemeProvider>
          <AuthProvider>
            <ThemeEditorProvider>
              <CartProvider>
                <PageThemeProvider>
                  <ThemeEffects />
                  <main>{children}</main>
                  <FloatingCartButton />

                  {/* 🌟 FOOTER BONITÃO */}
                  <footer style={{
                    background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: 'auto',
                    padding: '48px 20px 32px',
                  }}>
                    <div style={{
                      maxWidth: '1000px',
                      margin: '0 auto',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '48px',
                      textAlign: 'center'
                    }}>
                      {/* Endereço */}
                      <div style={{
                        flex: '1',
                        minWidth: '200px',
                      }}>
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
                        }}>
                          📍
                        </div>
                        <p style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: 'var(--text-secondary)',
                          margin: 0
                        }}>
                          Rua Áurea Graciano, 15 - Col. Santo Antônio<br />
                          Manaus - AM, 69093-045
                        </p>
                      </div>

                      {/* WhatsApp */}
                      <div style={{
                        flex: '1',
                        minWidth: '200px',
                      }}>
                        <a
                          href="https://wa.me/559986446677"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            textDecoration: 'none',
                            display: 'block'
                          }}
                        >
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
                          }}>
                            💬
                          </div>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: '500',
                            color: 'var(--text-primary)'
                          }}>
                            (92) 98644-6677
                          </span>
                        </a>
                      </div>

                      {/* Instagram */}
                      <div style={{
                        flex: '1',
                        minWidth: '200px',
                      }}>
                        <a
                          href="https://www.instagram.com/videra_lojavirtual?igsh=bzBoYmFpanVvM2N5"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            textDecoration: 'none',
                            display: 'block'
                          }}
                        >
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
                          }}>
                            📷
                          </div>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: '500',
                            color: 'var(--text-primary)'
                          }}>
                            @videra_lojavirtual
                          </span>
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

                </PageThemeProvider>
                <CartExitHandler />
              </CartProvider>
            </ThemeEditorProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}