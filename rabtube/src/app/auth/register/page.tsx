'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, checkDuplicateCI } from '@/lib/firebaseService';
import { AlertCircle, ChevronRight, ChevronLeft, CheckCircle, User, Lock } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: 본인인증 정보
  const [identity, setIdentity] = useState({
    name: '',
    birthdate: '',
    phone: '',
  });

  // Step 2: 계정 정보
  const [account, setAccount] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    licenseNumber: '',
    hospital: '',
    region: '',
  });

  const updateIdentity = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setIdentity(f => ({ ...f, [k]: e.target.value }));

  const updateAccount = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAccount(f => ({ ...f, [k]: e.target.value }));

  const handleStep1Next = () => {
    const { name, birthdate, phone } = identity;
    if (!name || !birthdate || !phone) {
      setError('모든 항목을 입력해 주세요');
      return;
    }
    if (birthdate.length !== 8 || isNaN(Number(birthdate))) {
      setError('생년월일을 8자리 숫자로 입력해 주세요 (예: 19850312)');
      return;
    }
    if (phone.length < 10) {
      setError('올바른 휴대폰 번호를 입력해 주세요');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRegister = async () => {
    const { email, password, passwordConfirm, licenseNumber, hospital, region } = account;

    if (!email || !password || !licenseNumber || !hospital || !region) {
      setError('모든 항목을 입력해 주세요');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Firebase Auth 계정 생성
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Firestore 프로필 생성 (ASSOCIATE 상태)
      await createUserProfile(cred.user.uid, {
        name: identity.name,
        email,
        hospital,
        region,
        licenseNumber,
        birthdate: identity.birthdate,
        phone: identity.phone,
        verifiedName: identity.name,  // 본인인증 확인 이름 (추후 PASS API 연동 시 대체)
      });

      // 가입 완료 → 메인으로 (LicenseGate가 면허 업로드를 안내)
      router.push('/');
    } catch (e: any) {
      console.error('Registration error:', e);
      const msg: Record<string, string> = {
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다',
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다',
        'auth/weak-password': '비밀번호가 너무 약합니다',
      };
      setError(msg[e.code] ?? `회원가입 중 오류가 발생했습니다 (${e.code || e.message})`);
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
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? 'text-teal-600' : 'text-slate-300'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                step > 1 ? 'bg-teal-600 border-teal-600 text-white' : step === 1 ? 'border-teal-600 text-teal-600' : 'border-slate-200 text-slate-400'
              }`}>
                {step > 1 ? <CheckCircle size={12} /> : '1'}
              </div>
              본인 확인
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? 'text-teal-600' : 'text-slate-300'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                step === 2 ? 'border-teal-600 text-teal-600' : 'border-slate-200 text-slate-400'
              }`}>
                2
              </div>
              계정 생성
            </div>
          </div>

          {/* ── Step 1: 본인 확인 ── */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-teal-600" />
                <h2 className="text-base font-bold text-slate-800">본인 확인</h2>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                가입 시 입력한 이름은 면허 검증 과정에서 대조됩니다.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">이름 (실명)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="홍길동"
                    value={identity.name}
                    onChange={updateIdentity('name')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">생년월일 (8자리)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="19850312"
                    maxLength={8}
                    value={identity.birthdate}
                    onChange={updateIdentity('birthdate')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">휴대폰 번호</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="01012345678"
                    value={identity.phone}
                    onChange={updateIdentity('phone')}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-lg">
                    <AlertCircle size={14} />{error}
                  </div>
                )}

                <button onClick={handleStep1Next} className="btn-primary w-full flex items-center justify-center gap-1.5">
                  다음 단계 <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: 계정 생성 ── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Lock size={16} className="text-teal-600" />
                <h2 className="text-base font-bold text-slate-800">계정 생성</h2>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                이메일과 비밀번호를 설정하고, 치과 면허 정보를 입력해 주세요.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">이메일</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="doctor@example.com"
                    value={account.email}
                    onChange={updateAccount('email')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">비밀번호</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="6자 이상"
                    value={account.password}
                    onChange={updateAccount('password')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">비밀번호 확인</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="비밀번호 재입력"
                    value={account.passwordConfirm}
                    onChange={updateAccount('passwordConfirm')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">치과 면허 번호</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="예) 제12345호"
                    value={account.licenseNumber}
                    onChange={updateAccount('licenseNumber')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">병원명</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="예) 연세스마일치과"
                    value={account.hospital}
                    onChange={updateAccount('hospital')}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">지역</label>
                  <select className="select-field" value={account.region} onChange={updateAccount('region')}>
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
                  가입 시 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다. 
                  가입 후 면허증 서류를 제출하시면 관리자 검토 후 정회원으로 승인됩니다.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep(1); setError(''); }}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1"
                  >
                    <ChevronLeft size={16} /> 이전
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? '가입 중...' : '가입하기'}
                  </button>
                </div>
              </div>
            </>
          )}

          <p className="text-xs text-slate-400 text-center mt-5">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-teal-600 font-medium hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
