import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/contexts/AuthContext";
import Navbar from "@/components/common/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouthConnect Africa | Connect. Discover. Grow.",
  description: "The premier platform connecting African youth with campus stories, gigs, and opportunities across the continent.",
  keywords: "student opportunities Kenya, campus life Africa, youth gigs Africa, African youth platform",
  icons: {
    icon: [
      { url: "/images/logo/favicon.ico", sizes: "any" },
      { url: "/images/logo/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/images/logo/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-[#FFF8E7]">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 py-6 mt-12">
            <div className="container-custom text-center text-gray-600 text-sm">
              <p>Powered by YouthConnect Africa (YCA) © {new Date().getFullYear()}</p>
              <p className="text-xs mt-1">Connecting African Youth to Opportunities</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}