import "./globals.css";
import { Inter, Tiro_Devanagari_Hindi } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const tiro = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-tiro",
});

export const metadata = {
  title: "Bhu-Rekha | Intelligent Land Record Digitization System",
  description:
    "AI-assisted digitization and verification of legacy land records — Ministry of Rural Development, Government of India.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${tiro.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
