import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import '../globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { NextIntlClientProvider } from 'next-intl';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Rabtube - 치과 케이스 플랫폼',
  description: '치과 개원의를 위한 전문 케이스 영상 커뮤니티',
};

// Force Next.js App Router to generate individual static layouts for both ko and en
export function generateStaticParams() {
  return [{ locale: 'ko' }, { locale: 'en' }];
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Avoid static caching issues with getMessages() by directly importing the correct JSON translation
  let messages;
  try {
    messages = (await import(`../../../messages/${locale || 'ko'}.json`)).default;
  } catch (e) {
    messages = (await import(`../../../messages/ko.json`)).default;
  }

  return (
    <html lang={locale}>
      <body className={`${dmSans.variable} ${dmSerif.variable} font-sans bg-slate-50 text-slate-900`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
