'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertCircle, ChevronLeft, ChevronDown, ChevronUp, Search, Info, Coins } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { uploadCaseVideo, getCustomMaterials } from '@/lib/firebaseService';
import { getBalance } from '@/lib/pointService';
import { calculateUploadFeeRab } from '@/lib/billingService';
import { generateVideoThumbnails, dataURItoBlob, drawTextOnImage } from '@/lib/videoUtils';
import { DIAGNOSIS_OPTIONS, TECHNIQUE_OPTIONS, MATERIAL_PRESETS } from '@/lib/clinicalPresets';
import { SYSTEMIC_CONDITIONS } from '@/types';
import type { CaseCategory, Difficulty, Visibility, UploadProgress, BoneClassification, PatientAgeRange, SystemicCondition, ClinicalMetadata } from '@/types';

const CATEGORIES: CaseCategory[] = ['임플란트', '보철', '치주', '교정', '보존', '소아', '구강외과'];
const BONE_CLASSES: BoneClassification[] = ['Class I', 'Class II', 'Class III', 'Class IV', '해당없음'];
const PATIENT_AGES: PatientAgeRange[] = ['10대', '20대', '30대', '40대', '50대', '60대', '70대이상'];

export default function UploadPage() {
  const t = useTranslations('Upload');
  const tCat = useTranslations('HomePage');
  const { user, profile } = useAuth();
  const router = useRouter();

  const getCatLabel = (key: string) => {
    switch (key) {
      case '임플란트': return tCat('cat_implant');
      case '보철': return tCat('cat_prosthetics');
      case '치주': return tCat('cat_perio');
      case '교정': return tCat('cat_ortho');
      case '보존': return tCat('cat_cons');
      case '소아': return tCat('cat_pedo');
      case '구강외과': return tCat('cat_surgery');
      default: return key;
    }
  };

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({ phase: 'idle', percent: 0 });

  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<number>(0);
  const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [thumbnailText, setThumbnailText] = useState('');
  const [thumbnailTextSize, setThumbnailTextSize] = useState<'medium' | 'large' | 'xlarge'>('large');
  const [thumbnailTextColor, setThumbnailTextColor] = useState<string>('#FFFFFF');
  const [thumbnailBgColor, setThumbnailBgColor] = useState<string>('rgba(15, 23, 42, 0.85)');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CaseCategory | ''>('');
  const [toothNumber, setToothNumber] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('중급');
  const [visibility, setVisibility] = useState<Visibility>('회원전용');
  const [price, setPrice] = useState<number>(50); // 기본 가격을 50 RAB으로 {t('change')} (0 ~ 10,000 범위)
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  useEffect(() => {
    if (user) {
      getBalance(user.uid).then(b => {
        if (b) setUserBalance(b.balance);
      }).catch(console.error);
    }
  }, [user]);

  // 치아 번호 선택형 관련 State
  const [isToothModalOpen, setIsToothModalOpen] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [toothTab, setToothTab] = useState<'permanent' | 'deciduous'>('permanent');

  // Clinical State
  const [isClinicalOpen, setIsClinicalOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState<string[]>([]);
  const [technique, setTechnique] = useState<string[]>([]);
  
  // 사용 재료 선택형 관련 State
  const [customMaterialsList, setCustomMaterialsList] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [materialSearch, setMaterialSearch] = useState('');

  const filteredMaterials = customMaterialsList.filter(m => m.toLowerCase().includes(materialSearch.toLowerCase()));

  const [boneClassification, setBoneClassification] = useState<BoneClassification | ''>('');
  const [patientAge, setPatientAge] = useState<PatientAgeRange | ''>('');
  const [patientGender, setPatientGender] = useState<'남' | '여' | ''>('');
  const [systemicConditions, setSystemicConditions] = useState<SystemicCondition[]>([]);

  // 팝업 면책동의 State
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // 재료 목록 불러오기
  useEffect(() => {
    getCustomMaterials().then(list => setCustomMaterialsList(list)).catch(console.error);
  }, []);

  // 영상 파일 {t('change')} 시 썸네일 추출
  useEffect(() => {
    if (file) {
      setIsGeneratingThumbnails(true);
      generateVideoThumbnails(file).then(urls => {
        setThumbnails(urls);
        setIsGeneratingThumbnails(false);
        setSelectedThumbnailIndex(0);
        setCustomThumbnail(null);
      });
    } else {
      setThumbnails([]);
      setCustomThumbnail(null);
    }
  }, [file]);

  // {t('tooth_btn')} 토글
  const toggleTooth = (t: string) => {
    if (selectedTeeth.includes(t)) {
      setSelectedTeeth(selectedTeeth.filter(item => item !== t));
    } else {
      setSelectedTeeth([...selectedTeeth, t]);
    }
  };

  // 재료 선택 토글
  const toggleMaterial = (m: string) => {
    if (selectedMaterials.includes(m)) {
      setSelectedMaterials(selectedMaterials.filter(item => item !== m));
    } else {
      setSelectedMaterials([...selectedMaterials, m]);
    }
  };

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
    accept: { 
      'video/mp4': ['.mp4'], 
      'video/quicktime': ['.mov'], 
      'video/webm': ['.webm'], 
      'video/x-msvideo': ['.avi'] 
    },
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (!file) {
      alert('동영상 파일을 선택해 주세요.');
      return;
    }
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!profile) {
      alert('원장님의 프로필 정보를 불러오는 중입니다. 잠시만 기다려 주세요.');
      return;
    }
    if (!title.trim()) {
      alert('케이스 제목을 입력해 주세요.');
      return;
    }
    if (!category) {
      alert('케이스 카테고리를 선택해 주세요.');
      return;
    }
    if (!consentAgreed) {
      alert(`${t('policy_modal_title')}에 동의해 주세요.`);
      return;
    }
    if (price < 0 || price > 10000) {
      alert('열람 가격은 0 RAB에서 10,000 RAB 사이여야 합니다.');
      return;
    }

    const uploadFee = calculateUploadFeeRab(price);
    if (userBalance < uploadFee) {
      alert(`업로드 수수료(${uploadFee.toLocaleString()} RAB)를 결제하기 위한 잔액이 부족합니다.\n현재 잔액: ${userBalance.toLocaleString()} RAB\n\n먼저 포인트를 충전해 주세요.`);
      return;
    }

    setIsSubmitting(true);
    setProgress({ phase: 'uploading', percent: 0 });

    let thumbnailFile: Blob | File | null = null;
    
    try {
      const overlayOptions = {
        textSize: thumbnailTextSize,
        textColor: thumbnailTextColor,
        bgColor: thumbnailBgColor
      };

      if (selectedThumbnailIndex === 3 && customThumbnail) {
        if (thumbnailText.trim()) {
          const customUrl = URL.createObjectURL(customThumbnail);
          const mergedDataUri = await drawTextOnImage(customUrl, thumbnailText, overlayOptions);
          URL.revokeObjectURL(customUrl);
          thumbnailFile = dataURItoBlob(mergedDataUri);
        } else {
          thumbnailFile = customThumbnail;
        }
      } else if (thumbnails[selectedThumbnailIndex]) {
        let sourceImage = thumbnails[selectedThumbnailIndex];
        if (thumbnailText.trim()) {
          sourceImage = await drawTextOnImage(sourceImage, thumbnailText, overlayOptions);
        }
        thumbnailFile = dataURItoBlob(sourceImage);
      }
    } catch (err) {
      console.warn("Failed to overlay subtitle on thumbnail, fallback to original", err);
      if (selectedThumbnailIndex === 3 && customThumbnail) {
        thumbnailFile = customThumbnail;
      } else if (thumbnails[selectedThumbnailIndex]) {
        thumbnailFile = dataURItoBlob(thumbnails[selectedThumbnailIndex]);
      }
    }

    try {
      const clinical: any = {
        diagnosis,
        technique,
        materials: selectedMaterials,
        systemicConditions,
      };
      if (boneClassification) clinical.boneClassification = boneClassification;
      if (patientAge) clinical.patientAge = patientAge;
      if (patientGender) clinical.patientGender = patientGender;

      const hasClinicalData = diagnosis.length > 0 || technique.length > 0 || selectedMaterials.length > 0 || boneClassification || patientAge || patientGender || systemicConditions.length > 0;

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
        thumbnailFile,
        (p) => setProgress(p)
      );

      setTimeout(() => router.push('/my'), 1500);
    } catch (e: any) {
      setProgress({ phase: 'error', percent: 0, error: e.message });
      setIsSubmitting(false);
    }
  };

  const isUploading = progress.phase === 'uploading' || progress.phase === 'processing' || isSubmitting;
  const isDone = progress.phase === 'done';
  const isError = progress.phase === 'error';

  return (
    <div className="min-h-screen bg-slate-50">
      <style dangerouslySetInnerHTML={{ __html: `
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}} />
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ChevronLeft size={14} />{t('back_to_feed')}
        </Link>

        <div className="card p-6">
          <h1 className="text-lg font-medium text-slate-800 mb-1">{t('title')}</h1>
          <p className="text-xs text-slate-400 mb-6">{t('subtitle')}</p>

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
                {isDragActive ? t('drop_here') : t('drop_or_click')}
              </p>
              <p className="text-xs text-slate-400">{t('file_limits')}</p>
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
                  <button onClick={() => setFile(null)} className="text-xs text-slate-400 hover:text-slate-600">{t('change')}</button>
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
                      {isDone ? t('done') : isError ? progress.error : t('uploading', { percent: progress.percent })}
                    </p>
                    {isDone && <CheckCircle size={14} className="text-teal-500" />}
                    {isError && <AlertCircle size={14} className="text-red-400" />}
                  </div>
                </div>
              )}

              {/* Thumbnail Selection */}
              <div className="mt-4 border-t border-slate-100 pt-4">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-2">
                  {t('thumbnail_sel')}
                </label>
                {isGeneratingThumbnails ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    {t('thumbnail_extracting')}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {thumbnails.map((url, i) => (
                        <div 
                          key={i} 
                          className={`relative w-32 h-20 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedThumbnailIndex === i ? 'border-teal-500 shadow-md' : 'border-transparent'}`}
                          onClick={() => setSelectedThumbnailIndex(i)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Thumbnail ${i+1}`} className="w-full h-full object-cover" />
                          {selectedThumbnailIndex === i && (
                            <div className="absolute top-1 right-1 bg-teal-500 rounded-full p-0.5">
                              <CheckCircle size={14} className="text-white" />
                            </div>
                          )}
                          {thumbnailText.trim() && (
                            <div 
                              className="absolute bottom-1 inset-x-1 rounded px-1.5 py-0.5 text-center truncate pointer-events-none z-20"
                              style={
                                thumbnailBgColor === 'none'
                                  ? { background: 'none', filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.9))' }
                                  : { background: thumbnailBgColor }
                              }
                            >
                              <span 
                                style={{ color: thumbnailTextColor }}
                                className={`font-bold leading-none ${
                                  thumbnailTextSize === 'medium'
                                    ? 'text-[8px]'
                                    : thumbnailTextSize === 'large'
                                    ? 'text-[10px]'
                                    : 'text-[12px]'
                                }`}
                              >
                                {thumbnailText}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <label className={`relative w-32 h-20 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 ${selectedThumbnailIndex === 3 ? 'border-teal-500 bg-teal-50 shadow-md ring-2 ring-teal-200' : 'border-teal-300 bg-teal-50/30 hover:border-teal-400 hover:bg-teal-50 hover:shadow-inner'}`}>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCustomThumbnail(e.target.files[0]);
                            setSelectedThumbnailIndex(3);
                          }
                        }} disabled={isUploading || isDone} />
                        {customThumbnail ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={URL.createObjectURL(customThumbnail)} alt="Custom" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            <div className="absolute z-10 flex flex-col items-center drop-shadow-md">
                              <CheckCircle size={16} className="text-teal-600 mb-1" fill="white" />
                              <span className="text-[10px] font-medium text-slate-800 bg-white/80 px-1.5 rounded">직접 업로드됨</span>
                            </div>
                            {thumbnailText.trim() && (
                              <div 
                                className="absolute bottom-1 inset-x-1 rounded px-1.5 py-0.5 text-center truncate pointer-events-none z-20"
                                style={
                                  thumbnailBgColor === 'none'
                                    ? { background: 'none', filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.9))' }
                                    : { background: thumbnailBgColor }
                                }
                              >
                                <span 
                                  style={{ color: thumbnailTextColor }}
                                  className={`font-bold leading-none ${
                                    thumbnailTextSize === 'medium'
                                      ? 'text-[8px]'
                                      : thumbnailTextSize === 'large'
                                      ? 'text-[10px]'
                                      : 'text-[12px]'
                                  }`}
                                >
                                  {thumbnailText}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="group flex flex-col items-center transition-transform hover:-translate-y-0.5">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 group-hover:shadow group-hover:bg-teal-200 transition-all duration-300">
                              <Upload size={16} className="text-teal-600" />
                            </div>
                            <span className="text-[11px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200 shadow-sm whitespace-nowrap">
                              {t('custom_upload')}
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <label className="text-[10px] font-medium text-slate-500 block">
                        {t('thumb_text_label')}
                      </label>
                      <input
                        type="text"
                        maxLength={18}
                        className="input-field py-1 text-xs"
                        placeholder={t("thumb_text_ph")}
                        value={thumbnailText}
                        onChange={e => setThumbnailText(e.target.value)}
                        disabled={isUploading || isDone}
                      />
                      
                      {thumbnailText.trim() && (
                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* {t('text_size')} */}
                          <div>
                            <label className="text-[9px] font-medium text-slate-400 block mb-1">{t('text_size')}</label>
                            <select
                              value={thumbnailTextSize}
                              onChange={e => setThumbnailTextSize(e.target.value as any)}
                              className="select-field py-0.5 px-1.5 text-[10px] h-7 bg-white border border-slate-200 rounded-lg w-full"
                              disabled={isUploading || isDone}
                            >
                              <option value="medium">{t('size_med')}</option>
                              <option value="large">{t('size_lrg')}</option>
                              <option value="xlarge">매우 {t('size_lrg')}</option>
                            </select>
                          </div>

                          {/* {t('text_color')} */}
                          <div>
                            <label className="text-[9px] font-medium text-slate-400 block mb-1">{t('text_color')}</label>
                            <div className="flex gap-1.5 h-7 items-center justify-center bg-white px-2 rounded-lg border border-slate-200 w-full">
                              {[
                                { name: '흰색', value: '#FFFFFF', bg: 'bg-white border border-slate-300' },
                                { name: '노랑', value: '#FFEB3B', bg: 'bg-yellow-300' },
                                { name: '검정', value: '#000000', bg: 'bg-black' }
                              ].map(c => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => setThumbnailTextColor(c.value)}
                                  className={`w-4 h-4 rounded-full transition-transform ${c.bg} ${thumbnailTextColor === c.value ? 'scale-125 ring-2 ring-teal-500' : 'hover:scale-110'}`}
                                  title={c.name}
                                />
                              ))}
                            </div>
                          </div>

                          {/* {t('bg_box')} */}
                          <div>
                            <label className="text-[9px] font-medium text-slate-400 block mb-1">{t('bg_box')}</label>
                            <select
                              value={thumbnailBgColor}
                              onChange={e => setThumbnailBgColor(e.target.value)}
                              className="select-field py-0.5 px-1.5 text-[10px] h-7 bg-white border border-slate-200 rounded-lg w-full"
                              disabled={isUploading || isDone}
                            >
                              <option value="rgba(15, 23, 42, 0.85)">{t('bg_dark')}</option>
                              <option value="rgba(220, 38, 38, 0.85)">{t('bg_red')}</option>
                              <option value="rgba(30, 64, 175, 0.85)">{t('bg_blue')}</option>
                              <option value="none">{t('bg_none')}</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* iOS Upload Notice */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <h3 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-1.5">
              <AlertCircle size={16} /> {t('iphone_notice_title')}
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              아이폰 카메라의 기본 설정(고효율)으로 촬영한 영상은 윈도우 PC 환경에서 재생되지 않을 수 있습니다.<br />
              가장 빠른 업로드 속도와 완벽한 호환성을 위해 <strong>[설정] ➔ [카메라] ➔ [포맷]</strong> 에서 <strong>&apos;높은 호환성&apos;</strong>으로 설정 후 촬영하시기를 강력히 권장드립니다.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                  {t('cat_label')}
                </label>
                <select
                  value={category}
                  onChange={e => handleCategoryChange(e.target.value as CaseCategory | '')}
                  className="select-field"
                  disabled={isUploading || isDone}
                >
                  <option value="">선택하세요</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{getCatLabel(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                  {t('tooth_label')}
                </label>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="선택 버튼을 클릭하세요"
                    value={toothNumber}
                    onChange={e => setToothNumber(e.target.value)}
                    disabled={isUploading || isDone}
                  />
                  <button
                    type="button"
                    onClick={() => setIsToothModalOpen(true)}
                    disabled={isUploading || isDone}
                    className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {t('tooth_btn')}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                {t('title_label')}
              </label>
              <input
                className="input-field"
                placeholder={t("title_ph")}
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                {t('desc_label')}
              </label>
              <textarea
                className="input-field resize-none"
                rows={4}
                placeholder={t("desc_ph")}
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                {t('tag_label')}
              </label>
              <input
                className="input-field"
                placeholder={t("tag_ph")}
                value={tags}
                onChange={e => setTags(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('vis_label')}</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Visibility)}
                  className="input-field w-full"
                  disabled={isUploading || isDone}
                >
                  <option value="전체공개">{t('vis_pub')}</option>
                  <option value="회원전용">{t('vis_mem')}</option>
                  <option value="비공개">{t('vis_priv')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {t('price_label')}
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setPrice(p => Math.max(0, p - 10))}
                    disabled={isUploading || isDone || price <= 0}
                    className="px-3.5 py-2 border border-slate-200 rounded-l-xl bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    -10
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      step="10"
                      value={price}
                      onChange={(e) => {
                        let v = Number(e.target.value);
                        if (v < 0) v = 0;
                        if (v > 10000) v = 10000;
                        setPrice(v);
                      }}
                      className="input-field text-center rounded-none border-x-0 w-full pr-16 font-bold"
                      disabled={isUploading || isDone}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full pointer-events-none shadow-sm animate-pulse">
                      <Coins size={11} className="text-amber-500 shrink-0" />
                      <span className="text-[9px] font-extrabold text-amber-600 tracking-wider">
                        RAB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrice(p => Math.min(10000, p + 10))}
                    disabled={isUploading || isDone || price >= 10000}
                    className="px-3.5 py-2 border border-slate-200 rounded-r-xl bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    +10
                  </button>
                </div>
                <div className="mt-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[12px] font-semibold text-amber-900 flex items-center gap-1.5">
                      <Info size={14} className="text-amber-600" /> {t('price_range_title')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-amber-200 text-amber-700 rounded-md shadow-sm">
                      0 ~ 10,000 RAB
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-amber-700/80">{t('price_step')}</span>
                      <span className="font-medium text-amber-900 bg-amber-100/50 px-1.5 py-0.5 rounded text-[10px]">10 RAB씩 {t('change')} 가능</span>
                    </div>
                    <div className="h-px bg-amber-200/60 my-0.5 w-full"></div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-amber-800 font-bold text-[12px]">{t('upload_fee')}</span>
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-200 shadow-sm">
                        <Coins size={14} className="text-amber-500" />
                        <span className="font-extrabold text-amber-600 text-[14px]">
                          {calculateUploadFeeRab(price).toLocaleString()} <span className="text-[10px]">RAB</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('diff_label')}</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as Difficulty)}
                  className="input-field w-full"
                  disabled={isUploading || isDone}
                >
                  <option>{t('diff_beg')}</option>
                  <option>{t('diff_int')}</option>
                  <option>{t('diff_adv')}</option>
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
              {t('clinical_btn')}
              {isClinicalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <p className="text-[11px] text-slate-400 mt-1">{t('clinical_desc')}</p>
            
            {isClinicalOpen && (
              <div className="mt-4 space-y-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">{t('diag_label')}</label>
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
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">{t('tech_label')}</label>
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
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                    {t('mat_label')}
                  </label>
                  
                  {/* 검색 필터 */}
                  <div className="relative mb-2">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="input-field pl-7 py-1 text-xs"
                      placeholder={t("mat_ph")}
                      value={materialSearch}
                      onChange={e => setMaterialSearch(e.target.value)}
                      disabled={isUploading || isDone}
                    />
                  </div>

                  {/* 재료 선택 칩 그리드 */}
                  <div className="max-h-36 overflow-y-auto border border-slate-200 p-2.5 rounded-lg bg-white">
                    {filteredMaterials.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {filteredMaterials.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => toggleMaterial(m)}
                            disabled={isUploading || isDone}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                              selectedMaterials.includes(m)
                                ? 'bg-teal-50 border-teal-500 text-teal-700 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 text-center py-2">
                        {t('mat_empty')}
                      </p>
                    )}
                  </div>
                  
                  {selectedMaterials.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-500">
                      {t('mat_selected')}<span className="font-semibold text-teal-600">{selectedMaterials.join(', ')}</span>
                    </div>
                  )}
                </div>

                {(category === '임플란트' || category === '치주') && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">{t('bone_label')}</label>
                    <select className="select-field" value={boneClassification} onChange={e => setBoneClassification(e.target.value as BoneClassification)} disabled={isUploading || isDone}>
                      <option value="">{t('no_select')}</option>
                      {BONE_CLASSES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">{t('age_label')}</label>
                    <select className="select-field" value={patientAge} onChange={e => setPatientAge(e.target.value as PatientAgeRange)} disabled={isUploading || isDone}>
                      <option value="">{t('no_select')}</option>
                      {PATIENT_AGES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">{t('gender_label')}</label>
                    <select className="select-field" value={patientGender} onChange={e => setPatientGender(e.target.value as '남' | '여')} disabled={isUploading || isDone}>
                      <option value="">{t('no_select')}</option>
                      <option value="남">{t('gender_m')}</option>
                      <option value="여">{t('gender_f')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">{t('sys_label')}</label>
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                {t('policy_title').replace('*', '')} <span className="text-red-500">*</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(true)}
                className="text-[11px] font-medium text-teal-600 hover:text-teal-700 underline flex items-center gap-1"
              >
                <Info size={12} /> {t('size_lrg')} 자세히 보기
              </button>
            </div>
            
            <div
              onClick={() => setIsPolicyModalOpen(true)}
              className="h-28 overflow-y-auto bg-slate-100 border border-slate-200/80 rounded-xl p-3 text-[11px] leading-relaxed text-slate-500 space-y-2.5 cursor-pointer hover:bg-slate-200/60 transition-colors"
            >
              <div>
                <p className="font-semibold text-slate-700">제1조 (환자 개인정보 보호의 의무)</p>
                <p className="mt-0.5">업로더(Uploader)는 업로드하는 임상 영상/이미지 내에 환자의 성명, 생년월일, 연락처, 특정 병원명, 환자 안면 등 식별이 가능한 모든 개인정보가 노출되지 않도록 완전히 비식별화(모자이크 또는 블러 처리)해야 합니다. 이를 해태하여 발생하는 모든 개인정보 관련 민형사상 법적 분쟁 및 행정 책임은 업로더에게 전적으로 귀책됩니다. [클릭하여 {t('size_lrg')} 보기]</p>
              </div>
            </div>

            <div 
              onClick={() => {
                if (!isUploading && !isDone) setConsentAgreed(!consentAgreed);
              }}
              className={`flex items-start gap-2.5 p-2 -ml-2 rounded-lg cursor-pointer transition-colors ${isUploading || isDone ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${consentAgreed ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'}`}>
                {consentAgreed && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium select-none">
                <span dangerouslySetInnerHTML={{ __html: t('policy_agree_text').replace('(필수)', '<span class="text-red-500">(필수)</span>') }} />
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-50">
            <Link href="/" className="btn-secondary flex-1 text-center">{t('btn_cancel')}</Link>
            <button
              onClick={handleSubmit}
              disabled={!file || !title || !category || !consentAgreed || isUploading || isDone}
              className="btn-primary flex-1"
            >
              {isDone ? `✓ ${t('btn_done')}` : isUploading ? (progress.percent > 0 ? t('uploading', { percent: progress.percent }) : t('btn_submitting')) : t('btn_submit')}
            </button>
          </div>
        </div>
      </main>

      {/* {t('tooth_btn')} 모달 */}
      {isToothModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-800">{t('tooth_modal_title')}</h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setToothTab('permanent')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    toothTab === 'permanent'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('tooth_perm')}
                </button>
                <button
                  type="button"
                  onClick={() => setToothTab('deciduous')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    toothTab === 'deciduous'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t('tooth_dec')}
                </button>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mb-4 bg-slate-50 py-1.5 rounded-lg">
              {t('tooth_note')}
            </div>

            <div className="space-y-6">
              {toothTab === 'permanent' ? (
                <div className="grid grid-rows-2 gap-4">
                  {/* 상악 */}
                  <div className="border-b border-dashed border-slate-200 pb-4">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 text-center uppercase tracking-wide">{t('tooth_max')}</p>
                    <div className="flex justify-center gap-1">
                      {/* 상악 우측 */}
                      <div className="flex gap-0.5">
                        {['18', '17', '16', '15', '14', '13', '12', '11'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTooth(t)}
                            className={`w-7 h-9 text-[11px] font-semibold rounded-md border flex items-center justify-center transition-colors ${
                              selectedTeeth.includes(t)
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="w-px bg-slate-300 mx-1" />
                      {/* 상악 좌측 */}
                      <div className="flex gap-0.5">
                        {['21', '22', '23', '24', '25', '26', '27', '28'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTooth(t)}
                            className={`w-7 h-9 text-[11px] font-semibold rounded-md border flex items-center justify-center transition-colors ${
                              selectedTeeth.includes(t)
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 하악 */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 text-center uppercase tracking-wide">{t('tooth_man')}</p>
                    <div className="flex justify-center gap-1">
                      {/* 하악 우측 */}
                      <div className="flex gap-0.5">
                        {['48', '47', '46', '45', '44', '43', '42', '41'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTooth(t)}
                            className={`w-7 h-9 text-[11px] font-semibold rounded-md border flex items-center justify-center transition-colors ${
                              selectedTeeth.includes(t)
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="w-px bg-slate-300 mx-1" />
                      {/* 하악 좌측 */}
                      <div className="flex gap-0.5">
                        {['31', '32', '33', '34', '35', '36', '37', '38'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTooth(t)}
                            className={`w-7 h-9 text-[11px] font-semibold rounded-md border flex items-center justify-center transition-colors ${
                              selectedTeeth.includes(t)
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-rows-2 gap-4">
                  {/* 유치 상악 */}
                  <div className="border-b border-dashed border-slate-200 pb-4">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 text-center uppercase tracking-wide">{t('tooth_max')}</p>
                    <div className="flex justify-center gap-1">
                      <div className="flex gap-0.5">
                        {['55', '54', '53', '52', '51'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTooth(t)}
                            className={`w-9 h-9 text-[11px] font-semibold rounded-md border flex items-center justify-center transition-colors ${
                              selectedTeeth.includes(t)
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="w-px bg-slate-300 mx-1" />
                      <div className="flex gap-0.5">
                        {['61', '62', '63', '64', '65'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTooth(t)}
                            className={`w-9 h-9 text-[11px] font-semibold rounded-md border flex items-center justify-center transition-colors ${
                              selectedTeeth.includes(t)
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 유치 하악 */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 text-center uppercase tracking-wide">{t('tooth_man')}</p>
                    <div className="flex justify-center gap-1">
                      <div className="flex gap-0.5">
                        {['85', '84', '83', '82', '81'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTooth(t)}
                            className={`w-9 h-9 text-[11px] font-semibold rounded-md border flex items-center justify-center transition-colors ${
                              selectedTeeth.includes(t)
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="w-px bg-slate-300 mx-1" />
                      <div className="flex gap-0.5">
                        {['71', '72', '73', '74', '75'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTooth(t)}
                            className={`w-9 h-9 text-[11px] font-semibold rounded-md border flex items-center justify-center transition-colors ${
                              selectedTeeth.includes(t)
                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 text-xs text-slate-500">
              선택된 치아: <span className="font-semibold text-teal-600">{selectedTeeth.length > 0 ? selectedTeeth.map(t => `#${t}`).join(', ') : '없음'}</span>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setToothNumber(selectedTeeth.map(t => `#${t}`).join(', '));
                  setIsToothModalOpen(false);
                }}
                className="btn-primary flex-1 py-2 text-sm"
              >
                {t('tooth_sel_done')}
              </button>
              <button
                type="button"
                onClick={() => setIsToothModalOpen(false)}
                className="btn-secondary flex-1 py-2 text-sm"
              >
                {t('btn_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 면책 동의 및 약관 팝업 모달 */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
              {t('policy_modal_title')}
            </h3>
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-slate-600">
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">제1조 (환자 개인정보 보호의 의무)</p>
                <p>업로더(Uploader)는 업로드하는 임상 영상/이미지 내에 환자의 성명, 생년월일, 연락처, 특정 병원명, 환자 안면 등 식별이 가능한 모든 개인정보가 노출되지 않도록 완전히 비식별화(모자이크 또는 블러 처리)해야 합니다. 이를 해태하여 발생하는 모든 개인정보 관련 민형사상 법적 분쟁 및 행정 책임은 업로더에게 전적으로 귀책됩니다.</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">제2조 (저작권 및 적법성 인증)</p>
                <p>업로더는 업로드하는 모든 임상 데이터의 정당한 소유권자이거나, 제3자 배포 및 유료 조회 서비스 제공(RAB 정산)에 대한 적법한 권한이 있음을 보증합니다. 타인의 지식재산권을 무단으로 침해하는 등의 행위로 발생하는 저작권 분쟁 및 민원은 업로더의 책임 하에 면책 없이 해결해야 합니다.</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">제3조 (서비스 운영자 면책)</p>
                <p>RabTube(서비스 운영자)는 업로더가 제공한 임상 자료의 정확성, 안전성, 의학적 적합성 및 소유권 여부에 대해 보증을 제공하지 않습니다. 본 서비스에 게시된 케이스 자료 활용 및 실제 임상 적용으로 인해 발생하는 결과 및 손해에 대해 운영자는 일체의 책임을 부담하지 않고 면책됩니다.</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">제4조 (운영 권한 및 위반 제재)</p>
                <p>환자 개인정보 침해, 타인의 권리 침해, 또는 기타 불법적인 게시물임이 신고되거나 인지될 경우, 운영자는 사전 고지 없이 즉시 해당 게시물을 {t('vis_priv')} 또는 삭제 조치할 수 있으며, 이와 관련해 지급 예정이었던 모든 RAB 포인트 보상 및 정산은 전면 {t('btn_cancel')} 및 몰수될 수 있습니다.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setConsentAgreed(true);
                  setIsPolicyModalOpen(false);
                }}
                className="btn-primary flex-1 py-2 text-sm"
              >
                {t('policy_btn_agree')}
              </button>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="btn-secondary flex-1 py-2 text-sm"
              >
                {t('policy_btn_close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
