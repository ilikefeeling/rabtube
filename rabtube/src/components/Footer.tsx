'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('Landing');

  return (
    <div className="app-footer-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .app-footer-wrapper {
          --ink: transparent;
          --teal: #0f766e;
          --gold: #d97706;
          --off: #334155;
          --off2: #475569;
          --off3: #64748b;
          --line: #e2e8f0;
          --line2: #cbd5e1;
          --serif: 'Cormorant Garamond', 'DM Serif Display', serif;
          --sans: 'DM Sans', sans-serif;
          --mono: 'DM Mono', monospace;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
        }
        .app-footer-wrapper footer { background: var(--ink); border-top: .5px solid var(--line); padding: 40px 32px 24px; }
        .app-footer-wrapper .foot-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; margin-bottom: 32px; }
        .app-footer-wrapper .flogo { font-family: var(--serif); font-size: 18px; font-weight: 600; color: var(--off); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .app-footer-wrapper .flogo-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--teal); }
        .app-footer-wrapper .fdesc { font-size: 13px; color: var(--off3); line-height: 1.6; font-weight: 300; max-width: 220px; }
        .app-footer-wrapper .fcol-t { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--off3); margin-bottom: 12px; opacity: .6; }
        .app-footer-wrapper .flinks { list-style: none; display: flex; flex-direction: column; gap: 6px; padding: 0; margin: 0; }
        .app-footer-wrapper .flinks a { font-size: 13px; color: var(--off3); text-decoration: none; transition: color .2s; }
        .app-footer-wrapper .flinks a:hover { color: var(--off); }
        .app-footer-wrapper .foot-bot { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: .5px solid var(--line); }
        .app-footer-wrapper .fcopy { font-size: 12px; color: var(--off3); opacity: .5; }
        .app-footer-wrapper .frab { font-family: var(--mono); font-size: 10px; color: var(--gold); opacity: .5; letter-spacing: 1px; }

        @media(max-width:960px) {
          .app-footer-wrapper footer { padding: 32px 20px 20px; }
          .app-footer-wrapper .foot-inner { grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        }
      `}} />
      <footer>
        <div className="foot-inner">
          <div>
            <div className="flogo"><span className="flogo-dot"></span>RabTube</div>
            <p className="fdesc">{t('foot_desc')}</p>
          </div>
          <div>
            <div className="fcol-t">{t('foot_c1_t')}</div>
            <ul className="flinks">
              <li><Link href="/">{t('foot_c1_l1')}</Link></li>
              <li><Link href="/upload">{t('foot_c1_l2')}</Link></li>
              <li><Link href="/my">{t('foot_c1_l3')}</Link></li>
              <li><Link href="/billing">{t('foot_c1_l4')}</Link></li>
            </ul>
          </div>
          <div>
            <div className="fcol-t">{t('foot_c2_t')}</div>
            <ul className="flinks">
              <li><Link href="/about">{t('foot_c2_l1')}</Link></li>
              <li><Link href="/about">{t('foot_c2_l2')}</Link></li>
              <li><Link href="/about">{t('foot_c2_l3')}</Link></li>
              <li><Link href="/about">{t('foot_c2_l4')}</Link></li>
            </ul>
          </div>
          <div>
            <div className="fcol-t">{t('foot_c3_t')}</div>
            <ul className="flinks">
              <li><Link href="/about">{t('foot_c3_l1')}</Link></li>
              <li><Link href="#">{t('foot_c3_l2')}</Link></li>
              <li><Link href="#">{t('foot_c3_l3')}</Link></li>
              <li><a href="mailto:support@rabtube.com">{t('foot_c3_l4')}</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bot">
          <div className="fcopy">{t('foot_copy')}</div>
          <div className="frab">{t('foot_rab')}</div>
        </div>
      </footer>
    </div>
  );
}
