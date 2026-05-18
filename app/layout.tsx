// app/layout.tsx – CORREÇÃO DO ESPAÇO BRANCO (FLEX LAYOUT)
import "./globals.css";
import React from "react";
import FloatingCartButton from "./components/floatingcartbutton";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeEffects } from "./components/ThemeEffects";
import { ThemeEditorProvider } from "./contexts/ThemeEditorContext";
import { PageThemeProvider } from "./contexts/PageThemeContext";
import { CartProvider } from "./contexts/CartContext";
import ConditionalFooter from './components/ConditionalFooter';
import CartExitHandler from './components/CartExitHandler';

export const metadata = {
  title: "Videra Site Oficial - Pokémon TCG e Board Games",
  description: "Sua loja de colecionáveis em Manaus! Pokémon TCG, cartas avulsas, boosters, ETBs, jogos de tabuleiro, acessórios e muito mais. Compre online com segurança.",
  openGraph: {
    title: "Videra Site Oficial - Pokémon TCG e Board Games",
    description: "Produtos lacrados e originais Pokémon, Jogos de Tabuleiro, Acessórios, Hot Wheels. Confira nossos produtos!",
    url: "https://videra-nine.vercel.app",
    siteName: "Videra",
    images: [
      {
        url: "https://videra-nine.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Videra - Loja de Pokémon TCG e Board Games",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Videra Site Oficial",
    description: "Pokémon TCG, Board Games e Acessórios.",
    images: ["https://videra-nine.vercel.app/og-image.jpg"],
  },
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
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <ThemeProvider>
          <AuthProvider>
            <ThemeEditorProvider>
              <CartProvider>
                <PageThemeProvider>
                  <ThemeEffects />
                  {/* Conteúdo principal expande para empurrar o rodapé */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  {children}
</div>
                  <FloatingCartButton />
                  <ConditionalFooter />
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