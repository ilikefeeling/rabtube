'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/firebaseService';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phoneNumber: '', password: '', hospital: '', region: '', licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length < 4) return clean;
    if (clean.length < 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    if (clean.length < 11) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
  };

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (k === 'phoneNumber') {
      val = formatPhoneNumber(val);
    }
    setForm(f => ({ ...f, [k]: val }));
  };

  const handleRegister = async () => {
    const { name, email, phoneNumber, password, hospital, region, licenseNumber } = form;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedHospital = hospital.trim();
    const trimmedLicense = licenseNumber.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedPassword || !trimmedHospital || !region || !trimmedLicense) {
      setError('모든 항목을 입력해 주세요');
      return;
    }
    if (trimmedPassword.length < 6) { setError('비밀번호는 6자 이상이어야 합니다'); return; }

    const phoneRegex = /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setError('올바른 휴대폰 번호 형식을 입력해 주세요 (예: 010-1234-5678)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // 1. 휴대폰 번호 중복 가입 체크
      const { checkDuplicatePhoneNumber } = await import('@/lib/firebaseService');
      const isDuplicate = await checkDuplicatePhoneNumber(trimmedPhone);
      if (isDuplicate) {
        setError('이미 가입된 휴대폰 번호입니다');
        setLoading(false);
        return;
      }

      // 2. Auth 계정 및 프로필 생성
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      await createUserProfile(cred.user.uid, {
        name: trimmedName,
        email: trimmedEmail,
        phoneNumber: trimmedPhone,
        hospital: trimmedHospital,
        region,
        licenseNumber: trimmedLicense,
      });
      
      alert('회원가입 신청이 완료되었습니다. 관리자 승인 후 서비스 이용이 가능합니다.');
      router.push('/');
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다',
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다',
        'auth/weak-password': '비밀번호가 너무 약합니다',
      };
      setError(msg[e.code] ?? '회원가입 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const REGIONS = ['서울','경기','인천','부산','대구','광주','대전','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주'];

  return (
    <div className="min-h-screen bg-[#0d2137] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-serif text-3xl text-white">RabTube</span>
          <p className="text-slate-400 text-sm mt-2">치과 개원의 전용 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl p-7">
          <h2 className="text-base font-medium text-slate-800 mb-1">회원가입</h2>
          <p className="text-xs text-slate-400 mb-5">치과 면허를 보유한 개원의만 가입 가능합니다</p>

          <div className="space-y-3">
            {[
              { label: '이름 (성명)', key: 'name', placeholder: '홍길동', type: 'text' },
              { label: '이메일', key: 'email', placeholder: 'doctor@example.com', type: 'email' },
              { label: '휴대폰 번호', key: 'phoneNumber', placeholder: '010-1234-5678', type: 'tel' },
              { label: '비밀번호', key: 'password', placeholder: '6자 이상', type: 'password' },
              { label: '병원명', key: 'hospital', placeholder: '예) 연세스마일치과', type: 'text' },
              { label: '치과 면허 번호', key: 'licenseNumber', placeholder: '예) 제12345호', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  className="input-field"
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={update(f.key)}
                />
              </div>
            ))}

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">지역</label>
              <select className="select-field" value={form.region} onChange={update('region')}>
                <option value="">선택하세요</option>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-lg">
                <AlertCircle size={14} />{error}
              </div>
            )}

            {/* Terms notice */}
            <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-400 leading-relaxed">
              가입 시 이용약관 및 케이스 영상은 회원 전용으로 공개되며, 환자 개인정보가 포함된 영상 업로드는 금지됩니다.
            </div>

            <button onClick={handleRegister} disabled={loading} className="btn-primary w-full">
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-5">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-teal-600 font-medium hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
