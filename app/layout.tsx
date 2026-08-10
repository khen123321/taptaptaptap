import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://taptaptap.ph"),
  title: "TapTapTap | Smart NFC Products",
  description:
    "Ready-to-use NFC products for reviews, social media, menus, websites, business cards, and custom business solutions.",
  openGraph: {
    title: "TapTapTap | Smart NFC Products",
    description:
      "Ready-to-use NFC products for reviews, social media, menus, websites, business cards, and custom business solutions.",
    type: "website",
    images: [
      {
        url: "/images/branding/taptaptap-logo.jpg",
        width: 1254,
        height: 1254,
        alt: "TapTapTap logo",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  var savedTheme = localStorage.getItem("taptaptap-theme");
  document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
} catch (error) {
  document.documentElement.dataset.theme = "light";
}
`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
