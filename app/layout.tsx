// app/layout.tsx - ATUALIZADO COM CART PROVIDER
import "./globals.css";
import React from "react";
import FloatingCartButton from "./components/floatingcartbutton";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeEffects } from "./components/ThemeEffects";
import { ThemeEditorProvider } from "./contexts/ThemeEditorContext";
import { PageThemeProvider } from "./contexts/PageThemeContext";
import { CartProvider } from "./contexts/CartContext"; // 🆕 IMPORT DO CART PROVIDER

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
              {/* 🆕 CART PROVIDER ADICIONADO (envolve tudo relacionado ao carrinho) */}
              <CartProvider>
                <PageThemeProvider>
                  <ThemeEffects />
                  <main>{children}</main>
                  {/* 🛠️ FloatingCartButton agora tem acesso ao contexto do carrinho */}
                  <FloatingCartButton />
                  <footer className="site-footer" style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    padding: '20px',
                    textAlign: 'center',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: 'auto'
                  }}>
                    <p style={{ margin: 0 }}>© {new Date().getFullYear()} Videra. Todos os direitos reservados.</p>
                  </footer>
                </PageThemeProvider>
              </CartProvider>
            </ThemeEditorProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}