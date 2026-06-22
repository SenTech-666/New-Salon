// app/layout.tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/theme-provider';

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
    // suppressHydrationWarning — ThemeProvider добавляет класс .dark на
    // <html> через JS после монтирования (читает localStorage), поэтому
    // разметка на сервере и на клиенте до гидратации отличается на один
    // атрибут class. Это ожидаемо и безопасно гасить именно здесь.
    <html lang="ru" suppressHydrationWarning>
      <ClerkProvider>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider>
            {children}
            {/* richColors убран: он перебивал инлайн-приоритетом наши
                кастомные цвета тостов (bp-toast / bp-toast-success /
                bp-toast-error) на странице записи — теперь тосты везде
                подчиняются единой теме графит+медь, а не дефолтной
                зелёной/красной палитре sonner. */}
            <Toaster position="top-center" closeButton duration={5000} />
          </ThemeProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}