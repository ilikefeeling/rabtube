import { CaseCategory, DiagnosisCategory, TechniqueCategory } from '@/types';

export const DIAGNOSIS_OPTIONS: Record<CaseCategory, DiagnosisCategory[CaseCategory][]> = {
  임플란트: ['치아결손', '치근파절', '치근흡수', '선천성결손', '외상', '기타'],
  보철: ['치아결손', '치질손상', '교합부조화', '심미불량', '보철물파손', '기타'],
  치주: ['만성치주염', '급성치주염', '치은퇴축', '치주농양', '치은비대', '기타'],
  교정: ['총생', '반대교합', '개방교합', '과개교합', '공간부족', '매복치', '기타'],
  보존: ['치아우식', '치수염', '근관치료재치료', '치아파절', '치경부마모', '기타'],
  소아: ['유치우식', '과잉치', '선천성결손', '외상', '맹출장애', '기타'],
  구강외과: ['매복치발거', '낭종', '양성종양', '골절', '턱관절장애', '기타'],
};

export const TECHNIQUE_OPTIONS: Record<CaseCategory, TechniqueCategory[CaseCategory][]> = {
  임플란트: ['GBR', '상악동거상(lateral)', '상악동거상(crestal)', '즉시식립', '지연식립', '발치후즉시', 'All-on-4', '틸티드임플란트', '기타'],
  보철: ['올세라믹크라운', 'PFM크라운', '지르코니아', '라미네이트', '브릿지', '의치', '임플란트보철', '기타'],
  치주: ['스케일링/SRP', '치주판막술', '골이식', '치은이식', '치관연장술', '재생술', '기타'],
  교정: ['메탈브라켓', '세라믹브라켓', '투명교정', '설측교정', 'TAD(미니스크류)', '기능성장치', '기타'],
  보존: ['직접수복(레진)', '간접수복(인레이/온레이)', '근관치료', '재근관치료', '치수복조', '치근단절제술', '기타'],
  소아: ['치수절단술', '기성금속관', '불소도포', '실란트', '공간유지장치', '외상처치', '기타'],
  구강외과: ['단순발거', '매복치발거', '낭종적출', '골절정복', '조직생검', '턱관절치료', '기타'],
};

// 재료 프리셋은 자동완성을 위한 제안 목록으로 사용 (사용자는 자유 입력 가능)
export const MATERIAL_PRESETS: Record<CaseCategory, string[]> = {
  임플란트: ['Osstem TS III', 'Dentium SuperLine', 'Straumann BLX', 'NeoBiotech', 'MegaGen AnyRidge', 'Bio-Oss', 'OCS-B', 'Jason membrane'],
  보철: ['3M Lava', 'Katana Zirconia', 'E.max', 'Cerec', 'Fuji IX', 'RelyX U200'],
  치주: ['Bio-Oss', 'Emdogain', 'Geistlich Mucograft', 'OssBuilder', 'CollaTape'],
  교정: ['Damon Clear', 'Invisalign', 'Incognito', 'Tomy', 'Dentaurum'],
  보존: ['Filtek Z350', 'Tetric N-Ceram', 'Charisma', 'MTA', 'Cavit', 'Gutta Percha'],
  소아: ['SS Crown', 'NuSmile', 'Fuji II LC', 'Ketac Molar', 'Formocresol'],
  구강외과: ['Surgicel', 'CollaPlug', 'Bone wax', 'Vicryl 4-0', 'Nylon 5-0'],
};
