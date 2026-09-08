const fs = require('fs');
const path = require('path');

const file = path.join('src', 'app', 'edit', '[id]', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('import { uploadCaseVideo, getCustomMaterials }', 'import { getCaseById, updateCaseVideo, getCustomMaterials }');

content = content.replace(
  'export default function UploadPage() {',
  `export default function EditPage({ params }: { params: { id: string } }) {
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [oldVideoUrl, setOldVideoUrl] = useState<string | null>(null);`
);

content = content.replace(
  '// 재료 목록 불러오기',
  `useEffect(() => {
    if (!params.id) return;
    getCaseById(params.id).then(c => {
      if(c) {
        setTitle(c.title);
        setDescription(c.description || "");
        setCategory(c.category);
        setToothNumber(c.toothNumber);
        setTags(c.tags?.join(", ") || "");
        setDifficulty(c.difficulty);
        setVisibility(c.visibility);
        setPrice(c.price || 0);
        setOldVideoUrl(c.videoUrl);
        if (c.clinical) {
          setDiagnosis(c.clinical.diagnosis || []);
          setTechnique(c.clinical.technique || []);
          setSelectedMaterials(c.clinical.materials || []);
          setBoneClassification(c.clinical.boneClassification || "");
          setPatientAge(c.clinical.patientAge || "");
          setPatientGender(c.clinical.patientGender || "");
          setSystemicConditions(c.clinical.systemicConditions || []);
          setIsClinicalOpen(true);
        }
      }
      setLoadingInitial(false);
    }).catch(console.error);
  }, [params.id]);

  // 재료 목록 불러오기`
);

content = content.replace(
  'if (!file || !title || !category || !user || !profile || !consentAgreed) return;',
  'if (!title || !category || !user || !profile || !consentAgreed) return;'
);

const uploadCallPattern = /await uploadCaseVideo\([\s\S]*?\(p\) => setProgress\(p\)\s*\);/;
content = content.replace(
  uploadCallPattern,
  `await updateCaseVideo(
        params.id,
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
        file,
        file ? oldVideoUrl : null,
        (p) => setProgress(p)
      );`
);

content = content.replace('케이스 영상 업로드', '케이스 영상 수정');
content = content.replace('!file ?', '(!file && !oldVideoUrl) ?');
content = content.replace('{file.name}', '{file ? file.name : "기존 영상 유지"}');
content = content.replace('{(file.size / 1024 / 1024).toFixed(1)} MB', '{file ? (file.size / 1024 / 1024).toFixed(1) + " MB" : "(변경 시 새 파일 선택)"}');
content = content.replace(
  '<button onClick={() => setFile(null)}',
  '<button onClick={() => { setFile(null); setOldVideoUrl(null); }}'
);
content = content.replace(/'업로드 시작'/g, "'수정 시작'");
content = content.replace('!file || !title', '(!file && !oldVideoUrl) || !title');

// Fix the return text inside button
content = content.replace(/{isDone \? '✓ 업로드 완료' : isUploading \? \`\${progress\.percent}% 업로드 중\.\.\.\` : '업로드 시작'}/g, "{isDone ? '✓ 수정 완료' : isUploading ? `${progress.percent}% 수정 중...` : '수정 시작'}");

// Add loading wrapper
content = content.replace(
  'return (\n    <div className="min-h-screen bg-slate-50">',
  `return (
    <div className="min-h-screen bg-slate-50">
      {loadingInitial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        </div>
      )}`
);

fs.writeFileSync(file, content);
