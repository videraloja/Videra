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