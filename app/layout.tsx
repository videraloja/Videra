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
import Analytics from './components/Analytics';

import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/siteConfig";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7c3aed',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Videra Store - Pokémon TCG e Board Games em Manaus",
  description: "Sua loja de colecionáveis em Manaus! Pokémon TCG, cartas avulsas, boosters, ETBs, jogos de tabuleiro, acessórios e muito mais. Compre online com segurança.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Videra Store - Pokémon TCG e Board Games em Manaus",
    description: "Produtos lacrados e originais Pokémon, Jogos de Tabuleiro, Acessórios, Hot Wheels. Confira nossos produtos!",
    url: SITE_URL,
    siteName: "Videra Store",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Videra Store - Loja de Pokémon TCG e Board Games",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Videra Store",
    description: "Pokémon TCG, Board Games e Acessórios em Manaus.",
    images: ["/og-image.jpg"],
  },
};

const storeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: 'Videra Store',
  taxID: '58.756.836/0001-09',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  telephone: '+55 92 98644-6677',
  email: 'videraloja@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rua Áurea Graciano, 15, Col. Santo Antônio',
    addressLocality: 'Manaus',
    addressRegion: 'AM',
    postalCode: '69093-045',
    addressCountry: 'BR',
  },
  sameAs: ['https://www.instagram.com/viderastore'],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Videra Store',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Analytics />
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