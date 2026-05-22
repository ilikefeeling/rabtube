'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '@/components/Header';
import SearchResultCard from '@/components/SearchResultCard';
import VideoPlayer from '@/components/VideoPlayer';
import { getAllCasesForSearch } from '@/lib/firebaseService';
import { searchCases, SearchQuery, MatchResult } from '@/lib/searchService';
import { DIAGNOSIS_OPTIONS, TECHNIQUE_OPTIONS, MATERIAL_PRESETS } from '@/lib/clinicalPresets';
import type { CaseVideo, CaseCategory, BoneClassification, PatientAgeRange, SystemicCondition } from '@/types';
import { SYSTEMIC_CONDITIONS } from '@/types';

const CATEGORIES: CaseCategory[] = ['임플란트', '보철', '치주', '교정', '보존', '소아', '구강외과'];
const BONE_CLASSES: BoneClassification[] = ['Class I', 'Class II', 'Class III', 'Class IV', '해당없음'];
const PATIENT_AGES: PatientAgeRange[] = ['10대', '20대', '30대', '40대', '50대', '60대', '70대이상'];

export default function SearchPage() {
  const [mode, setMode] = useState<'clinical' | 'keyword'>('clinical');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CaseVideo | null>(null);

  // Query State
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<CaseCategory | ''>('');
  const [toothNumber, setToothNumber] = useState('');
  const [diagnosis, setDiagnosis] = useState<string[]>([]);
  const [technique, setTechnique] = useState<string[]>([]);
  const [materials, setMaterials] = useState(''); // comma separated string for input
  const [boneClassification, setBoneClassification] = useState<BoneClassification | ''>('');
  const [patientAge, setPatientAge] = useState<PatientAgeRange | ''>('');
  const [patientGender, setPatientGender] = useState<'남' | '여' | ''>('');
  const [systemicConditions, setSystemicConditions] = useState<SystemicCondition[]>([]);

  const handleSearch = async () => {
    setLoading(true);
    setResults(null);

    try {
      const qCategory = category;
      const allCases = await getAllCasesForSearch(qCategory || undefined);
      
      const query: SearchQuery = {
        mode,
        keyword,
        category: qCategory,
        toothNumber,
        diagnosis,
        technique,
        materials: materials.split(',').map(m => m.trim()).filter(Boolean),
        boneClassification,
        patientAge,
        patientGender,
        systemicConditions,
      };

      const matched = searchCases(allCases, query);
      setResults(matched);
      setIsAdvancedOpen(false); // 검색 후 필터 닫기
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleMultiSelect = (val: string, list: string[], setList: (l: any) => void) => {
    if (list.includes(val)) {
      setList(list.filter(item => item !== val));
    } else {
      setList([...list, val]);
    }
  };

  const handleCategoryChange = (cat: CaseCategory | '') => {
    setCategory(cat);
    // 카테고리 변경 시 종속 필드 초기화
    setDiagnosis([]);
    setTechnique([]);
  };

  const showBoneClassification = category === '임플란트' || category === '치주';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Search size={24} className="text-teal-600" />
            케이스 검색
          </h1>
          <div className="flex bg-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setMode('clinical')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === 'clinical' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              임상 조건 매칭
            </button>
            <button
              onClick={() => setMode('keyword')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === 'keyword' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              키워드 검색
            </button>
          </div>
        </div>

        {/* 검색 패널 */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={mode === 'clinical' ? "키워드 추가 필터 (선택)" : "검색어를 입력하세요 (예: 임플란트 뼈이식)"}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            </div>
            <button onClick={handleSearch} disabled={loading} className="btn-primary py-2.5 px-6">
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>

          {mode === 'clinical' && (
            <div>
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors py-2"
              >
                <SlidersHorizontal size={16} />
                임상 조건 상세 필터
                {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isAdvancedOpen && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* 카테고리 & 치아 */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">진료 분야</label>
                      <select className="select-field" value={category} onChange={e => handleCategoryChange(e.target.value as CaseCategory)}>
                        <option value="">모든 분야</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">치아 번호</label>
                      <input type="text" className="input-field" placeholder="예: #16, #26, 상악" value={toothNumber} onChange={e => setToothNumber(e.target.value)} />
                    </div>
                  </div>

                  {/* 진단 & 테크닉 */}
                  <div className="space-y-4 lg:col-span-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">진단명 (복수 선택)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {category ? DIAGNOSIS_OPTIONS[category as CaseCategory].map(d => (
                          <button
                            key={d}
                            onClick={() => toggleMultiSelect(d, diagnosis, setDiagnosis)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${diagnosis.includes(d) ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'}`}
                          >
                            {d}
                          </button>
                        )) : <p className="text-xs text-slate-400 py-1.5">진료 분야를 먼저 선택해주세요.</p>}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">시술 / 테크닉 (복수 선택)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {category ? TECHNIQUE_OPTIONS[category as CaseCategory].map(t => (
                          <button
                            key={t}
                            onClick={() => toggleMultiSelect(t, technique, setTechnique)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${technique.includes(t) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                          >
                            {t}
                          </button>
                        )) : <p className="text-xs text-slate-400 py-1.5">진료 분야를 먼저 선택해주세요.</p>}
                      </div>
                    </div>
                  </div>

                  {/* 재료 & 환자 */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">사용 재료</label>
                      <input type="text" className="input-field" placeholder="예: Osstem, Bio-Oss" value={materials} onChange={e => setMaterials(e.target.value)} />
                      {category && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate">추천: {MATERIAL_PRESETS[category as CaseCategory].join(', ')}</p>
                      )}
                    </div>
                    {showBoneClassification && (
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">골분류 (Misch)</label>
                        <select className="select-field" value={boneClassification} onChange={e => setBoneClassification(e.target.value as BoneClassification)}>
                          <option value="">상관없음</option>
                          {BONE_CLASSES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">환자 연령대</label>
                        <select className="select-field" value={patientAge} onChange={e => setPatientAge(e.target.value as PatientAgeRange)}>
                          <option value="">상관없음</option>
                          {PATIENT_AGES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">환자 성별</label>
                        <select className="select-field" value={patientGender} onChange={e => setPatientGender(e.target.value as '남' | '여')}>
                          <option value="">상관없음</option>
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
                            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${systemicConditions.includes(sc) ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'}`}
                          >
                            {sc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* 검색 결과 */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-video bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-sm font-medium text-slate-500">일치하는 케이스를 찾지 못했습니다</p>
            <p className="text-xs mt-1">검색 조건을 변경해 보세요</p>
          </div>
        ) : results && results.length > 0 ? (
          <div>
            <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
              검색 결과 <span className="font-bold text-teal-600">{results.length}</span>건
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {results.map(r => (
                <SearchResultCard key={r.video.id} result={r} onClick={setSelectedVideo} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="text-5xl mb-4 opacity-50">🦷</div>
            <p className="text-sm font-medium text-slate-500">내 환자와 비슷한 케이스를 찾아보세요</p>
          </div>
        )}
      </main>

      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
