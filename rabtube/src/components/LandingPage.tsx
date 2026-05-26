'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/AuthContext';

export default function LandingPage() {
  const t = useTranslations('Landing');
  const { user } = useAuth();
  const [navSolid, setNavSolid] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Calculator State
  const [uploads, setUploads] = useState(4);
  const [quality, setQuality] = useState(75);
  const [views, setViews] = useState(20);
  const [spend, setSpend] = useState(0);

  // Upload Demo State
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCat, setUploadCat] = useState('임플란트');
  const [uploadDiff, setUploadDiff] = useState('중급');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [titleError, setTitleError] = useState(false);
  const [demoPrice, setDemoPrice] = useState(100);

  // Continuous Billing Logic
  const BASE_PRICE = 0.01988;
  const getUploadFeeRate = (priceRab: number): number => {
    if (priceRab <= 0) return 0;
    let rate = 0;
    if (priceRab >= 1 && priceRab <= 10) {
      rate = 2 + ((priceRab - 1) * (5 - 2)) / (10 - 1);
    } else if (priceRab > 10 && priceRab <= 50) {
      rate = 5 + ((priceRab - 10) * (10 - 5)) / (50 - 10);
    } else if (priceRab > 50 && priceRab <= 100) {
      rate = 10 + ((priceRab - 50) * (15 - 10)) / (100 - 50);
    } else if (priceRab > 100 && priceRab <= 500) {
      rate = 15 + ((priceRab - 100) * (20 - 15)) / (500 - 100);
    } else if (priceRab > 500 && priceRab <= 600) {
      rate = 20 + ((priceRab - 500) * (26 - 20)) / (600 - 500);
    } else if (priceRab > 600 && priceRab <= 700) {
      rate = 26 + ((priceRab - 600) * (28 - 26)) / (700 - 600);
    } else if (priceRab > 700 && priceRab <= 800) {
      rate = 28 + ((priceRab - 700) * (30 - 28)) / (800 - 700);
    } else if (priceRab > 800 && priceRab <= 900) {
      rate = 30 + ((priceRab - 800) * (32 - 30)) / (900 - 800);
    } else if (priceRab > 900 && priceRab <= 1000) {
      rate = 32 + ((priceRab - 900) * (34 - 32)) / (1000 - 900);
    } else if (priceRab > 1000 && priceRab <= 10000) {
      rate = 34 + ((priceRab - 1000) * (38 - 34)) / (10000 - 1000);
    }
    return Math.round(rate * 100) / 100;
  };

  const getUploadFeeRab = (priceRab: number): number => {
    if (priceRab <= 0) return 0;
    const rate = getUploadFeeRate(priceRab);
    return Math.max(1, Math.round(priceRab * (rate / 100)));
  };

  // Calculator Logic
  const [casePrice, setCasePrice] = useState(100);
  const baseBonus = Math.floor((quality / 100) * 20);
  const uploadEarn = uploads * (10 + baseBonus);
  const viewEarn = Math.round(uploads * views * casePrice * 0.7);
  const spendCost = spend * casePrice;
  const netRab = uploadEarn + viewEarn - spendCost;
  
  // Demo Bonus Logic
  const demoBonus = uploadDiff === '고급' ? 18 : uploadDiff === '중급' ? 14 : 8;

  useEffect(() => {
    const handleScroll = () => {
      setNavSolid(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.rv, .rvl, .rvr').forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  const handleStartUpload = () => {
    if (!uploadTitle) {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    if (uploadState !== 'idle') return;
    
    setUploadState('uploading');
    let pct = 0;
    
    const iv = setInterval(() => {
      pct += Math.random() * 9 + 3;
      if (pct >= 100) {
        pct = 100;
        clearInterval(iv);
        setTimeout(() => {
          setUploadState('done');
          setTimeout(() => {
            setUploadState('idle');
            setUploadTitle('');
            setUploadProgress(0);
          }, 3500);
        }, 300);
      }
      setUploadProgress(Math.round(pct));
    }, 180);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="landing-page-upload-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
        
        .landing-page-upload-root {
          --ink:#07121b;--ink2:#0c1d2c;--ink3:#112539;--ink4:#1a3550;
          --teal:#0ec28e;--teal2:#0aaa7b;--tealg:rgba(14,194,142,.16);--teald:#0c3d2c;
          --gold:#c8a84a;--goldl:#e6c66a;--goldd:rgba(200,168,74,.13);
          --red:#e05252;--redd:rgba(224,82,82,.12);
          --off:#f0ebe2;--off2:#ccc5b8;--off3:#8a9aaa;
          --line:rgba(255,255,255,.07);--line2:rgba(255,255,255,.12);
          --serif:'Cormorant Garamond',Georgia,serif;
          --sans:'DM Sans',system-ui,sans-serif;
          --mono:'DM Mono',monospace;
          --ease:cubic-bezier(.22,1,.36,1);

          font-family: var(--sans);
          background: var(--ink);
          color: var(--off);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          min-height: 100vh;
          position: relative;
        }
        
        .landing-page-upload-root *, .landing-page-upload-root *::before, .landing-page-upload-root *::after {
          box-sizing: border-box;
        }

        .landing-page-upload-root::after {
          content: ''; position: fixed; inset: 0; opacity: .02; pointer-events: none; z-index: 9999;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
        }

        .landing-page-upload-root nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 300; height: 58px; padding: 0 52px; display: flex; align-items: center; justify-content: space-between; background: rgba(7,18,27,.86); backdrop-filter: blur(18px); border-bottom: .5px solid var(--line); transition: background .3s;
        }
        .landing-page-upload-root nav.solid { background: rgba(7,18,27,.98); }
        .landing-page-upload-root .logo { font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--off); text-decoration: none; display: flex; align-items: center; gap: 9px; letter-spacing: -.3px; }
        .landing-page-upload-root .logo-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
        .landing-page-upload-root .nav-links { display: flex; align-items: center; gap: 24px; }
        .landing-page-upload-root .nav-links a { font-size: 13px; color: var(--off3); text-decoration: none; transition: color .2s; }
        .landing-page-upload-root .nav-links a:hover { color: var(--off); }
        .landing-page-upload-root .btn-start { background: var(--teal); color: var(--ink) !important; font-size: 13px; font-weight: 600; padding: 8px 20px; border-radius: 6px; text-decoration: none; transition: all .2s; display: flex; align-items: center; gap: 6px; }
        .landing-page-upload-root .btn-start:hover { background: var(--teal2); box-shadow: 0 0 24px var(--tealg); transform: translateY(-1px); }
        .landing-page-upload-root .btn-start svg { transition: transform .2s; }
        .landing-page-upload-root .btn-start:hover svg { transform: translateX(2px); }

        .landing-page-upload-root .hero { min-height: 100svh; padding: 130px 52px 90px; display: flex; align-items: center; position: relative; overflow: hidden; }
        .landing-page-upload-root .hero-glow { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(14,194,142,.07) 0%, transparent 70%); top: -100px; right: -100px; pointer-events: none; }
        .landing-page-upload-root .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 56px 56px; mask-image: radial-gradient(ellipse 60% 80% at 70% 40%, black, transparent 70%); pointer-events: none; }
        .landing-page-upload-root .hero-wrap { max-width: 1200px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; position: relative; z-index: 1; }

        .landing-page-upload-root .eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 3.5px; text-transform: uppercase; color: var(--teal); margin-bottom: 18px; display: flex; align-items: center; gap: 8px; opacity: 0; animation: up .7s var(--ease) .05s forwards; }
        .landing-page-upload-root .eyebrow::before { content: ''; width: 22px; height: 1px; background: var(--teal); }
        .landing-page-upload-root h1 { font-family: var(--serif); font-size: clamp(48px, 5.5vw, 76px); font-weight: 600; line-height: 1.04; letter-spacing: -.5px; margin-bottom: 26px; opacity: 0; animation: up .8s var(--ease) .18s forwards; }
        .landing-page-upload-root h1 em { font-style: italic; color: var(--teal); }
        .landing-page-upload-root .hero-sub { font-size: 19px; line-height: 1.8; color: var(--off2); font-weight: 300; max-width: 550px; margin-bottom: 40px; opacity: 0; animation: up .8s var(--ease) .32s forwards; }
        .landing-page-upload-root .hero-sub strong { color: var(--goldl); font-weight: 500; }
        .landing-page-upload-root .hero-cta { display: flex; align-items: center; gap: 12px; opacity: 0; animation: up .8s var(--ease) .44s forwards; }
        .landing-page-upload-root .btn-hero { display: inline-flex; align-items: center; gap: 8px; background: var(--teal); color: var(--ink); font-size: 17px; font-weight: 600; padding: 14px 30px; border-radius: 8px; text-decoration: none; transition: all .2s; }
        .landing-page-upload-root .btn-hero:hover { background: var(--teal2); box-shadow: 0 6px 32px var(--tealg); transform: translateY(-2px); }
        .landing-page-upload-root .btn-hero svg { transition: transform .2s; }
        .landing-page-upload-root .btn-hero:hover svg { transform: translateX(3px); }
        .landing-page-upload-root .btn-learn { font-size: 16px; color: var(--off3); text-decoration: none; display: flex; align-items: center; gap: 6px; transition: color .2s; }
        .landing-page-upload-root .btn-learn:hover { color: var(--off); }
        
        .landing-page-upload-root .reward-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 36px; opacity: 0; animation: up .8s var(--ease) .56s forwards; }
        .landing-page-upload-root .rpill { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; padding: 7px 14px; border-radius: 20px; border: .5px solid; letter-spacing: .3px; }
        .landing-page-upload-root .rpill-g { background: var(--teald); border-color: rgba(14,194,142,.3); color: var(--teal); }
        .landing-page-upload-root .rpill-y { background: var(--goldd); border-color: rgba(200,168,74,.3); color: var(--goldl); }
        .landing-page-upload-root .rpill-s { background: rgba(255,255,255,.04); border-color: var(--line2); color: var(--off3); }

        .landing-page-upload-root .upload-card { background: var(--ink2); border-radius: 18px; border: .5px solid var(--line2); overflow: hidden; box-shadow: 0 48px 96px rgba(0,0,0,.5), 0 0 0 .5px var(--line) inset; opacity: 0; animation: up .9s var(--ease) .28s forwards; }
        .landing-page-upload-root .uc-header { background: var(--ink3); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: .5px solid var(--line); }
        .landing-page-upload-root .uc-dots { display: flex; gap: 6px; }
        .landing-page-upload-root .ucd { width: 9px; height: 9px; border-radius: 50%; }
        .landing-page-upload-root .ucdr { background: #e05252; } .landing-page-upload-root .ucdy { background: #d4920c; } .landing-page-upload-root .ucdg { background: var(--teal); }
        .landing-page-upload-root .uc-title { font-size: 13px; color: var(--off3); letter-spacing: .5px; }
        .landing-page-upload-root .uc-body { padding: 20px; }

        .landing-page-upload-root .dropzone { border: 1.5px dashed rgba(14,194,142,.35); border-radius: 12px; padding: 28px 20px; text-align: center; cursor: pointer; position: relative; overflow: hidden; transition: all .3s; margin-bottom: 16px; background: rgba(14,194,142,.02); }
        .landing-page-upload-root .dropzone:hover { border-color: var(--teal); background: rgba(14,194,142,.05); }
        .landing-page-upload-root .dz-icon { font-size: 30px; margin-bottom: 8px; display: block; }
        .landing-page-upload-root .dz-text { font-size: 15px; font-weight: 500; color: var(--off); margin-bottom: 3px; }
        .landing-page-upload-root .dz-sub { font-size: 12px; color: var(--off3); }
        .landing-page-upload-root .dz-btn { display: inline-block; margin-top: 10px; background: var(--teal); color: var(--ink); font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 5px; }

        .landing-page-upload-root .upload-progress { margin-bottom: 16px; }
        .landing-page-upload-root .up-file { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .landing-page-upload-root .up-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--teald); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .landing-page-upload-root .up-name { font-size: 14px; font-weight: 500; color: var(--off); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
        .landing-page-upload-root .up-size { font-size: 12px; color: var(--off3); }
        .landing-page-upload-root .up-bar-wrap { height: 4px; background: rgba(255,255,255,.07); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
        .landing-page-upload-root .up-bar { height: 100%; background: linear-gradient(90deg, var(--teal), #0dd4a0); border-radius: 2px; transition: width .3s; }
        .landing-page-upload-root .up-pct { font-size: 12px; color: var(--teal); text-align: right; }

        .landing-page-upload-root .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
        .landing-page-upload-root .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
        .landing-page-upload-root .field label { font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: var(--off3); }
        .landing-page-upload-root .field input, .landing-page-upload-root .field select { background: rgba(255,255,255,.04); border: .5px solid var(--line2); border-radius: 7px; padding: 8px 11px; font-size: 14px; font-family: var(--sans); color: var(--off); outline: none; width: 100%; transition: border .2s; -webkit-appearance: none; }
        .landing-page-upload-root .field input:focus, .landing-page-upload-root .field select:focus { border-color: var(--teal); }
        .landing-page-upload-root .field select option { background: var(--ink3); }

        .landing-page-upload-root .reward-preview { background: rgba(14,194,142,.05); border: .5px solid rgba(14,194,142,.2); border-radius: 10px; padding: 14px 16px; margin-top: 4px; }
        .landing-page-upload-root .rp-title { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--teal); margin-bottom: 10px; }
        .landing-page-upload-root .rp-rows { display: flex; flex-direction: column; gap: 6px; }
        .landing-page-upload-root .rp-row { display: flex; justify-content: space-between; align-items: center; }
        .landing-page-upload-root .rp-label { font-size: 13px; color: var(--off2); }
        .landing-page-upload-root .rp-val { font-family: var(--mono); font-size: 13px; color: var(--teal); font-weight: 500; }
        .landing-page-upload-root .rp-divider { width: 100%; height: .5px; background: rgba(14,194,142,.15); margin: 6px 0; }
        .landing-page-upload-root .rp-total { font-size: 15px; font-weight: 600; color: var(--goldl); }
        
        .landing-page-upload-root .btn-upload { width: 100%; padding: 11px; background: var(--teal); color: var(--ink); border: none; border-radius: 8px; font-family: var(--sans); font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .2s; margin-top: 12px; }
        .landing-page-upload-root .btn-upload:hover { background: var(--teal2); box-shadow: 0 4px 20px var(--tealg); }

        .landing-page-upload-root .done-state { text-align: center; padding: 24px 16px; }
        .landing-page-upload-root .done-icon { font-size: 40px; margin-bottom: 12px; display: block; }
        .landing-page-upload-root .done-title { font-family: var(--serif); font-size: 22px; color: var(--off); font-weight: 600; margin-bottom: 6px; }
        .landing-page-upload-root .done-sub { font-size: 14px; color: var(--off3); line-height: 1.6; }
        .landing-page-upload-root .done-rab { margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; background: var(--goldd); border: .5px solid rgba(200,168,74,.3); color: var(--goldl); padding: 7px 16px; border-radius: 6px; font-size: 15px; font-weight: 600; }

        .landing-page-upload-root section { padding: 110px 52px; position: relative; }
        .landing-page-upload-root .si { max-width: 1200px; margin: 0 auto; }
        .landing-page-upload-root .sk { font-size: 13px; font-weight: 600; letter-spacing: 3.5px; text-transform: uppercase; color: var(--teal); margin-bottom: 14px; display: flex; align-items: center; gap: 9px; }
        .landing-page-upload-root .sk::before { content: ''; width: 20px; height: 1px; background: var(--teal); }
        .landing-page-upload-root h2 { font-family: var(--serif); font-size: clamp(38px, 4vw, 58px); font-weight: 600; line-height: 1.08; letter-spacing: -.4px; margin-bottom: 18px; }
        .landing-page-upload-root h2 em { font-style: italic; color: var(--teal); }
        .landing-page-upload-root .sdesc { font-size: 18px; line-height: 1.85; color: var(--off2); max-width: 600px; font-weight: 300; }
        .landing-page-upload-root .divider { width: 100%; height: .5px; background: var(--line); }

        .landing-page-upload-root .flow-wrap { margin-top: 70px; position: relative; }
        .landing-page-upload-root .flow-wrap::before { content: ''; position: absolute; top: 44px; left: calc(12.5% - 1px); right: calc(12.5% - 1px); height: .5px; background: linear-gradient(90deg, transparent, var(--teal), var(--teal), var(--teal), transparent); opacity: .3; pointer-events: none; }
        .landing-page-upload-root .flow-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        .landing-page-upload-root .flow-step { background: var(--ink2); padding: 32px 24px 28px; border: .5px solid var(--line); transition: all .25s; cursor: default; position: relative; overflow: hidden; }
        .landing-page-upload-root .flow-step:first-child { border-radius: 12px 0 0 12px; }
        .landing-page-upload-root .flow-step:last-child { border-radius: 0 12px 12px 0; }
        .landing-page-upload-root .flow-step:hover { background: var(--ink3); border-color: var(--line2); }
        .landing-page-upload-root .flow-step::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--teal), rgba(14,194,142,0)); opacity: 0; transition: opacity .3s; }
        .landing-page-upload-root .flow-step:hover::after { opacity: 1; }
        .landing-page-upload-root .fs-num { font-family: var(--mono); font-size: 13px; color: var(--teal); letter-spacing: 2px; margin-bottom: 16px; display: block; }
        .landing-page-upload-root .fs-icon { font-size: 32px; display: block; margin-bottom: 14px; }
        .landing-page-upload-root .fs-title { font-size: 17px; font-weight: 600; color: var(--off); margin-bottom: 8px; line-height: 1.3; }
        .landing-page-upload-root .fs-desc { font-size: 14px; color: var(--off2); line-height: 1.6; }
        .landing-page-upload-root .fs-rab { margin-top: 14px; font-family: var(--mono); font-size: 14px; color: var(--teal); }

        .landing-page-upload-root .calc-bg { background: var(--ink2); }
        .landing-page-upload-root .calc-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; margin-top: 70px; }
        .landing-page-upload-root .calc-panel { background: var(--ink); border-radius: 16px; border: .5px solid var(--line2); padding: 36px; position: sticky; top: 80px; }
        .landing-page-upload-root .cp-title { font-family: var(--serif); font-size: 24px; font-weight: 600; color: var(--off); margin-bottom: 4px; }
        .landing-page-upload-root .cp-sub { font-size: 14px; color: var(--off3); margin-bottom: 28px; }
        .landing-page-upload-root .calc-field { margin-bottom: 18px; }
        .landing-page-upload-root .cf-label { font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--off3); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .landing-page-upload-root .cf-val { font-family: var(--mono); color: var(--teal); font-weight: 500; }
        .landing-page-upload-root input[type=range] { width: 100%; accent-color: var(--teal); cursor: pointer; }
        .landing-page-upload-root .calc-result { margin-top: 28px; padding: 24px; background: rgba(14,194,142,.05); border-radius: 12px; border: .5px solid rgba(14,194,142,.2); }
        .landing-page-upload-root .cr-rows { display: flex; flex-direction: column; gap: 10px; }
        .landing-page-upload-root .cr-row { display: flex; justify-content: space-between; align-items: center; }
        .landing-page-upload-root .cr-l { font-size: 15px; color: var(--off2); }
        .landing-page-upload-root .cr-v { font-family: var(--mono); font-size: 15px; font-weight: 500; }
        .landing-page-upload-root .cr-earn { color: var(--teal); }
        .landing-page-upload-root .cr-spend { color: var(--red); }
        .landing-page-upload-root .cr-div { height: .5px; background: rgba(14,194,142,.15); margin: 6px 0; }
        .landing-page-upload-root .cr-net { font-size: 18px; font-weight: 600; }
        .landing-page-upload-root .cr-net.pos { color: var(--teal); }
        .landing-page-upload-root .cr-net.neg { color: var(--red); }
        .landing-page-upload-root .cr-monthly { margin-top: 20px; padding-top: 20px; border-top: .5px solid var(--line); text-align: center; }
        .landing-page-upload-root .crm-label { font-size: 13px; color: var(--off3); margin-bottom: 4px; }
        .landing-page-upload-root .crm-val { font-family: var(--serif); font-size: 44px; font-weight: 700; color: var(--goldl); letter-spacing: -1px; }
        .landing-page-upload-root .crm-unit { font-size: 15px; color: var(--gold); margin-left: 4px; }
        .landing-page-upload-root .crm-note { font-size: 13px; color: var(--off3); margin-top: 4px; }
        
        .landing-page-upload-root .reward-details { display: flex; flex-direction: column; gap: 20px; }
        .landing-page-upload-root .rd-card { background: var(--ink); border-radius: 14px; border: .5px solid var(--line); padding: 28px 30px; transition: border-color .2s; }
        .landing-page-upload-root .rd-card:hover { border-color: var(--line2); }
        .landing-page-upload-root .rd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .landing-page-upload-root .rd-icon { font-size: 22px; }
        .landing-page-upload-root .rd-rab { font-family: var(--mono); font-size: 16px; font-weight: 500; }
        .landing-page-upload-root .rd-title { font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--off); margin-bottom: 8px; }
        .landing-page-upload-root .rd-desc { font-size: 16px; color: var(--off2); line-height: 1.7; font-weight: 300; }
        .landing-page-upload-root .rd-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
        .landing-page-upload-root .rd-tag { font-size: 12px; padding: 3px 9px; border-radius: 4px; border: .5px solid var(--line2); color: var(--off3); letter-spacing: .3px; }

        .landing-page-upload-root .tiers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-top: 70px; }
        .landing-page-upload-root .tier-card { padding: 36px 28px; border: .5px solid var(--line); transition: all .25s; position: relative; overflow: hidden; }
        .landing-page-upload-root .tier-card:first-child { border-radius: 12px 0 0 12px; }
        .landing-page-upload-root .tier-card:last-child { border-radius: 0 12px 12px 0; }
        .landing-page-upload-root .tier-card.t-gold { background: linear-gradient(160deg, #1a1400, var(--ink2)); }
        .landing-page-upload-root .tier-card.t-silver { background: linear-gradient(160deg, #111820, var(--ink2)); }
        .landing-page-upload-root .tier-card.t-bronze { background: linear-gradient(160deg, #140e00, var(--ink2)); }
        .landing-page-upload-root .tier-card.t-none { background: var(--ink2); }
        .landing-page-upload-root .tier-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,.4); }
        .landing-page-upload-root .tier-emoji { font-size: 38px; display: block; margin-bottom: 16px; }
        .landing-page-upload-root .tier-name { font-family: var(--serif); font-size: 26px; font-weight: 600; margin-bottom: 6px; }
        .landing-page-upload-root .tier-score { font-size: 13px; color: var(--off3); margin-bottom: 20px; letter-spacing: .5px; }
        .landing-page-upload-root .tier-rab { margin-bottom: 20px; }
        .landing-page-upload-root .tier-rab .big { font-family: var(--serif); font-size: 48px; font-weight: 700; letter-spacing: -1px; line-height: 1; }
        .landing-page-upload-root .tier-rab .unit { font-size: 16px; font-weight: 600; margin-left: 4px; }
        .landing-page-upload-root .tier-req { display: flex; flex-direction: column; gap: 7px; }
        .landing-page-upload-root .tier-req-item { font-size: 13px; color: var(--off3); display: flex; align-items: flex-start; gap: 7px; line-height: 1.5; }
        .landing-page-upload-root .tier-req-item::before { content: '▸'; flex-shrink: 0; margin-top: 1px; }
        .landing-page-upload-root .t-gold .tier-name, .landing-page-upload-root .t-gold .big, .landing-page-upload-root .t-gold .unit { color: var(--goldl); }
        .landing-page-upload-root .t-gold .tier-req-item::before { color: var(--gold); }
        .landing-page-upload-root .t-silver .tier-name, .landing-page-upload-root .t-silver .big, .landing-page-upload-root .t-silver .unit { color: #bcc8d4; }
        .landing-page-upload-root .t-silver .tier-req-item::before { color: #7a9aaa; }
        .landing-page-upload-root .t-bronze .tier-name, .landing-page-upload-root .t-bronze .big, .landing-page-upload-root .t-bronze .unit { color: #d4a060; }
        .landing-page-upload-root .t-bronze .tier-req-item::before { color: #a07040; }
        .landing-page-upload-root .t-none .tier-name, .landing-page-upload-root .t-none .big, .landing-page-upload-root .t-none .unit { color: var(--off2); }

        .landing-page-upload-root .policy-bg { background: var(--ink2); }
        .landing-page-upload-root .policy-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin-top: 70px; }
        .landing-page-upload-root .pol-card { background: var(--ink); padding: 36px 30px; border: .5px solid var(--line); transition: background .2s; }
        .landing-page-upload-root .pol-card:hover { background: rgba(7,18,27,.7); }
        .landing-page-upload-root .pol-card:first-child { border-radius: 12px 0 0 12px; }
        .landing-page-upload-root .pol-card:last-child { border-radius: 0 12px 12px 0; }
        .landing-page-upload-root .pol-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 22px; }
        .landing-page-upload-root .pol-title { font-family: var(--serif); font-size: 24px; font-weight: 600; color: var(--off); margin-bottom: 12px; }
        .landing-page-upload-root .pol-desc { font-size: 15px; color: var(--off2); line-height: 1.75; font-weight: 300; margin-bottom: 20px; }
        .landing-page-upload-root .pol-rules { display: flex; flex-direction: column; gap: 8px; }
        .landing-page-upload-root .pol-rule { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: var(--off3); line-height: 1.5; }
        .landing-page-upload-root .pr-ok { color: var(--teal); } .landing-page-upload-root .pr-no { color: var(--red); }

        .landing-page-upload-root .pipe-wrap { margin-top: 70px; position: relative; }
        .landing-page-upload-root .pipe-line { position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent 2%, var(--teal) 5%, var(--teal) 95%, transparent 98%); opacity: .2; transform: translateY(-50%); pointer-events: none; z-index: 0; }
        .landing-page-upload-root .pipe-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; position: relative; z-index: 1; }
        .landing-page-upload-root .pipe-node { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .landing-page-upload-root .pn-dot { width: 52px; height: 52px; border-radius: 50%; border: .5px solid; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 14px; background: var(--ink2); position: relative; transition: all .3s; }
        .landing-page-upload-root .pn-dot.pass { border-color: rgba(14,194,142,.4); box-shadow: 0 0 20px rgba(14,194,142,.1); }
        .landing-page-upload-root .pn-dot.warn { border-color: rgba(212,146,12,.4); box-shadow: 0 0 20px rgba(212,146,12,.1); }
        .landing-page-upload-root .pn-dot.fail { border-color: rgba(224,82,82,.4); box-shadow: 0 0 20px rgba(224,82,82,.1); }
        .landing-page-upload-root .pn-dot::after { content: ''; position: absolute; right: -16px; top: 50%; transform: translateY(-50%); width: 14px; height: 1px; background: var(--off3); opacity: .3; }
        .landing-page-upload-root .pipe-node:last-child .pn-dot::after { display: none; }
        .landing-page-upload-root .pn-title { font-size: 14px; font-weight: 500; color: var(--off); margin-bottom: 5px; }
        .landing-page-upload-root .pn-desc { font-size: 12px; color: var(--off3); line-height: 1.5; }
        .landing-page-upload-root .pn-badge { margin-top: 8px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: .5px; }
        .landing-page-upload-root .pb-pass { background: var(--teald); color: var(--teal); }
        .landing-page-upload-root .pb-warn { background: rgba(212,146,12,.12); color: #d4920c; }
        .landing-page-upload-root .pb-fail { background: var(--redd); color: var(--red); }

        .landing-page-upload-root .faq-wrap { margin-top: 64px; max-width: 720px; }
        .landing-page-upload-root .faq-item { border-bottom: .5px solid var(--line); overflow: hidden; }
        .landing-page-upload-root .faq-q { padding: 20px 0; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: color .2s; }
        .landing-page-upload-root .faq-q:hover { color: var(--teal); }
        .landing-page-upload-root .faq-q-text { font-size: 17px; font-weight: 500; color: var(--off); }
        .landing-page-upload-root .faq-arrow { width: 20px; height: 20px; border-radius: 50%; border: .5px solid var(--line2); display: flex; align-items: center; justify-content: center; color: var(--off3); font-size: 11px; transition: all .3s; flex-shrink: 0; }
        .landing-page-upload-root .faq-a { font-size: 15px; color: var(--off2); line-height: 1.8; font-weight: 300; max-height: 0; overflow: hidden; transition: max-height .4s var(--ease), padding .4s; }
        .landing-page-upload-root .faq-a.open { max-height: 200px; padding-bottom: 20px; }
        .landing-page-upload-root .faq-item.open .faq-arrow { transform: rotate(45deg); border-color: var(--teal); color: var(--teal); }

        .landing-page-upload-root .cta-sec { padding: 140px 52px; text-align: center; position: relative; overflow: hidden; }
        .landing-page-upload-root .cta-glow { position: absolute; inset: 0; background: radial-gradient(ellipse 50% 60% at 50% 50%, rgba(14,194,142,.07) 0%, transparent 70%); pointer-events: none; }
        .landing-page-upload-root .cta-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
        .landing-page-upload-root .cta-sec h2 { font-size: clamp(42px, 5vw, 68px); margin-bottom: 20px; }
        .landing-page-upload-root .cta-sec .sdesc { margin: 0 auto 40px; text-align: center; }
        .landing-page-upload-root .cta-btns { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .landing-page-upload-root .btn-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--teal); color: var(--ink); font-size: 17px; font-weight: 600; padding: 14px 30px; border-radius: 8px; text-decoration: none; transition: all .2s; }
        .landing-page-upload-root .btn-cta:hover { background: var(--teal2); box-shadow: 0 6px 32px var(--tealg); transform: translateY(-2px); }
        .landing-page-upload-root .btn-cta svg { transition: transform .2s; }
        .landing-page-upload-root .btn-cta:hover svg { transform: translateX(3px); }
        .landing-page-upload-root .btn-cta2 { display: inline-flex; align-items: center; gap: 8px; border: .5px solid var(--line2); color: var(--off2); font-size: 17px; padding: 13px 26px; border-radius: 8px; text-decoration: none; transition: all .2s; }
        .landing-page-upload-root .btn-cta2:hover { border-color: rgba(255,255,255,.25); color: var(--off); }
        .landing-page-upload-root .cta-note { font-size: 14px; color: var(--off3); margin-top: 18px; }
        .landing-page-upload-root .cta-note a { color: var(--teal); text-decoration: none; }

        .landing-page-upload-root footer { background: var(--ink); border-top: .5px solid var(--line); padding: 60px 52px 36px; }
        .landing-page-upload-root .foot-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 56px; margin-bottom: 56px; }
        .landing-page-upload-root .flogo { font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--off); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .landing-page-upload-root .flogo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); }
        .landing-page-upload-root .fdesc { font-size: 14px; color: var(--off3); line-height: 1.7; font-weight: 300; max-width: 240px; }
        .landing-page-upload-root .fcol-t { font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--off3); margin-bottom: 18px; opacity: .6; }
        .landing-page-upload-root .flinks { list-style: none; display: flex; flex-direction: column; gap: 9px; }
        .landing-page-upload-root .flinks a { font-size: 14px; color: var(--off3); text-decoration: none; transition: color .2s; }
        .landing-page-upload-root .flinks a:hover { color: var(--off); }
        .landing-page-upload-root .foot-bot { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding-top: 28px; border-top: .5px solid var(--line); }
        .landing-page-upload-root .fcopy { font-size: 13px; color: var(--off3); opacity: .5; }
        .landing-page-upload-root .frab { font-family: var(--mono); font-size: 11px; color: var(--gold); opacity: .5; letter-spacing: 1px; }

        .landing-page-upload-root .rv { opacity: 0; transform: translateY(22px); transition: opacity .75s var(--ease), transform .75s var(--ease); }
        .landing-page-upload-root .rvl { opacity: 0; transform: translateX(-22px); transition: opacity .75s var(--ease), transform .75s var(--ease); }
        .landing-page-upload-root .rvr { opacity: 0; transform: translateX(22px); transition: opacity .75s var(--ease), transform .75s var(--ease); }
        .landing-page-upload-root .rv.on, .landing-page-upload-root .rvl.on, .landing-page-upload-root .rvr.on { opacity: 1; transform: none; }
        .landing-page-upload-root .d1 { transition-delay: .08s; } .landing-page-upload-root .d2 { transition-delay: .16s; } .landing-page-upload-root .d3 { transition-delay: .24s; } .landing-page-upload-root .d4 { transition-delay: .32s; } .landing-page-upload-root .d5 { transition-delay: .40s; } .landing-page-upload-root .d6 { transition-delay: .48s; }

        @keyframes up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

        @media(max-width:960px) {
          .landing-page-upload-root nav { padding: 0 22px; }
          .landing-page-upload-root .hero, .landing-page-upload-root .cta-sec { padding: 120px 22px 80px; }
          .landing-page-upload-root section { padding: 80px 22px; }
          .landing-page-upload-root footer { padding: 48px 22px 28px; }
          .landing-page-upload-root .hero-wrap, .landing-page-upload-root .calc-layout { grid-template-columns: 1fr; }
          .landing-page-upload-root .upload-card { display: none; }
          .landing-page-upload-root .flow-grid, .landing-page-upload-root .tiers-grid, .landing-page-upload-root .policy-grid, .landing-page-upload-root .pipe-grid { grid-template-columns: 1fr 1fr; }
          .landing-page-upload-root .foot-inner { grid-template-columns: 1fr 1fr; }
          .landing-page-upload-root .flow-step:first-child, .landing-page-upload-root .flow-step:last-child, .landing-page-upload-root .tier-card:first-child, .landing-page-upload-root .tier-card:last-child, .landing-page-upload-root .pol-card:first-child, .landing-page-upload-root .pol-card:last-child { border-radius: 8px; }
        }
      `}} />

      {/* NAV */}
      <nav id="nav" className={navSolid ? 'solid' : ''}>
        <Link href="/" className="logo">
          <span className="logo-dot"></span>RabTube
        </Link>
        <div className="nav-links">
          {user && (
            <Link href="/" className="mr-2 text-teal-400 font-medium hover:text-teal-300 transition-colors">
              {t('nav_feed')}
            </Link>
          )}
          <a href="#flow">{t('nav_flow')}</a>
          <a href="#rewards">{t('nav_rewards')}</a>
          <a href="#tiers">{t('nav_tiers')}</a>
          <a href="#faq">{t('nav_faq')}</a>
          {!user ? (
            <Link href="/auth/register" className="btn-start">
              {t('nav_cta')}
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          ) : (
            <Link href="/" className="btn-start">
              {t('nav_feed')}
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="top">
        <div className="hero-glow"></div>
        <div className="hero-grid"></div>
        <div className="hero-wrap">
          {/* LEFT */}
          <div>
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 dangerouslySetInnerHTML={{ __html: t.raw('hero_title') }} />
            <p className="hero-sub">
              <span dangerouslySetInnerHTML={{ __html: t.raw('hero_sub_1') }} /><br/>
              <span dangerouslySetInnerHTML={{ __html: t.raw('hero_sub_2') }} /><br/>
              <span dangerouslySetInnerHTML={{ __html: t.raw('hero_sub_3') }} />
            </p>
            <div className="hero-cta">
              {!user ? (
                <Link href="/auth/register" className="btn-hero">
                  {t('btn_hero')}
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              ) : (
                <Link href="/" className="btn-hero">
                  {t('nav_feed')}
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              )}
              <a href="#rewards" className="btn-learn">
                {t('btn_learn')}
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
              </a>
            </div>
            <div className="reward-row">
              <div className="rpill rpill-g">{t('rpill_g')}</div>
              <div className="rpill rpill-y">{t('rpill_y')}</div>
              <div className="rpill rpill-s">{t('rpill_s')}</div>
            </div>
          </div>
          {/* RIGHT: Upload UI Card */}
          <div className="upload-card" id="heroCard">
            <div className="uc-header">
              <div className="uc-dots"><div className="ucd ucdr"></div><div className="ucd ucdy"></div><div className="ucd ucdg"></div></div>
              <span className="uc-title">{t('uc_title')}</span>
              <span style={{fontSize: '10px', color: 'var(--off3)'}}>rabtube.vercel.app</span>
            </div>
            <div className="uc-body">
              {/* Dropzone state */}
              <div className="dropzone" id="dz" style={{ display: uploadState === 'idle' ? 'block' : 'none' }}>
                <span className="dz-icon">📁</span>
                <div className="dz-text">{t('uc_dz_text')}</div>
                <div className="dz-sub">{t('uc_dz_sub')}</div>
                <div className="dz-btn">{t('uc_dz_btn')}</div>
              </div>
              
              {/* Progress state */}
              <div className="upload-progress" id="upProg" style={{ display: uploadState === 'uploading' ? 'block' : 'none' }}>
                <div className="up-file">
                  <div className="up-icon">📹</div>
                  <div>
                    <div className="up-name" id="upName">{uploadTitle ? `${uploadTitle}.mp4` : 'case_video.mp4'}</div>
                    <div className="up-size">234 MB</div>
                  </div>
                </div>
                <div className="up-bar-wrap"><div className="up-bar" id="upBar" style={{ width: `${uploadProgress}%` }}></div></div>
                <div className="up-pct" id="upPct">{uploadProgress}% {t('uc_up_pct')}</div>
              </div>
              
              {/* Done state */}
              <div className="done-state" id="doneState" style={{ display: uploadState === 'done' ? 'block' : 'none' }}>
                <span className="done-icon">✅</span>
                <div className="done-title">{t('uc_done_title')}</div>
                <div className="done-sub" dangerouslySetInnerHTML={{ __html: t.raw('uc_done_sub') }}></div>
                <div className="done-rab">{t('uc_done_rab')}</div>
              </div>
              
              {/* Form */}
              <div id="formArea" style={{ display: uploadState === 'idle' ? 'block' : 'none' }}>
                <div className="field-row">
                  <div className="field">
                    <label>{t('uc_cat_label')}</label>
                    <select id="catSel" value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
                      <option>{t('uc_cat_op1')}</option>
                      <option>{t('uc_cat_op2')}</option>
                      <option>{t('uc_cat_op3')}</option>
                      <option>{t('uc_cat_op4')}</option>
                      <option>{t('uc_cat_op5')}</option>
                      <option>{t('uc_cat_op6')}</option>
                      <option>{t('uc_cat_op7')}</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>{t('uc_tooth_label')}</label>
                    <input type="text" placeholder={t('uc_tooth_ph')} id="toothInp" />
                  </div>
                </div>
                <div className="field">
                  <label>{t('uc_title_label')}</label>
                  <input 
                    type="text" 
                    id="titleInp" 
                    placeholder={t('uc_title_ph')} 
                    value={uploadTitle}
                    onChange={(e) => {
                      setUploadTitle(e.target.value);
                      if (e.target.value) setTitleError(false);
                    }}
                    style={{ borderColor: titleError ? 'var(--red)' : '' }}
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>{t('uc_vis_label')}</label>
                    <select>
                      <option>{t('uc_vis_op1')}</option>
                      <option>{t('uc_vis_op2')}</option>
                      <option>{t('uc_vis_op3')}</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>{t('uc_diff_label')}</label>
                    <select id="diffSel" value={uploadDiff} onChange={(e) => setUploadDiff(e.target.value)}>
                      <option>{t('uc_diff_op1')}</option>
                      <option>{t('uc_diff_op2')}</option>
                      <option>{t('uc_diff_op3')}</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>{t('uc_price_label')}</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <input type="range" min="0" max="10000" step="10" value={demoPrice} onChange={(e) => setDemoPrice(parseInt(e.target.value))} style={{flex: 1}} />
                    <span style={{color: 'var(--teal)', fontWeight: 600, fontFamily: 'var(--mono)', fontSize: '14px', minWidth: '65px'}}>{demoPrice.toLocaleString()} RAB</span>
                  </div>
                  <div style={{fontSize: '10px', color: 'var(--off3)', marginTop: '4px'}}>{t('uc_price_sub')}</div>
                </div>
                <div className="reward-preview">
                  <div className="rp-title">{t('uc_rp_title')}</div>
                  <div className="rp-rows">
                    <div className="rp-row"><span className="rp-label">{t('uc_rp_ul_reward')}</span><span className="rp-val">+10 RAB</span></div>
                    <div className="rp-row"><span className="rp-label">{t('uc_rp_bonus')}</span><span className="rp-val" id="qualBonus">+{demoBonus} RAB</span></div>
                    <div className="rp-row"><span className="rp-label" style={{color: 'var(--red)'}}>{t('uc_rp_fee')} ({getUploadFeeRate(demoPrice).toFixed(2)}%)</span><span className="rp-val" style={{color: 'var(--red)'}}>-{getUploadFeeRab(demoPrice).toLocaleString()} RAB</span></div>
                    <div className="rp-row"><span className="rp-label" style={{color: 'var(--teal)'}}>{t('uc_rp_monthly')} (20x × {demoPrice} RAB)</span><span className="rp-val" style={{color: 'var(--teal)'}}>+{Math.round(20 * demoPrice * 0.7).toLocaleString()} RAB</span></div>
                    <div className="rp-divider"></div>
                    <div className="rp-row"><span className="rp-label" style={{fontWeight: 600, color: 'var(--off)'}}>{t('uc_rp_net')}</span><span className="rp-total" id="totalBonus">{(10 + demoBonus - getUploadFeeRab(demoPrice) + 20 * demoPrice * 0.7).toLocaleString(undefined, {maximumFractionDigits: 1})} RAB</span></div>
                  </div>
                </div>
              </div>
              <button 
                className="btn-upload" 
                id="uploadBtn" 
                onClick={handleStartUpload}
                style={{ display: uploadState === 'idle' ? 'flex' : 'none' }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                {t('uc_btn_upload')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* UPLOAD FLOW */}
      <section id="flow">
        <div className="si">
          <p className="sk rv">{t('flow_eyebrow')}</p>
          <h2 className="rv d1" dangerouslySetInnerHTML={{ __html: t.raw('flow_title') }}></h2>
          <div className="sdesc rv d2">{t('flow_desc')}</div>
          <div className="flow-wrap">
            <div className="flow-grid">
              <div className="flow-step rv d1"><span className="fs-num">STEP 01</span><span className="fs-icon">📁</span><div className="fs-title">{t('flow_s1_t')}</div><div className="fs-desc">{t('flow_s1_d')}</div></div>
              <div className="flow-step rv d2"><span className="fs-num">STEP 02</span><span className="fs-icon">💰</span><div className="fs-title">{t('flow_s2_t')}</div><div className="fs-desc">{t('flow_s2_d')}</div><div className="fs-rab" style={{color: 'var(--teal)'}}>{t('flow_s2_r')}</div></div>
              <div className="flow-step rv d3"><span className="fs-num">STEP 03</span><span className="fs-icon">🤖</span><div className="fs-title">{t('flow_s3_t')}</div><div className="fs-desc">{t('flow_s3_d')}</div><div className="fs-rab">{t('flow_s3_r')}</div></div>
              <div className="flow-step rv d4"><span className="fs-num">STEP 04</span><span className="fs-icon">▶️</span><div className="fs-title">{t('flow_s4_t')}</div><div className="fs-desc">{t('flow_s4_d')}</div><div className="fs-rab" style={{color: 'var(--teal)'}}>{t('flow_s4_r')}</div></div>
              <div className="flow-step rv d5"><span className="fs-num">STEP 05</span><span className="fs-icon">📈</span><div className="fs-title">{t('flow_s5_t')}</div><div className="fs-desc">{t('flow_s5_d')}</div><div className="fs-rab" style={{color: 'var(--gold)'}}>{t('flow_s5_r')}</div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* REWARD CALCULATOR */}
      <section id="rewards" className="calc-bg">
        <div className="si">
          <p className="sk rv">{t('calc_eyebrow')}</p>
          <h2 className="rv d1" dangerouslySetInnerHTML={{ __html: t.raw('calc_title') }}></h2>
          <div className="calc-layout">
            {/* Calculator */}
            <div className="calc-panel rvl" style={{ width: '100%' }}>
              <div className="cp-title">{t('calc_tab_rev')}</div>
              <div className="cp-sub"></div>

              <div className="calc-field">
                <div className="cf-label">{t('calc_rev_u_l')} <span className="cf-val">{uploads}</span></div>
                <input type="range" min="1" max="10" value={uploads} onChange={(e) => setUploads(parseInt(e.target.value))} />
              </div>
              <div className="calc-field">
                <div className="cf-label">{t('calc_rev_q_l')} <span className="cf-val">{quality}%</span></div>
                <input type="range" min="0" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} />
              </div>
              <div className="calc-field">
                <div className="cf-label">{t('calc_rev_v_l')} <span className="cf-val">{views}</span></div>
                <input type="range" min="0" max="100" value={views} onChange={(e) => setViews(parseInt(e.target.value))} />
              </div>
              <div className="calc-field">
                <div className="cf-label">{t('calc_rev_p_l')} <span className="cf-val">{casePrice.toLocaleString()} RAB</span></div>
                <input type="range" min="0" max="10000" step="10" value={casePrice} onChange={(e) => setCasePrice(parseInt(e.target.value))} />
              </div>

              <div className="calc-result">
                <div className="cr-rows">
                  <div className="cr-row">
                    <span className="cr-l">{t('calc_rev_out_2')}</span>
                    <span className="cr-v cr-earn">+{uploadEarn.toLocaleString()} RAB</span>
                  </div>
                  <div className="cr-row">
                    <span className="cr-l">{t('uc_rp_fee')}</span>
                    <span className="cr-v cr-spend">-{Math.round(uploads * getUploadFeeRab(casePrice)).toLocaleString()} RAB</span>
                  </div>
                  <div className="cr-row">
                    <span className="cr-l">{t('calc_rev_out_3')}</span>
                    <span className="cr-v cr-earn">+{viewEarn.toLocaleString()} RAB</span>
                  </div>
                  <div className="cr-div"></div>
                  <div className="cr-row">
                    <span className="cr-l" style={{fontWeight: 500}}>{t('calc_rev_out_1')}</span>
                    <span className={`cr-v cr-net ${netRab - (uploads * getUploadFeeRab(casePrice)) >= 0 ? 'pos' : 'neg'}`}>
                      {netRab - (uploads * getUploadFeeRab(casePrice)) >= 0 ? '+' : ''}
                      {Math.round(netRab - (uploads * getUploadFeeRab(casePrice))).toLocaleString()} RAB
                    </span>
                  </div>
                </div>
                <div className="cr-monthly">
                  <div className="crm-label">Total RAB</div>
                  <div>
                    <span className="crm-val">
                      {Math.max(0, Math.round(netRab - (uploads * getUploadFeeRab(casePrice)))).toLocaleString()}
                    </span>
                    <span className="crm-unit">RAB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reward details */}
            <div className="reward-details">
              <div className="rd-card rv d1">
                <div className="rd-header">
                  <span className="rd-icon">📤</span>
                  <span className="rd-rab" style={{color: 'var(--teal)'}}>+10~30 RAB</span>
                </div>
                <div className="rd-title">{t('rd_t1')}</div>
                <p className="rd-desc">{t('rd_d1')}</p>
                <div className="rd-tags"><span className="rd-tag">{t('rd_t1_tag1')}</span><span className="rd-tag">{t('rd_t1_tag2')}</span><span className="rd-tag">{t('rd_t1_tag3')}</span></div>
              </div>
              <div className="rd-card rv d2">
                <div className="rd-header">
                  <span className="rd-icon">▶️</span>
                  <span className="rd-rab" style={{color: 'var(--teal)'}}>Pricing by Uploader</span>
                </div>
                <div className="rd-title">{t('rd_t2')}</div>
                <p className="rd-desc">{t('rd_d2')}</p>
                <div className="rd-tags"><span className="rd-tag">{t('rd_t2_tag1')}</span><span className="rd-tag">{t('rd_t2_tag2')}</span><span className="rd-tag">{t('rd_t2_tag3')}</span></div>
              </div>
              <div className="rd-card rv d3">
                <div className="rd-header">
                  <span className="rd-icon">❤️</span>
                  <span className="rd-rab" style={{color: 'var(--teal)'}}>+1 RAB / Like</span>
                </div>
                <div className="rd-title">{t('rd_t3')}</div>
                <p className="rd-desc">{t('rd_d3')}</p>
                <div className="rd-tags"><span className="rd-tag">{t('rd_t3_tag1')}</span><span className="rd-tag">{t('rd_t3_tag2')}</span></div>
              </div>
              <div className="rd-card rv d4">
                <div className="rd-header">
                  <span className="rd-icon">🏅</span>
                  <span className="rd-rab" style={{color: 'var(--goldl)'}}>Max +20 RAB</span>
                </div>
                <div className="rd-title">{t('rd_t4')}</div>
                <p className="rd-desc">{t('rd_d4')}</p>
                <div className="rd-tags"><span className="rd-tag">{t('rd_t4_tag1')}</span><span className="rd-tag">{t('rd_t4_tag2')}</span><span className="rd-tag">{t('rd_t4_tag3')}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* QUALITY TIERS */}
      <section id="tiers">
        <div className="si">
          <p className="sk rv">{t('tier_eyebrow')}</p>
          <h2 className="rv d1" dangerouslySetInnerHTML={{ __html: t.raw('tier_title') }}></h2>
          <p className="sdesc rv d2">{t('tier_desc')}</p>
          <div className="tiers-grid">
            <div className="tier-card t-gold rv d1">
              <span className="tier-emoji">🥇</span>
              <div className="tier-name">{t('tier_g')}</div>
              <div className="tier-score">{t('tier_g_s')}</div>
              <div className="tier-rab"><span className="big">+30</span><span className="unit">RAB</span></div>
              <div className="tier-req">
                <div className="tier-req-item">{t('tier_g_r1')}</div>
                <div className="tier-req-item">{t('tier_g_r2')}</div>
                <div className="tier-req-item">{t('tier_g_r3')}</div>
                <div className="tier-req-item">{t('tier_g_r4')}</div>
              </div>
            </div>
            <div className="tier-card t-silver rv d2">
              <span className="tier-emoji">🥈</span>
              <div className="tier-name">{t('tier_s')}</div>
              <div className="tier-score">{t('tier_s_s')}</div>
              <div className="tier-rab"><span className="big">+24</span><span className="unit">RAB</span></div>
              <div className="tier-req">
                <div className="tier-req-item">{t('tier_s_r1')}</div>
                <div className="tier-req-item">{t('tier_s_r2')}</div>
                <div className="tier-req-item">{t('tier_s_r3')}</div>
                <div className="tier-req-item">{t('tier_s_r4')}</div>
              </div>
            </div>
            <div className="tier-card t-bronze rv d3">
              <span className="tier-emoji">🥉</span>
              <div className="tier-name">{t('tier_b')}</div>
              <div className="tier-score">{t('tier_b_s')}</div>
              <div className="tier-rab"><span className="big">+16</span><span className="unit">RAB</span></div>
              <div className="tier-req">
                <div className="tier-req-item">{t('tier_b_r1')}</div>
                <div className="tier-req-item">{t('tier_b_r2')}</div>
                <div className="tier-req-item">{t('tier_b_r3')}</div>
                <div className="tier-req-item">{t('tier_b_r4')}</div>
              </div>
            </div>
            <div className="tier-card t-none rv d4">
              <span className="tier-emoji">📋</span>
              <div className="tier-name">{t('tier_n')}</div>
              <div className="tier-score">{t('tier_n_s')}</div>
              <div className="tier-rab"><span className="big">+10</span><span className="unit">RAB</span></div>
              <div className="tier-req">
                <div className="tier-req-item">{t('tier_n_r1')}</div>
                <div className="tier-req-item">{t('tier_n_r2')}</div>
                <div className="tier-req-item">{t('tier_n_r3')}</div>
                <div className="tier-req-item">{t('tier_n_r4')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* UPLOAD POLICY */}
      <section id="policy" className="policy-bg">
        <div className="si">
          <p className="sk rv">{t('pol_eyebrow')}</p>
          <h2 className="rv d1" dangerouslySetInnerHTML={{ __html: t.raw('pol_title') }}></h2>
          <div className="policy-grid">
            <div className="pol-card rv d1">
              <div className="pol-icon" style={{background: 'var(--teald)'}}>✅</div>
              <div className="pol-title">{t('pol_c1_t')}</div>
              <p className="pol-desc">{t('pol_c1_d')}</p>
              <div className="pol-rules">
                <div className="pol-rule"><span className="pr-ok">✓</span>{t('pol_c1_r1')}</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>{t('pol_c1_r2')}</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>{t('pol_c1_r3')}</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>{t('pol_c1_r4')}</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>{t('pol_c1_r5')}</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>{t('pol_c1_r6')}</div>
              </div>
            </div>
            <div className="pol-card rv d2">
              <div className="pol-icon" style={{background: 'var(--redd)'}}>🚫</div>
              <div className="pol-title">{t('pol_c2_t')}</div>
              <p className="pol-desc">{t('pol_c2_d')}</p>
              <div className="pol-rules">
                <div className="pol-rule"><span className="pr-no">✗</span>{t('pol_c2_r1')}</div>
                <div className="pol-rule"><span className="pr-no">✗</span>{t('pol_c2_r2')}</div>
                <div className="pol-rule"><span className="pr-no">✗</span>{t('pol_c2_r3')}</div>
                <div className="pol-rule"><span className="pr-no">✗</span>{t('pol_c2_r4')}</div>
                <div className="pol-rule"><span className="pr-no">✗</span>{t('pol_c2_r5')}</div>
                <div className="pol-rule"><span className="pr-no">✗</span>{t('pol_c2_r6')}</div>
              </div>
            </div>
            <div className="pol-card rv d3">
              <div className="pol-icon" style={{background: 'var(--goldd)'}}>⚠️</div>
              <div className="pol-title">{t('pol_c3_t')}</div>
              <p className="pol-desc">{t('pol_c3_d')}</p>
              <div className="pol-rules">
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>{t('pol_c3_r1')}</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>{t('pol_c3_r2')}</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>{t('pol_c3_r3')}</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>{t('pol_c3_r4')}</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>{t('pol_c3_r5')}</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>{t('pol_c3_r6')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* AI PIPELINE */}
      <section id="ai">
        <div className="si">
          <p className="sk rv">{t('ai_eyebrow')}</p>
          <h2 className="rv d1" dangerouslySetInnerHTML={{ __html: t.raw('ai_title') }}></h2>
          <p className="sdesc rv d2">{t('ai_desc')}</p>
          <div className="pipe-wrap">
            <div className="pipe-line"></div>
            <div className="pipe-grid">
              <div className="pipe-node rv d1">
                <div className="pn-dot pass">📁</div>
                <div className="pn-title">{t('ai_p1_t')}</div>
                <div className="pn-desc">{t('ai_p1_d')}</div>
                <span className="pn-badge pb-pass">{t('ai_p1_b')}</span>
              </div>
              <div className="pipe-node rv d2">
                <div className="pn-dot pass">⏱</div>
                <div className="pn-title">{t('ai_p2_t')}</div>
                <div className="pn-desc">{t('ai_p2_d')}</div>
                <span className="pn-badge pb-pass">{t('ai_p2_b')}</span>
              </div>
              <div className="pipe-node rv d3">
                <div className="pn-dot warn">🤖</div>
                <div className="pn-title">{t('ai_p3_t')}</div>
                <div className="pn-desc">{t('ai_p3_d')}</div>
                <span className="pn-badge pb-warn">{t('ai_p3_b')}</span>
              </div>
              <div className="pipe-node rv d4">
                <div className="pn-dot fail">🙈</div>
                <div className="pn-title">{t('ai_p4_t')}</div>
                <div className="pn-desc">{t('ai_p4_d')}</div>
                <span className="pn-badge pb-fail">{t('ai_p4_b')}</span>
              </div>
              <div className="pipe-node rv d5">
                <div className="pn-dot pass">🏅</div>
                <div className="pn-title">{t('ai_p5_t')}</div>
                <div className="pn-desc">{t('ai_p5_d')}</div>
                <span className="pn-badge pb-pass">{t('ai_p5_b')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* FAQ */}
      <section id="faq">
        <div className="si">
          <p className="sk rv">{t('faq_eyebrow')}</p>
          <h2 className="rv d1" dangerouslySetInnerHTML={{ __html: t.raw('faq_title') }}></h2>
          <div className="faq-wrap rv d2">
            {[
              { q: t('faq_q1'), a: t('faq_a1') },
              { q: t('faq_q2'), a: t('faq_a2') },
              { q: t('faq_q3'), a: t('faq_a3') },
              { q: t('faq_q4'), a: t('faq_a4') },
              { q: t('faq_q5'), a: t('faq_a5') },
              { q: t('faq_q6'), a: t('faq_a6') }
            ].map((faq, idx) => (
              <div key={idx} className={`faq-item ${openFaq === idx ? 'open' : ''}`}>
                <div className="faq-q" onClick={() => toggleFaq(idx)}>
                  <span className="faq-q-text">{faq.q}</span>
                  <div className="faq-arrow">+</div>
                </div>
                <div className={`faq-a ${openFaq === idx ? 'open' : ''}`}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-glow"></div>
        <div className="cta-inner">
          <p className="sk rv" style={{justifyContent: 'center'}}>{t('cta_eyebrow')}</p>
          <h2 className="rv" dangerouslySetInnerHTML={{ __html: t.raw('cta_title') }}></h2>
          <p className="sdesc rv d2" style={{textAlign: 'center', margin: '0 auto 40px'}} dangerouslySetInnerHTML={{ __html: t.raw('cta_desc') }}></p>
          <div className="cta-btns rv d3">
            {!user ? (
              <>
                <Link href="/auth/register" className="btn-cta">
                  {t('cta_btn1')}
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/auth/login" className="btn-cta2">{t('cta_btn2')}</Link>
              </>
            ) : (
              <Link href="/" className="btn-cta">
                {t('nav_feed')}
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            )}
          </div>
          <p className="cta-note rv d4" dangerouslySetInnerHTML={{ __html: t.raw('cta_note') }}></p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-inner">
          <div>
            <div className="flogo"><span className="flogo-dot"></span>RabTube</div>
            <p className="fdesc">{t('foot_desc')}</p>
          </div>
          <div>
            <div className="fcol-t">{t('foot_c1_t')}</div>
            <ul className="flinks"><li><a href="#">{t('foot_c1_l1')}</a></li><li><a href="#">{t('foot_c1_l2')}</a></li><li><a href="#">{t('foot_c1_l3')}</a></li><li><a href="#">{t('foot_c1_l4')}</a></li></ul>
          </div>
          <div>
            <div className="fcol-t">{t('foot_c2_t')}</div>
            <ul className="flinks"><li><a href="#">{t('foot_c2_l1')}</a></li><li><a href="#">{t('foot_c2_l2')}</a></li><li><a href="#">{t('foot_c2_l3')}</a></li><li><a href="#">{t('foot_c2_l4')}</a></li></ul>
          </div>
          <div>
            <div className="fcol-t">{t('foot_c3_t')}</div>
            <ul className="flinks"><li><a href="#">{t('foot_c3_l1')}</a></li><li><a href="#">{t('foot_c3_l2')}</a></li><li><a href="#">{t('foot_c3_l3')}</a></li><li><a href="#">{t('foot_c3_l4')}</a></li></ul>
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
