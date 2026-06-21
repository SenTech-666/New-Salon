// app/layout.tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Василики • Маникюр в Москве',
  description: 'Премиум маникюр и педикюр в Москве. Онлайн-запись 24/7',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ru">
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            duration={5000}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}