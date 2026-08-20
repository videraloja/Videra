import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Hot Wheels em Manaus | Miniaturas e Colecionáveis — Videra Store",
  description: "Miniaturas e carrinhos Hot Wheels originais e lacrados. Compre online e retire em Manaus.",
  alternates: {
    canonical: "/hotwheels",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Hot Wheels", item: `${SITE_URL}/hotwheels` },
  ],
};

export default function HotWheelsLayout({
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
