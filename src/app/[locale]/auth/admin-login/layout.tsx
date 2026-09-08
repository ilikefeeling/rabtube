import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '랩튜브 ㅣ 관리자',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
