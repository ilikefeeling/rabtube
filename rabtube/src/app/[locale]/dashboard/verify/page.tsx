'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { uploadLicenseFile, submitLicenseForReview } from '@/lib/firebaseService';
import { UploadCloud, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { UploadProgress } from '@/types';

const REGIONS = ['서울','경기','인천','부산','대구','광주','대전','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주'];

export default function VerifyPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    hospital: '',
    licenseNumber: '',
    region: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name === '카카오 유저' ? '' : profile.name || '',
        phoneNumber: profile.phoneNumber || '',
        hospital: profile.hospital || '',
        licenseNumber: profile.licenseNumber || '',
        region: profile.region || '',
      });
    }
  }, [profile]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-teal-600" size={32} /></div>;
  }

  if (!user || !profile) {
    router.push('/auth/login');
    return null;
  }

  // 승인된 유저는 메인으로
  if (profile.status === 'approved') {
    router.push('/');
    return null;
  }

  const formatPhoneNumber = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length < 4) return clean;
    if (clean.length < 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    if (clean.length < 11) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
  };

  const handleUpdate = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (k === 'phoneNumber') {
      val = formatPhoneNumber(val);
    }
    setForm(f => ({ ...f, [k]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // 파일 크기 10MB 제한
      if (selected.size > 10 * 1024 * 1024) {
        setError('10MB 이하의 파일만 업로드 가능합니다.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleUpload = async () => {
    const { name, phoneNumber, hospital, licenseNumber, region } = form;
    
    if (!name.trim() || !phoneNumber.trim() || !hospital.trim() || !licenseNumber.trim() || !region) {
      setError('모든 추가 정보를 입력해 주세요.');
      return;
    }

    if (!file) {
      setError('면허증 파일을 첨부해 주세요.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const url = await uploadLicenseFile(file, user.uid, (p: UploadProgress) => {
        setProgress(p.percent);
      });
      
      await submitLicenseForReview(user.uid, url, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        hospital: hospital.trim(),
        licenseNumber: licenseNumber.trim(),
        region
      });
      
      alert('추가 정보 입력 및 면허증 제출이 완료되었습니다.\n관리자 검토 후 정회원으로 승인됩니다.');
      window.location.reload(); // 프로필 상태 갱신을 위해 리로드
    } catch (err: any) {
      setError(err.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="text-teal-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">면허증 인증 및 추가 정보</h1>
          <p className="text-slate-500 text-sm">
            원활한 커뮤니티 활동을 위해<br />아래 정보와 면허증 사본을 등록해 주세요.
          </p>
        </div>

        {profile.status === 'pending' ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
            <CheckCircle className="text-blue-500 mx-auto mb-3" size={32} />
            <h3 className="font-semibold text-blue-800 mb-1">관리자 검토 중입니다</h3>
            <p className="text-blue-600 text-sm">제출하신 정보를 확인 중입니다.<br/>검토는 최대 24시간이 소요될 수 있습니다.</p>
          </div>
        ) : profile.status === 'rejected' ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center mb-6">
            <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
            <h3 className="font-semibold text-red-800 mb-1">인증이 반려되었습니다</h3>
            <p className="text-red-600 text-sm mb-3">{profile.rejectionReason || '면허증 정보가 일치하지 않거나 식별이 어렵습니다.'}</p>
            <p className="text-red-700 font-medium text-sm">아래에서 다시 업로드해 주세요.</p>
          </div>
        ) : null}

        {(profile.status === 'associate' || profile.status === 'rejected') && (
          <div className="space-y-5">
            {/* 추가 정보 입력 폼 */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">이름 (실명)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예) 홍길동"
                  value={form.name}
                  onChange={handleUpdate('name')}
                />
              </div>
              
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">휴대폰 번호</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="예) 010-1234-5678"
                  value={form.phoneNumber}
                  onChange={handleUpdate('phoneNumber')}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">치과의사 면허번호</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예) 12345 (숫자만)"
                  value={form.licenseNumber}
                  onChange={handleUpdate('licenseNumber')}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">병원명</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예) 연세스마일치과"
                  value={form.hospital}
                  onChange={handleUpdate('hospital')}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">지역</label>
                <select 
                  className="select-field" 
                  value={form.region} 
                  onChange={handleUpdate('region')}
                >
                  <option value="">지역을 선택하세요</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <hr className="my-6 border-slate-200" />

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">면허증 사본 첨부</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <UploadCloud className="text-slate-400 mx-auto mb-2" size={28} />
                <p className="text-sm font-medium text-slate-700">
                  {file ? file.name : '면허증 파일 선택 (PDF, JPG, PNG)'}
                </p>
                <p className="text-xs text-slate-400 mt-1">최대 10MB</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-lg">
                <AlertCircle size={14} />{error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-teal-600 text-white font-medium py-3.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  제출 중... {progress}%
                </>
              ) : (
                '작성 완료 및 제출하기'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
