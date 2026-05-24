'use client';

export default function TestVideoPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">비디오 플레이어 테스트</h1>
      <p className="mb-8 text-slate-600">이 영상이 정상적으로 재생된다면, 플레이어 코드나 브라우저 설정에는 문제가 없는 것입니다. (업로드하신 원본 영상의 코덱이나 인코딩 문제일 확률이 100%입니다.)</p>
      
      <div className="w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
        <video
          src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          controls
          controlsList="nodownload"
          onContextMenu={e => e.preventDefault()}
          className="w-full h-full"
          autoPlay
          muted
          playsInline
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}
