'use client';

import { useRouter } from 'next/navigation';
import { X, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  onClose: () => void;
}

export default function LoginPromptModal({ onClose }: Props) {
  const router = useRouter();
  const t = useTranslations('LoginPrompt');

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn size={24} className="text-teal-600" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('title')}</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{t('desc')}</p>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            {t('login')}
          </button>
          <button
            onClick={() => router.push('/auth/register')}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors"
          >
            {t('register')}
          </button>
        </div>
      </div>
    </div>
  );
}
