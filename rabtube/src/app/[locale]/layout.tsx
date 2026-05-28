import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import '../globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { NextIntlClientProvider } from 'next-intl';
import ClientAppLayout from '@/components/layout/ClientAppLayout';

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
  title: '랩튜브 | 잠자는 임상 영상이 원장님의 새로운 수익으로',
  description: '하드디스크에 쌓인 치과 임상 영상, AI로 편집하고 수익화하세요. 전국의 치과의사들과 노하우를 나누며 새로운 가치를 창출합니다.',
  openGraph: {
    title: '랩튜브 | 잠자는 임상 영상이 원장님의 새로운 수익으로',
    description: '하드디스크에 쌓인 치과 임상 영상, AI로 편집하고 수익화하세요. 전국의 치과의사들과 노하우를 나누며 새로운 가치를 창출합니다.',
    url: 'https://www.rabtube.com',
    siteName: 'Rabtube (랩튜브)',
    images: [
      {
        url: 'https://www.rabtube.com/images/og-image-dental.png',
        width: 1200,
        height: 630,
        alt: '치과의사를 위한 임상 영상 수익화 플랫폼, 랩튜브',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '랩튜브 | 잠자는 임상 영상이 원장님의 새로운 수익으로',
    description: '하드디스크에 쌓인 치과 임상 영상, AI로 편집하고 수익화하세요. 전국의 치과의사들과 노하우를 나누며 새로운 가치를 창출합니다.',
    images: ['https://www.rabtube.com/images/og-image-dental.png'],
  },
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
      <body suppressHydrationWarning className={`${dmSans.variable} ${dmSerif.variable} font-sans bg-slate-50 text-slate-900`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ClientAppLayout>
              {children}
            </ClientAppLayout>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
