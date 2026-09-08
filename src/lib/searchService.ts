import { CaseVideo, CaseCategory, BoneClassification, PatientAgeRange } from '@/types';

export interface SearchQuery {
  mode: 'clinical' | 'keyword';
  keyword?: string; // used for keyword mode, or as a fallback/additional filter in clinical mode

  category?: CaseCategory | '';
  toothNumber?: string;
  diagnosis?: string[];
  technique?: string[];
  materials?: string[];
  boneClassification?: BoneClassification | '';
  patientAge?: PatientAgeRange | '';
  patientGender?: '남' | '여' | '';
  systemicConditions?: string[];
}

export interface MatchResult {
  video: CaseVideo;
  score: number;       // 0 ~ 100
  matchDetails: {
    toothScore: number;
    diagnosisScore: number;
    techniqueScore: number;
    materialScore: number;
    patientScore: number;
    keywordScore: number;
    isFallback: boolean;
  };
}

// 2자리 치아 번호 추출 (11~48, 51~85)
function extractToothNumbers(input: string): number[] {
  const matches = input.match(/\b([1-4][1-8]|[5-8][1-5])\b/g);
  return matches ? matches.map(Number) : [];
}

// 치아 위치 매칭 점수 계산 (0 ~ 1)
function calculateToothMatch(qTeeth: number[], cTeeth: number[]): number {
  if (qTeeth.length === 0 || cTeeth.length === 0) return 0;

  let maxScore = 0;
  for (const q of qTeeth) {
    for (const c of cTeeth) {
      if (q === c) {
        maxScore = Math.max(maxScore, 1.0);
      } else if (Math.floor(q / 10) === Math.floor(c / 10)) {
        // Same quadrant
        if (Math.abs(q - c) === 1) {
          maxScore = Math.max(maxScore, 0.5); // Adjacent
        } else {
          maxScore = Math.max(maxScore, 0.25); // Same quadrant
        }
      }
    }
  }
  return maxScore;
}

// Jaccard Similarity (0 ~ 1)
function jaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  const intersection = new Set(arr1.filter(x => set2.has(x)));
  const unionSize = set1.size + set2.size - intersection.size;
  if (unionSize === 0) return 0;
  return intersection.size / unionSize;
}

// 텍스트 기반 키워드 매칭 점수 (0 ~ 1)
function calculateKeywordMatch(keyword: string, text: string): number {
  if (!keyword || !text) return 0;
  const k = keyword.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(k)) return 1.0;
  
  // 형태소 분리 없이 단순 띄어쓰기 기준 부분 매치
  const terms = k.split(' ').filter(Boolean);
  let matchCount = 0;
  for (const term of terms) {
    if (t.includes(term)) matchCount++;
  }
  return terms.length > 0 ? matchCount / terms.length : 0;
}

export function calculateMatchScore(query: SearchQuery, video: CaseVideo): MatchResult {
  const details = {
    toothScore: 0,
    diagnosisScore: 0,
    techniqueScore: 0,
    materialScore: 0,
    patientScore: 0,
    keywordScore: 0,
    isFallback: false,
  };

  let totalScore = 0;

  if (query.mode === 'keyword') {
    // 키워드 검색 모드
    if (!query.keyword) {
      return { video, score: 0, matchDetails: details };
    }
    
    let matchLevel = 0;
    const searchableText = [
      video.title,
      video.description,
      ...(video.tags || []),
      video.clinical?.diagnosis?.join(' '),
      video.clinical?.technique?.join(' '),
      video.clinical?.materials?.join(' ')
    ].filter(Boolean).join(' ');

    matchLevel = calculateKeywordMatch(query.keyword, searchableText);
    details.keywordScore = matchLevel * 100;
    totalScore = details.keywordScore;
    
  } else {
    // 임상 매칭 모드
    if (!video.clinical) {
      // Fallback: 임상 데이터가 없는 기존 케이스는 키워드로 대체 매칭
      details.isFallback = true;
      const searchableText = [video.title, video.description, ...(video.tags || [])].join(' ');
      
      const termsToSearch = [
        ...(query.diagnosis || []),
        ...(query.technique || []),
        ...(query.materials || []),
        query.boneClassification,
        query.patientAge,
        query.patientGender,
        ...(query.systemicConditions || []),
        query.keyword
      ].filter(Boolean).join(' ');

      if (termsToSearch) {
        details.keywordScore = calculateKeywordMatch(termsToSearch, searchableText) * 50; // Fallback은 최대 50점
        totalScore = details.keywordScore;
      }
    } else {
      // 치아 위치 (30%)
      if (query.toothNumber && video.toothNumber) {
        const qTeeth = extractToothNumbers(query.toothNumber);
        const cTeeth = extractToothNumbers(video.toothNumber);
        details.toothScore = calculateToothMatch(qTeeth, cTeeth) * 30;
      }

      // 진단 유사도 (25%)
      if (query.diagnosis && query.diagnosis.length > 0) {
        details.diagnosisScore = jaccardSimilarity(query.diagnosis, video.clinical.diagnosis || []) * 25;
      } else {
        details.diagnosisScore = 25; // 질의에 없으면 만점 처리하여 패널티 없앰
      }

      // 시술 유사도 (20%)
      if (query.technique && query.technique.length > 0) {
        details.techniqueScore = jaccardSimilarity(query.technique, video.clinical.technique || []) * 20;
      } else {
        details.techniqueScore = 20;
      }

      // 골상태/재료 (15%)
      let materialPoints = 0;
      let totalMaterialQueries = 0;

      if (query.boneClassification) {
        totalMaterialQueries++;
        if (query.boneClassification === video.clinical.boneClassification) materialPoints++;
      }
      if (query.materials && query.materials.length > 0) {
        totalMaterialQueries++;
        materialPoints += jaccardSimilarity(query.materials, video.clinical.materials || []);
      }
      
      if (totalMaterialQueries > 0) {
        details.materialScore = (materialPoints / totalMaterialQueries) * 15;
      } else {
        details.materialScore = 15;
      }

      // 환자 조건 (10%)
      let patientPoints = 0;
      let totalPatientQueries = 0;

      if (query.patientAge) {
        totalPatientQueries++;
        if (query.patientAge === video.clinical.patientAge) patientPoints++;
      }
      if (query.patientGender) {
        totalPatientQueries++;
        if (query.patientGender === video.clinical.patientGender) patientPoints++;
      }
      if (query.systemicConditions && query.systemicConditions.length > 0) {
        totalPatientQueries++;
        patientPoints += jaccardSimilarity(query.systemicConditions, video.clinical.systemicConditions || []);
      }

      if (totalPatientQueries > 0) {
        details.patientScore = (patientPoints / totalPatientQueries) * 10;
      } else {
        details.patientScore = 10;
      }

      totalScore = details.toothScore + details.diagnosisScore + details.techniqueScore + details.materialScore + details.patientScore;
    }
  }

  // 카테고리가 지정되었는데 일치하지 않으면 점수 대폭 삭감
  if (query.category && query.category !== video.category) {
    totalScore = 0;
  }

  return {
    video,
    score: Math.round(totalScore),
    matchDetails: details
  };
}

export function searchCases(allCases: CaseVideo[], query: SearchQuery): MatchResult[] {
  const results = allCases.map(video => calculateMatchScore(query, video));
  
  // 10점 이상인 결과만 반환하고 점수순 정렬
  return results
    .filter(r => r.score >= 10)
    .sort((a, b) => b.score - a.score);
}
