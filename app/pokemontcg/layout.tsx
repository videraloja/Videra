import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Pokémon TCG em Manaus | Boosters, ETB e Booster Box — Videra Store",
  description: "Cartas avulsas, boosters, ETBs e booster boxes de Pokémon TCG originais e lacrados. Compre online e retire em Manaus.",
  alternates: {
    canonical: "/pokemontcg",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Pokémon TCG", item: `${SITE_URL}/pokemontcg` },
  ],
};

export default function PokemonTcgLayout({
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
