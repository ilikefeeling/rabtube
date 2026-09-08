import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // 이메일 회원가입 폼이 완전히 제거되었으며, 카카오 간편가입으로 통일되었습니다.
  // /auth/register 로 접근 시 /auth/login 으로 리다이렉트합니다.
  redirect('/auth/login');
}
