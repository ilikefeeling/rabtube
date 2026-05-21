/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  // firebase-admin은 서버 전용이므로 번들 제외
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  // 프로덕션 성능: source map 비활성화
  productionBrowserSourceMaps: false,
  // 빌드 시 lint 경고만 (에러 중단 방지)
  eslint: {
    ignoreDuringBuilds: false,
  },
  // 파워 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
