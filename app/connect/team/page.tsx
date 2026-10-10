import type { Metadata } from "next";
import { ConnectTeam } from "@/components/connect/ConnectTeam";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.taptaptap.shop"),
  title: "Meet the Team | TapTapTap",
  description:
    "Meet the people behind TapTapTap and the team helping build smarter business connections.",
  alternates: {
    canonical: "/connect/team",
  },
  openGraph: {
    title: "Meet the Team | TapTapTap",
    description:
      "Meet the people behind TapTapTap and the team helping build smarter business connections.",
    url: "/connect/team",
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

export default function ConnectTeamPage() {
  return <ConnectTeam />;
}
