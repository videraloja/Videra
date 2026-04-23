// app/layout.tsx - FOOTER COM HORÁRIO + MOBILE LADO A LADO
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
  title: "Videra Colecionáveis - Pokémon TCG e Board Games",
  description: "Sua loja de colecionáveis em Manaus! Pokémon TCG, cartas avulsas, boosters, ETBs, jogos de tabuleiro, acessórios e muito mais. Compre online com segurança.",
  openGraph: {
    title: "Videra Colecionáveis",
    description: "Pokémon TCG, Board Games e Acessórios em Manaus. Confira nossas ofertas!",
    url: "https://videra-nine.vercel.app",
    siteName: "Videra Colecionáveis",
    images: [
      {
        url: "https://videra-nine.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Videra Colecionáveis - Loja de Pokémon TCG e Board Games",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Videra Colecionáveis",
    description: "Pokémon TCG, Board Games e Acessórios em Manaus.",
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