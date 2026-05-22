'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertCircle, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { uploadCaseVideo } from '@/lib/firebaseService';
import { DIAGNOSIS_OPTIONS, TECHNIQUE_OPTIONS, MATERIAL_PRESETS } from '@/lib/clinicalPresets';
import { SYSTEMIC_CONDITIONS } from '@/types';
import type { CaseCategory, Difficulty, Visibility, UploadProgress, BoneClassification, PatientAgeRange, SystemicCondition, ClinicalMetadata } from '@/types';

const CATEGORIES: CaseCategory[] = ['임플란트', '보철', '치주', '교정', '보존', '소아', '구강외과'];
const BONE_CLASSES: BoneClassification[] = ['Class I', 'Class II', 'Class III', 'Class IV', '해당없음'];
const PATIENT_AGES: PatientAgeRange[] = ['10대', '20대', '30대', '40대', '50대', '60대', '70대이상'];

export default function UploadPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({ phase: 'idle', percent: 0 });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CaseCategory | ''>('');
  const [toothNumber, setToothNumber] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('중급');
  const [visibility, setVisibility] = useState<Visibility>('회원전용');
  const [price, setPrice] = useState<number>(5);
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Clinical State
  const [isClinicalOpen, setIsClinicalOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string[]>([]);
  const [technique, setTechnique] = useState<string[]>([]);
  const [materials, setMaterials] = useState('');
  const [boneClassification, setBoneClassification] = useState<BoneClassification | ''>('');
  const [patientAge, setPatientAge] = useState<PatientAgeRange | ''>('');
  const [patientGender, setPatientGender] = useState<'남' | '여' | ''>('');
  const [systemicConditions, setSystemicConditions] = useState<SystemicCondition[]>([]);

  const handleCategoryChange = (cat: CaseCategory | '') => {
    setCategory(cat);
    setDiagnosis([]);
    setTechnique([]);
  };

  const toggleMultiSelect = <T extends string>(val: T, list: T[], setList: (l: T[]) => void) => {
    if (list.includes(val)) setList(list.filter(item => item !== val));
    else setList([...list, val]);
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] },
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (!file || !title || !category || !user || !profile || !consentAgreed) return;

    setProgress({ phase: 'uploading', percent: 0 });

    try {
      const clinical: ClinicalMetadata = {
        diagnosis,
        technique,
        materials: materials.split(',').map(m => m.trim()).filter(Boolean),
        boneClassification: boneClassification || undefined,
        patientAge: patientAge || undefined,
        patientGender: patientGender || undefined,
        systemicConditions,
      };

      const hasClinicalData = diagnosis.length > 0 || technique.length > 0 || clinical.materials.length > 0 || boneClassification || patientAge || patientGender || systemicConditions.length > 0;

      await uploadCaseVideo(
        file,
        user.uid,
        {
          title,
          description,
          category: category as CaseCategory,
          toothNumber,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          difficulty: difficulty as Difficulty,
          visibility: visibility as Visibility,
          price,
          clinical: hasClinicalData ? clinical : undefined,
          consentAgreed,
        },
        profile,
        (p) => setProgress(p)
      );

      setTimeout(() => router.push('/my'), 1500);
    } catch (e: any) {
      setProgress({ phase: 'error', percent: 0, error: e.message });
    }
  };

  const isUploading = progress.phase === 'uploading' || progress.phase === 'processing';
  const isDone = progress.phase === 'done';
  const isError = progress.phase === 'error';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ChevronLeft size={14} />피드로 돌아가기
        </Link>

        <div className="card p-6">
          <h1 className="text-lg font-medium text-slate-800 mb-1">케이스 영상 업로드</h1>
          <p className="text-xs text-slate-400 mb-6">치료 케이스를 동료 원장님들과 공유해 주세요</p>

          {/* Dropzone */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6 ${
                isDragActive
                  ? 'border-teal-400 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-3xl text-blue-400 mb-3 flex justify-center">
                <Upload size={36} />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {isDragActive ? '파일을 여기에 놓으세요' : '영상 파일을 드래그하거나 클릭하여 선택'}
              </p>
              <p className="text-xs text-slate-400">MP4, MOV, AVI, WebM · 최대 2GB</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Upload size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                {!isUploading && !isDone && (
                  <button onClick={() => setFile(null)} className="text-xs text-slate-400 hover:text-slate-600">변경</button>
                )}
              </div>

              {/* Progress */}
              {(isUploading || isDone || isError) && (
                <div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${isDone ? 'bg-teal-500' : isError ? 'bg-red-400' : 'bg-teal-500'}`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      {isDone ? '업로드 완료!' : isError ? progress.error : `${progress.percent}% 업로드 중...`}
                    </p>
                    {isDone && <CheckCircle size={14} className="text-teal-500" />}
                    {isError && <AlertCircle size={14} className="text-red-400" />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                  케이스 카테고리 *
                </label>
                <select
                  value={category}
                  onChange={e => handleCategoryChange(e.target.value as CaseCategory | '')}
                  className="select-field"
                  disabled={isUploading || isDone}
                >
                  <option value="">선택하세요</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                  치아 번호
                </label>
                <input
                  className="input-field"
                  placeholder="예) #16, #26"
                  value={toothNumber}
                  onChange={e => setToothNumber(e.target.value)}
                  disabled={isUploading || isDone}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                케이스 제목 *
              </label>
              <input
                className="input-field"
                placeholder="예) 상악 구치부 임플란트 즉시 식립 케이스"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                케이스 설명
              </label>
              <textarea
                className="input-field resize-none"
                rows={4}
                placeholder="케이스 특이사항, 사용 재료, 핵심 포인트를 기록해 주세요"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                태그 (쉼표로 구분)
              </label>
              <input
                className="input-field"
                placeholder="예) 즉시식립, 골이식, GBR"
                value={tags}
                onChange={e => setTags(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">공개 범위</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Visibility)}
                  className="input-field w-full"
                  disabled={isUploading || isDone}
                >
                  <option value="전체공개">전체 공개</option>
                  <option value="회원전용">회원 전용</option>
                  <option value="비공개">비공개</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">열람 가격 (RAB)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="input-field w-full pr-12"
                    placeholder="0"
                    disabled={isUploading || isDone}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">
                    RAB
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">난이도</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as Difficulty)}
                  className="input-field w-full"
                  disabled={isUploading || isDone}
                >
                  <option>초급</option>
                  <option>중급</option>
                  <option>고급</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clinical Metadata (Accordion) */}
          <div className="mt-6 border-t border-slate-50 pt-5">
            <button 
              className="w-full flex items-center justify-between text-sm font-medium text-slate-800 focus:outline-none"
              onClick={() => setIsClinicalOpen(!isClinicalOpen)}
              disabled={isUploading || isDone}
            >
              상세 임상 정보 입력 (선택)
              {isClinicalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <p className="text-[11px] text-slate-400 mt-1">상세 정보를 입력하면 다른 원장님들이 유사 케이스로 검색하기 쉬워집니다.</p>
            
            {isClinicalOpen && (
              <div className="mt-4 space-y-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">진단명 (복수 선택)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {category ? DIAGNOSIS_OPTIONS[category as CaseCategory].map(d => (
                      <button
                        key={d}
                        onClick={() => toggleMultiSelect(d, diagnosis, setDiagnosis)}
                        disabled={isUploading || isDone}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${diagnosis.includes(d) ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'}`}
                      >
                        {d}
                      </button>
                    )) : <p className="text-xs text-slate-400 py-1.5">카테고리를 먼저 선택해주세요.</p>}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">시술/테크닉 (복수 선택)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {category ? TECHNIQUE_OPTIONS[category as CaseCategory].map(t => (
                      <button
                        key={t}
                        onClick={() => toggleMultiSelect(t, technique, setTechnique)}
                        disabled={isUploading || isDone}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${technique.includes(t) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                      >
                        {t}
                      </button>
                    )) : <p className="text-xs text-slate-400 py-1.5">카테고리를 먼저 선택해주세요.</p>}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">사용 재료 (쉼표로 구분)</label>
                  <input type="text" className="input-field" placeholder="예: Osstem, Bio-Oss" value={materials} onChange={e => setMaterials(e.target.value)} disabled={isUploading || isDone} />
                  {category && <p className="text-[10px] text-slate-400 mt-1 truncate">추천: {MATERIAL_PRESETS[category as CaseCategory].join(', ')}</p>}
                </div>

                {(category === '임플란트' || category === '치주') && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">골분류 (Misch)</label>
                    <select className="select-field" value={boneClassification} onChange={e => setBoneClassification(e.target.value as BoneClassification)} disabled={isUploading || isDone}>
                      <option value="">선택 안함</option>
                      {BONE_CLASSES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">환자 연령대</label>
                    <select className="select-field" value={patientAge} onChange={e => setPatientAge(e.target.value as PatientAgeRange)} disabled={isUploading || isDone}>
                      <option value="">선택 안함</option>
                      {PATIENT_AGES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">환자 성별</label>
                    <select className="select-field" value={patientGender} onChange={e => setPatientGender(e.target.value as '남' | '여')} disabled={isUploading || isDone}>
                      <option value="">선택 안함</option>
                      <option value="남">남성</option>
                      <option value="여">여성</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">전신질환 (복수 선택)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SYSTEMIC_CONDITIONS.map(sc => (
                      <button
                        key={sc}
                        onClick={() => toggleMultiSelect(sc, systemicConditions, setSystemicConditions)}
                        disabled={isUploading || isDone}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${systemicConditions.includes(sc) ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'}`}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Legal Liability Consent Box */}
          <div className="mt-6 border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              임상 케이스 업로드 정책 및 면책 동의 <span className="text-red-500">*</span>
            </h3>
            
            <div className="h-32 overflow-y-auto bg-slate-100 border border-slate-200/80 rounded-xl p-3 text-[11px] leading-relaxed text-slate-500 space-y-2.5">
              <div>
                <p className="font-semibold text-slate-700">제1조 (환자 개인정보 보호의 의무)</p>
                <p className="mt-0.5">업로더(Uploader)는 업로드하는 임상 영상/이미지 내에 환자의 성명, 생년월일, 연락처, 특정 병원명, 환자 안면 등 식별이 가능한 모든 개인정보가 노출되지 않도록 완전히 비식별화(모자이크 또는 블러 처리)해야 합니다. 이를 해태하여 발생하는 모든 개인정보 관련 민형사상 법적 분쟁 및 행정 책임은 업로더에게 전적으로 귀책됩니다.</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-700">제2조 (저작권 및 적법성 인증)</p>
                <p className="mt-0.5">업로더는 업로드하는 모든 임상 데이터의 정당한 소유권자이거나, 제3자 배포 및 유료 조회 서비스 제공(RAB 정산)에 대한 적법한 권한이 있음을 보증합니다. 타인의 지식재산권을 무단으로 침해하는 등의 행위로 발생하는 저작권 분쟁 및 민원은 업로더의 책임 하에 면책 없이 해결해야 합니다.</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-700">제3조 (서비스 운영자 면책)</p>
                <p className="mt-0.5">RabTube(서비스 운영자)는 업로더가 제공한 임상 자료의 정확성, 안전성, 의학적 적합성 및 소유권 여부에 대해 보증을 제공하지 않습니다. 본 서비스에 게시된 케이스 자료 활용 및 실제 임상 적용으로 인해 발생하는 결과 및 손해에 대해 운영자는 일체의 책임을 부담하지 않고 면책됩니다.</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-700">제4조 (운영 권한 및 위반 제재)</p>
                <p className="mt-0.5">환자 개인정보 침해, 타인의 권리 침해, 또는 기타 불법적인 게시물임이 신고되거나 인지될 경우, 운영자는 사전 고지 없이 즉시 해당 게시물을 비공개 또는 삭제 조치할 수 있으며, 이와 관련해 지급 예정이었던 모든 RAB 포인트 보상 및 정산은 전면 취소 및 몰수될 수 있습니다.</p>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                disabled={isUploading || isDone}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50 cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-medium group-hover:text-slate-800 transition-colors">
                위 임상 케이스 업로드 정책 및 법적 책임/면책 조건을 충분히 이해하였으며, 이에 전적으로 동의합니다. <span className="text-red-500">(필수)</span>
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-50">
            <Link href="/" className="btn-secondary flex-1 text-center">취소</Link>
            <button
              onClick={handleSubmit}
              disabled={!file || !title || !category || !consentAgreed || isUploading || isDone}
              className="btn-primary flex-1"
            >
              {isDone ? '✓ 업로드 완료' : isUploading ? `${progress.percent}% 업로드 중...` : '업로드 시작'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
