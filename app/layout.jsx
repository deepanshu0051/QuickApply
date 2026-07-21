import { Inter } from "next/font/google";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "QuickApply - AI-Powered Job Matching",
  description: "Upload your resume and find perfectly matched jobs instantly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
