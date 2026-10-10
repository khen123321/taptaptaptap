import type { Metadata } from "next";
import { ConnectHub } from "@/components/connect/ConnectHub";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.taptaptap.shop"),
  title: "TapTapTap Connect | Smart NFC Hub",
  description:
    "Quick access to TapTapTap products, custom NFC designs, official contact channels, and business links.",
  alternates: {
    canonical: "/connect",
  },
  openGraph: {
    title: "TapTapTap Connect",
    description:
      "TapTapTap's official smart NFC destination for products, custom designs, and contact options.",
    url: "/connect",
    siteName: "TapTapTap",
    type: "website",
    images: [
      {
        url: "/images/branding/taptaptap-logo-light.jpg",
        width: 1200,
        height: 1200,
        alt: "TapTapTap logo",
      },
    ],
  },
};

export default function ConnectPage() {
  return <ConnectHub variant="main" />;
}
