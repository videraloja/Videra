import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Jogos de Tabuleiro em Manaus | Board Games — Videra Store",
  description: "Jogos de tabuleiro originais e lacrados para todas as idades. Compre online e retire em Manaus.",
  alternates: {
    canonical: "/jogosdetabuleiro",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Jogos de Tabuleiro", item: `${SITE_URL}/jogosdetabuleiro` },
  ],
};

export default function JogosDeTabuleiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
