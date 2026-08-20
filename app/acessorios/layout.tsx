import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Acessórios para TCG em Manaus | Sleeves, Deck Box e Playmats — Videra Store",
  description: "Sleeves, deck boxes, playmats e outros acessórios para colecionadores e jogadores de card games. Compre online e retire em Manaus.",
  alternates: {
    canonical: "/acessorios",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Acessórios", item: `${SITE_URL}/acessorios` },
  ],
};

export default function AcessoriosLayout({
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
