import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CPMS - Campus Placement Management System',
  description: 'Streamline your campus placement process with our comprehensive management system',
  keywords: ['campus placement', 'recruitment', 'students', 'companies', 'jobs'],
  authors: [{ name: 'CPMS Team' }],
  openGraph: {
    title: 'CPMS - Campus Placement Management System',
    description: 'Streamline your campus placement process',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <main className="min-h-screen bg-background text-foreground">
          {children}
        </main>
      </body>
    </html>
  );
}
