'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [navSolid, setNavSolid] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Calculator State
  const [uploads, setUploads] = useState(4);
  const [quality, setQuality] = useState(75);
  const [views, setViews] = useState(20);
  const [spend, setSpend] = useState(10);

  // Upload Demo State
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCat, setUploadCat] = useState('임플란트');
  const [uploadDiff, setUploadDiff] = useState('중급');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [titleError, setTitleError] = useState(false);

  // Calculator Logic
  const [casePrice, setCasePrice] = useState(5);
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

        .landing-page-upload-root .eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 3.5px; text-transform: uppercase; color: var(--teal); margin-bottom: 18px; display: flex; align-items: center; gap: 8px; opacity: 0; animation: up .7s var(--ease) .05s forwards; }
        .landing-page-upload-root .eyebrow::before { content: ''; width: 22px; height: 1px; background: var(--teal); }
        .landing-page-upload-root h1 { font-family: var(--serif); font-size: clamp(48px, 5.5vw, 76px); font-weight: 600; line-height: 1.04; letter-spacing: -.5px; margin-bottom: 26px; opacity: 0; animation: up .8s var(--ease) .18s forwards; }
        .landing-page-upload-root h1 em { font-style: italic; color: var(--teal); }
        .landing-page-upload-root .hero-sub { font-size: 16px; line-height: 1.8; color: var(--off2); font-weight: 300; max-width: 460px; margin-bottom: 40px; opacity: 0; animation: up .8s var(--ease) .32s forwards; }
        .landing-page-upload-root .hero-sub strong { color: var(--goldl); font-weight: 500; }
        .landing-page-upload-root .hero-cta { display: flex; align-items: center; gap: 12px; opacity: 0; animation: up .8s var(--ease) .44s forwards; }
        .landing-page-upload-root .btn-hero { display: inline-flex; align-items: center; gap: 8px; background: var(--teal); color: var(--ink); font-size: 15px; font-weight: 600; padding: 14px 30px; border-radius: 8px; text-decoration: none; transition: all .2s; }
        .landing-page-upload-root .btn-hero:hover { background: var(--teal2); box-shadow: 0 6px 32px var(--tealg); transform: translateY(-2px); }
        .landing-page-upload-root .btn-hero svg { transition: transform .2s; }
        .landing-page-upload-root .btn-hero:hover svg { transform: translateX(3px); }
        .landing-page-upload-root .btn-learn { font-size: 14px; color: var(--off3); text-decoration: none; display: flex; align-items: center; gap: 6px; transition: color .2s; }
        .landing-page-upload-root .btn-learn:hover { color: var(--off); }
        
        .landing-page-upload-root .reward-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 36px; opacity: 0; animation: up .8s var(--ease) .56s forwards; }
        .landing-page-upload-root .rpill { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 20px; border: .5px solid; letter-spacing: .3px; }
        .landing-page-upload-root .rpill-g { background: var(--teald); border-color: rgba(14,194,142,.3); color: var(--teal); }
        .landing-page-upload-root .rpill-y { background: var(--goldd); border-color: rgba(200,168,74,.3); color: var(--goldl); }
        .landing-page-upload-root .rpill-s { background: rgba(255,255,255,.04); border-color: var(--line2); color: var(--off3); }

        .landing-page-upload-root .upload-card { background: var(--ink2); border-radius: 18px; border: .5px solid var(--line2); overflow: hidden; box-shadow: 0 48px 96px rgba(0,0,0,.5), 0 0 0 .5px var(--line) inset; opacity: 0; animation: up .9s var(--ease) .28s forwards; }
        .landing-page-upload-root .uc-header { background: var(--ink3); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: .5px solid var(--line); }
        .landing-page-upload-root .uc-dots { display: flex; gap: 6px; }
        .landing-page-upload-root .ucd { width: 9px; height: 9px; border-radius: 50%; }
        .landing-page-upload-root .ucdr { background: #e05252; } .landing-page-upload-root .ucdy { background: #d4920c; } .landing-page-upload-root .ucdg { background: var(--teal); }
        .landing-page-upload-root .uc-title { font-size: 11px; color: var(--off3); letter-spacing: .5px; }
        .landing-page-upload-root .uc-body { padding: 20px; }

        .landing-page-upload-root .dropzone { border: 1.5px dashed rgba(14,194,142,.35); border-radius: 12px; padding: 28px 20px; text-align: center; cursor: pointer; position: relative; overflow: hidden; transition: all .3s; margin-bottom: 16px; background: rgba(14,194,142,.02); }
        .landing-page-upload-root .dropzone:hover { border-color: var(--teal); background: rgba(14,194,142,.05); }
        .landing-page-upload-root .dz-icon { font-size: 30px; margin-bottom: 8px; display: block; }
        .landing-page-upload-root .dz-text { font-size: 13px; font-weight: 500; color: var(--off); margin-bottom: 3px; }
        .landing-page-upload-root .dz-sub { font-size: 10px; color: var(--off3); }
        .landing-page-upload-root .dz-btn { display: inline-block; margin-top: 10px; background: var(--teal); color: var(--ink); font-size: 11px; font-weight: 600; padding: 6px 16px; border-radius: 5px; }

        .landing-page-upload-root .upload-progress { margin-bottom: 16px; }
        .landing-page-upload-root .up-file { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .landing-page-upload-root .up-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--teald); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .landing-page-upload-root .up-name { font-size: 12px; font-weight: 500; color: var(--off); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
        .landing-page-upload-root .up-size { font-size: 10px; color: var(--off3); }
        .landing-page-upload-root .up-bar-wrap { height: 4px; background: rgba(255,255,255,.07); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
        .landing-page-upload-root .up-bar { height: 100%; background: linear-gradient(90deg, var(--teal), #0dd4a0); border-radius: 2px; transition: width .3s; }
        .landing-page-upload-root .up-pct { font-size: 10px; color: var(--teal); text-align: right; }

        .landing-page-upload-root .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
        .landing-page-upload-root .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
        .landing-page-upload-root .field label { font-size: 9px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: var(--off3); }
        .landing-page-upload-root .field input, .landing-page-upload-root .field select { background: rgba(255,255,255,.04); border: .5px solid var(--line2); border-radius: 7px; padding: 8px 11px; font-size: 12px; font-family: var(--sans); color: var(--off); outline: none; width: 100%; transition: border .2s; -webkit-appearance: none; }
        .landing-page-upload-root .field input:focus, .landing-page-upload-root .field select:focus { border-color: var(--teal); }
        .landing-page-upload-root .field select option { background: var(--ink3); }

        .landing-page-upload-root .reward-preview { background: rgba(14,194,142,.05); border: .5px solid rgba(14,194,142,.2); border-radius: 10px; padding: 14px 16px; margin-top: 4px; }
        .landing-page-upload-root .rp-title { font-size: 9px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--teal); margin-bottom: 10px; }
        .landing-page-upload-root .rp-rows { display: flex; flex-direction: column; gap: 6px; }
        .landing-page-upload-root .rp-row { display: flex; justify-content: space-between; align-items: center; }
        .landing-page-upload-root .rp-label { font-size: 11px; color: var(--off2); }
        .landing-page-upload-root .rp-val { font-family: var(--mono); font-size: 11px; color: var(--teal); font-weight: 500; }
        .landing-page-upload-root .rp-divider { width: 100%; height: .5px; background: rgba(14,194,142,.15); margin: 6px 0; }
        .landing-page-upload-root .rp-total { font-size: 13px; font-weight: 600; color: var(--goldl); }
        
        .landing-page-upload-root .btn-upload { width: 100%; padding: 11px; background: var(--teal); color: var(--ink); border: none; border-radius: 8px; font-family: var(--sans); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .2s; margin-top: 12px; }
        .landing-page-upload-root .btn-upload:hover { background: var(--teal2); box-shadow: 0 4px 20px var(--tealg); }

        .landing-page-upload-root .done-state { text-align: center; padding: 24px 16px; }
        .landing-page-upload-root .done-icon { font-size: 40px; margin-bottom: 12px; display: block; }
        .landing-page-upload-root .done-title { font-family: var(--serif); font-size: 20px; color: var(--off); font-weight: 600; margin-bottom: 6px; }
        .landing-page-upload-root .done-sub { font-size: 12px; color: var(--off3); line-height: 1.6; }
        .landing-page-upload-root .done-rab { margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; background: var(--goldd); border: .5px solid rgba(200,168,74,.3); color: var(--goldl); padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; }

        .landing-page-upload-root section { padding: 110px 52px; position: relative; }
        .landing-page-upload-root .si { max-width: 1200px; margin: 0 auto; }
        .landing-page-upload-root .sk { font-size: 10px; font-weight: 600; letter-spacing: 3.5px; text-transform: uppercase; color: var(--teal); margin-bottom: 14px; display: flex; align-items: center; gap: 9px; }
        .landing-page-upload-root .sk::before { content: ''; width: 20px; height: 1px; background: var(--teal); }
        .landing-page-upload-root h2 { font-family: var(--serif); font-size: clamp(38px, 4vw, 58px); font-weight: 600; line-height: 1.08; letter-spacing: -.4px; margin-bottom: 18px; }
        .landing-page-upload-root h2 em { font-style: italic; color: var(--teal); }
        .landing-page-upload-root .sdesc { font-size: 15px; line-height: 1.85; color: var(--off2); max-width: 520px; font-weight: 300; }
        .landing-page-upload-root .divider { width: 100%; height: .5px; background: var(--line); }

        .landing-page-upload-root .flow-wrap { margin-top: 70px; position: relative; }
        .landing-page-upload-root .flow-wrap::before { content: ''; position: absolute; top: 44px; left: calc(12.5% - 1px); right: calc(12.5% - 1px); height: .5px; background: linear-gradient(90deg, transparent, var(--teal), var(--teal), var(--teal), transparent); opacity: .3; pointer-events: none; }
        .landing-page-upload-root .flow-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; }
        .landing-page-upload-root .flow-step { background: var(--ink2); padding: 28px 22px 24px; border: .5px solid var(--line); transition: all .25s; cursor: default; position: relative; overflow: hidden; }
        .landing-page-upload-root .flow-step:first-child { border-radius: 12px 0 0 12px; }
        .landing-page-upload-root .flow-step:last-child { border-radius: 0 12px 12px 0; }
        .landing-page-upload-root .flow-step:hover { background: var(--ink3); border-color: var(--line2); }
        .landing-page-upload-root .flow-step::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--teal), rgba(14,194,142,0)); opacity: 0; transition: opacity .3s; }
        .landing-page-upload-root .flow-step:hover::after { opacity: 1; }
        .landing-page-upload-root .fs-num { font-family: var(--mono); font-size: 10px; color: var(--teal); letter-spacing: 2px; margin-bottom: 16px; display: block; }
        .landing-page-upload-root .fs-icon { font-size: 24px; display: block; margin-bottom: 14px; }
        .landing-page-upload-root .fs-title { font-size: 13px; font-weight: 500; color: var(--off); margin-bottom: 6px; line-height: 1.3; }
        .landing-page-upload-root .fs-desc { font-size: 11px; color: var(--off3); line-height: 1.6; }
        .landing-page-upload-root .fs-rab { margin-top: 12px; font-family: var(--mono); font-size: 11px; color: var(--teal); }

        .landing-page-upload-root .calc-bg { background: var(--ink2); }
        .landing-page-upload-root .calc-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; margin-top: 70px; }
        .landing-page-upload-root .calc-panel { background: var(--ink); border-radius: 16px; border: .5px solid var(--line2); padding: 36px; position: sticky; top: 80px; }
        .landing-page-upload-root .cp-title { font-family: var(--serif); font-size: 20px; font-weight: 600; color: var(--off); margin-bottom: 4px; }
        .landing-page-upload-root .cp-sub { font-size: 12px; color: var(--off3); margin-bottom: 28px; }
        .landing-page-upload-root .calc-field { margin-bottom: 18px; }
        .landing-page-upload-root .cf-label { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--off3); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .landing-page-upload-root .cf-val { font-family: var(--mono); color: var(--teal); font-weight: 500; }
        .landing-page-upload-root input[type=range] { width: 100%; accent-color: var(--teal); cursor: pointer; }
        .landing-page-upload-root .calc-result { margin-top: 28px; padding: 24px; background: rgba(14,194,142,.05); border-radius: 12px; border: .5px solid rgba(14,194,142,.2); }
        .landing-page-upload-root .cr-rows { display: flex; flex-direction: column; gap: 10px; }
        .landing-page-upload-root .cr-row { display: flex; justify-content: space-between; align-items: center; }
        .landing-page-upload-root .cr-l { font-size: 13px; color: var(--off2); }
        .landing-page-upload-root .cr-v { font-family: var(--mono); font-size: 13px; font-weight: 500; }
        .landing-page-upload-root .cr-earn { color: var(--teal); }
        .landing-page-upload-root .cr-spend { color: var(--red); }
        .landing-page-upload-root .cr-div { height: .5px; background: rgba(14,194,142,.15); margin: 6px 0; }
        .landing-page-upload-root .cr-net { font-size: 16px; font-weight: 600; }
        .landing-page-upload-root .cr-net.pos { color: var(--teal); }
        .landing-page-upload-root .cr-net.neg { color: var(--red); }
        .landing-page-upload-root .cr-monthly { margin-top: 20px; padding-top: 20px; border-top: .5px solid var(--line); text-align: center; }
        .landing-page-upload-root .crm-label { font-size: 11px; color: var(--off3); margin-bottom: 4px; }
        .landing-page-upload-root .crm-val { font-family: var(--serif); font-size: 38px; font-weight: 700; color: var(--goldl); letter-spacing: -1px; }
        .landing-page-upload-root .crm-unit { font-size: 13px; color: var(--gold); margin-left: 4px; }
        .landing-page-upload-root .crm-note { font-size: 11px; color: var(--off3); margin-top: 4px; }
        
        .landing-page-upload-root .reward-details { display: flex; flex-direction: column; gap: 20px; }
        .landing-page-upload-root .rd-card { background: var(--ink); border-radius: 14px; border: .5px solid var(--line); padding: 28px 30px; transition: border-color .2s; }
        .landing-page-upload-root .rd-card:hover { border-color: var(--line2); }
        .landing-page-upload-root .rd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .landing-page-upload-root .rd-icon { font-size: 22px; }
        .landing-page-upload-root .rd-rab { font-family: var(--mono); font-size: 16px; font-weight: 500; }
        .landing-page-upload-root .rd-title { font-family: var(--serif); font-size: 18px; font-weight: 600; color: var(--off); margin-bottom: 8px; }
        .landing-page-upload-root .rd-desc { font-size: 13px; color: var(--off2); line-height: 1.7; font-weight: 300; }
        .landing-page-upload-root .rd-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
        .landing-page-upload-root .rd-tag { font-size: 10px; padding: 3px 9px; border-radius: 4px; border: .5px solid var(--line2); color: var(--off3); letter-spacing: .3px; }

        .landing-page-upload-root .tiers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-top: 70px; }
        .landing-page-upload-root .tier-card { padding: 36px 28px; border: .5px solid var(--line); transition: all .25s; position: relative; overflow: hidden; }
        .landing-page-upload-root .tier-card:first-child { border-radius: 12px 0 0 12px; }
        .landing-page-upload-root .tier-card:last-child { border-radius: 0 12px 12px 0; }
        .landing-page-upload-root .tier-card.t-gold { background: linear-gradient(160deg, #1a1400, var(--ink2)); }
        .landing-page-upload-root .tier-card.t-silver { background: linear-gradient(160deg, #111820, var(--ink2)); }
        .landing-page-upload-root .tier-card.t-bronze { background: linear-gradient(160deg, #140e00, var(--ink2)); }
        .landing-page-upload-root .tier-card.t-none { background: var(--ink2); }
        .landing-page-upload-root .tier-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,.4); }
        .landing-page-upload-root .tier-emoji { font-size: 32px; display: block; margin-bottom: 16px; }
        .landing-page-upload-root .tier-name { font-family: var(--serif); font-size: 22px; font-weight: 600; margin-bottom: 6px; }
        .landing-page-upload-root .tier-score { font-size: 11px; color: var(--off3); margin-bottom: 20px; letter-spacing: .5px; }
        .landing-page-upload-root .tier-rab { margin-bottom: 20px; }
        .landing-page-upload-root .tier-rab .big { font-family: var(--serif); font-size: 44px; font-weight: 700; letter-spacing: -1px; line-height: 1; }
        .landing-page-upload-root .tier-rab .unit { font-size: 14px; font-weight: 600; margin-left: 4px; }
        .landing-page-upload-root .tier-req { display: flex; flex-direction: column; gap: 7px; }
        .landing-page-upload-root .tier-req-item { font-size: 11px; color: var(--off3); display: flex; align-items: flex-start; gap: 7px; line-height: 1.5; }
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
        .landing-page-upload-root .pol-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 22px; }
        .landing-page-upload-root .pol-title { font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--off); margin-bottom: 12px; }
        .landing-page-upload-root .pol-desc { font-size: 13px; color: var(--off2); line-height: 1.75; font-weight: 300; margin-bottom: 20px; }
        .landing-page-upload-root .pol-rules { display: flex; flex-direction: column; gap: 8px; }
        .landing-page-upload-root .pol-rule { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--off3); line-height: 1.5; }
        .landing-page-upload-root .pr-ok { color: var(--teal); } .landing-page-upload-root .pr-no { color: var(--red); }

        .landing-page-upload-root .pipe-wrap { margin-top: 70px; position: relative; }
        .landing-page-upload-root .pipe-line { position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent 2%, var(--teal) 5%, var(--teal) 95%, transparent 98%); opacity: .2; transform: translateY(-50%); pointer-events: none; z-index: 0; }
        .landing-page-upload-root .pipe-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; position: relative; z-index: 1; }
        .landing-page-upload-root .pipe-node { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .landing-page-upload-root .pn-dot { width: 52px; height: 52px; border-radius: 50%; border: .5px solid; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 14px; background: var(--ink2); position: relative; transition: all .3s; }
        .landing-page-upload-root .pn-dot.pass { border-color: rgba(14,194,142,.4); box-shadow: 0 0 20px rgba(14,194,142,.1); }
        .landing-page-upload-root .pn-dot.warn { border-color: rgba(212,146,12,.4); box-shadow: 0 0 20px rgba(212,146,12,.1); }
        .landing-page-upload-root .pn-dot.fail { border-color: rgba(224,82,82,.4); box-shadow: 0 0 20px rgba(224,82,82,.1); }
        .landing-page-upload-root .pn-dot::after { content: ''; position: absolute; right: -16px; top: 50%; transform: translateY(-50%); width: 14px; height: 1px; background: var(--off3); opacity: .3; }
        .landing-page-upload-root .pipe-node:last-child .pn-dot::after { display: none; }
        .landing-page-upload-root .pn-title { font-size: 12px; font-weight: 500; color: var(--off); margin-bottom: 5px; }
        .landing-page-upload-root .pn-desc { font-size: 10px; color: var(--off3); line-height: 1.5; }
        .landing-page-upload-root .pn-badge { margin-top: 8px; font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: .5px; }
        .landing-page-upload-root .pb-pass { background: var(--teald); color: var(--teal); }
        .landing-page-upload-root .pb-warn { background: rgba(212,146,12,.12); color: #d4920c; }
        .landing-page-upload-root .pb-fail { background: var(--redd); color: var(--red); }

        .landing-page-upload-root .faq-wrap { margin-top: 64px; max-width: 720px; }
        .landing-page-upload-root .faq-item { border-bottom: .5px solid var(--line); overflow: hidden; }
        .landing-page-upload-root .faq-q { padding: 20px 0; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: color .2s; }
        .landing-page-upload-root .faq-q:hover { color: var(--teal); }
        .landing-page-upload-root .faq-q-text { font-size: 15px; font-weight: 500; color: var(--off); }
        .landing-page-upload-root .faq-arrow { width: 20px; height: 20px; border-radius: 50%; border: .5px solid var(--line2); display: flex; align-items: center; justify-content: center; color: var(--off3); font-size: 11px; transition: all .3s; flex-shrink: 0; }
        .landing-page-upload-root .faq-a { font-size: 14px; color: var(--off2); line-height: 1.8; font-weight: 300; max-height: 0; overflow: hidden; transition: max-height .4s var(--ease), padding .4s; }
        .landing-page-upload-root .faq-a.open { max-height: 200px; padding-bottom: 20px; }
        .landing-page-upload-root .faq-item.open .faq-arrow { transform: rotate(45deg); border-color: var(--teal); color: var(--teal); }

        .landing-page-upload-root .cta-sec { padding: 140px 52px; text-align: center; position: relative; overflow: hidden; }
        .landing-page-upload-root .cta-glow { position: absolute; inset: 0; background: radial-gradient(ellipse 50% 60% at 50% 50%, rgba(14,194,142,.07) 0%, transparent 70%); pointer-events: none; }
        .landing-page-upload-root .cta-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
        .landing-page-upload-root .cta-sec h2 { font-size: clamp(42px, 5vw, 68px); margin-bottom: 20px; }
        .landing-page-upload-root .cta-sec .sdesc { margin: 0 auto 40px; text-align: center; }
        .landing-page-upload-root .cta-btns { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .landing-page-upload-root .btn-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--teal); color: var(--ink); font-size: 15px; font-weight: 600; padding: 14px 30px; border-radius: 8px; text-decoration: none; transition: all .2s; }
        .landing-page-upload-root .btn-cta:hover { background: var(--teal2); box-shadow: 0 6px 32px var(--tealg); transform: translateY(-2px); }
        .landing-page-upload-root .btn-cta svg { transition: transform .2s; }
        .landing-page-upload-root .btn-cta:hover svg { transform: translateX(3px); }
        .landing-page-upload-root .btn-cta2 { display: inline-flex; align-items: center; gap: 8px; border: .5px solid var(--line2); color: var(--off2); font-size: 15px; padding: 13px 26px; border-radius: 8px; text-decoration: none; transition: all .2s; }
        .landing-page-upload-root .btn-cta2:hover { border-color: rgba(255,255,255,.25); color: var(--off); }
        .landing-page-upload-root .cta-note { font-size: 12px; color: var(--off3); margin-top: 18px; }
        .landing-page-upload-root .cta-note a { color: var(--teal); text-decoration: none; }

        .landing-page-upload-root footer { background: var(--ink); border-top: .5px solid var(--line); padding: 60px 52px 36px; }
        .landing-page-upload-root .foot-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 56px; margin-bottom: 56px; }
        .landing-page-upload-root .flogo { font-family: var(--serif); font-size: 22px; font-weight: 600; color: var(--off); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .landing-page-upload-root .flogo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); }
        .landing-page-upload-root .fdesc { font-size: 13px; color: var(--off3); line-height: 1.7; font-weight: 300; max-width: 240px; }
        .landing-page-upload-root .fcol-t { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--off3); margin-bottom: 18px; opacity: .6; }
        .landing-page-upload-root .flinks { list-style: none; display: flex; flex-direction: column; gap: 9px; }
        .landing-page-upload-root .flinks a { font-size: 13px; color: var(--off3); text-decoration: none; transition: color .2s; }
        .landing-page-upload-root .flinks a:hover { color: var(--off); }
        .landing-page-upload-root .foot-bot { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding-top: 28px; border-top: .5px solid var(--line); }
        .landing-page-upload-root .fcopy { font-size: 12px; color: var(--off3); opacity: .5; }
        .landing-page-upload-root .frab { font-family: var(--mono); font-size: 10px; color: var(--gold); opacity: .5; letter-spacing: 1px; }

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
        <a href="#" className="logo">
          <span className="logo-dot"></span>RabTube
        </a>
        <div className="nav-links">
          <a href="#flow">업로드 방법</a>
          <a href="#rewards">보상 계산기</a>
          <a href="#tiers">품질 등급</a>
          <a href="#faq">FAQ</a>
          <Link href="/auth/register" className="btn-start">
            지금 업로드
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="top">
        <div className="hero-glow"></div>
        <div className="hero-grid"></div>
        <div className="hero-wrap">
          {/* LEFT */}
          <div>
            <p className="eyebrow">치과 개원의 전용 수익형 플랫폼</p>
            <h1>내 케이스의<br/><em>가격은 내가 정한다</em><br/>수익형 업로드</h1>
            <p className="hero-sub">
              당신의 진료 케이스에 <strong>직접 가격을 설정</strong>하세요.<br/>
              동료가 시청할 때마다 수익이 자동 적립됩니다.<br/>
              케이스 10건 × 월 20회 시청 = <strong>월 700+ RAB 패시브 인컴</strong>
            </p>
            <div className="hero-cta">
              <Link href="/auth/register" className="btn-hero">
                지금 수익 시작하기
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#rewards" className="btn-learn">
                수익 시뮬레이션 해보기
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
              </a>
            </div>
            <div className="reward-row">
              <div className="rpill rpill-g">💰 가격 자율 설정 (1~100 RAB)</div>
              <div className="rpill rpill-y">🏆 업로드 보상 최대 +30 RAB</div>
              <div className="rpill rpill-s">🪙 시청마다 자동 수익 적립</div>
            </div>
          </div>
          {/* RIGHT: Upload UI Card */}
          <div className="upload-card" id="heroCard">
            <div className="uc-header">
              <div className="uc-dots"><div className="ucd ucdr"></div><div className="ucd ucdy"></div><div className="ucd ucdg"></div></div>
              <span className="uc-title">케이스 업로드</span>
              <span style={{fontSize: '10px', color: 'var(--off3)'}}>rabtube.vercel.app</span>
            </div>
            <div className="uc-body">
              {/* Dropzone state */}
              <div className="dropzone" id="dz" style={{ display: uploadState === 'idle' ? 'block' : 'none' }}>
                <span className="dz-icon">📁</span>
                <div className="dz-text">케이스 영상을 드래그하거나 선택</div>
                <div className="dz-sub">MP4, MOV, AVI · 최대 2GB</div>
                <div className="dz-btn">파일 선택</div>
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
                <div className="up-pct" id="upPct">{uploadProgress}% 업로드 중...</div>
              </div>
              
              {/* Done state */}
              <div className="done-state" id="doneState" style={{ display: uploadState === 'done' ? 'block' : 'none' }}>
                <span className="done-icon">✅</span>
                <div className="done-title">업로드 완료!</div>
                <div className="done-sub">AI 품질 검수가 시작됩니다.<br/>48시간 후 보상이 확정됩니다.</div>
                <div className="done-rab">🪙 +10 RAB 적립 예정</div>
              </div>
              
              {/* Form */}
              <div id="formArea" style={{ display: uploadState === 'idle' ? 'block' : 'none' }}>
                <div className="field-row">
                  <div className="field">
                    <label>카테고리</label>
                    <select id="catSel" value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
                      <option>임플란트</option><option>보철</option><option>치주</option><option>교정</option><option>보존</option><option>소아</option><option>구강외과</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>치아 번호</label>
                    <input type="text" placeholder="예) #16" id="toothInp" />
                  </div>
                </div>
                <div className="field">
                  <label>케이스 제목</label>
                  <input 
                    type="text" 
                    id="titleInp" 
                    placeholder="상악 구치부 임플란트 즉시 식립" 
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
                    <label>공개 설정</label>
                    <select><option>회원 전용</option><option>비공개</option><option>전체 공개</option></select>
                  </div>
                  <div className="field">
                    <label>난이도</label>
                    <select id="diffSel" value={uploadDiff} onChange={(e) => setUploadDiff(e.target.value)}>
                      <option>초급</option><option>중급</option><option>고급</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>💰 시청 가격 설정 (RAB)</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <input type="range" min="1" max="20" defaultValue="5" style={{flex: 1}} />
                    <span style={{color: 'var(--teal)', fontWeight: 600, fontFamily: 'var(--mono)', fontSize: '14px', minWidth: '55px'}}>5 RAB</span>
                  </div>
                  <div style={{fontSize: '10px', color: 'var(--off3)', marginTop: '4px'}}>시청 1회당 수익 · 학습자가 이 가격을 지불합니다</div>
                </div>
                <div className="reward-preview">
                  <div className="rp-title">📊 예상 수익 시뮬레이션</div>
                  <div className="rp-rows">
                    <div className="rp-row"><span className="rp-label">업로드 보상</span><span className="rp-val">+10 RAB</span></div>
                    <div className="rp-row"><span className="rp-label">품질 보너스 (예상)</span><span className="rp-val" id="qualBonus">+{demoBonus} RAB</span></div>
                    <div className="rp-row"><span className="rp-label" style={{color: 'var(--teal)'}}>월 시청 수익 (20회 × 5 RAB)</span><span className="rp-val" style={{color: 'var(--teal)'}}>+70 RAB</span></div>
                    <div className="rp-divider"></div>
                    <div className="rp-row"><span className="rp-label" style={{fontWeight: 600, color: 'var(--off)'}}>월 예상 총수익</span><span className="rp-total" id="totalBonus">{10 + demoBonus + 70} RAB</span></div>
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
                케이스 업로드 시작
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* UPLOAD FLOW */}
      <section id="flow">
        <div className="si">
          <p className="sk rv">업로드 → 수익화 플로우</p>
          <h2 className="rv d1">업로드부터 수익까지<br/><em>5단계</em></h2>
          <div className="sdesc rv d2">케이스를 올리고 가격을 설정하는 순간부터 패시브 인컴이 시작됩니다.</div>
          <div className="flow-wrap">
            <div className="flow-grid">
              <div className="flow-step rv d1"><span className="fs-num">STEP 01</span><span className="fs-icon">📁</span><div className="fs-title">케이스 영상 업로드</div><div className="fs-desc">영상을 선택하고 카테고리·난이도 등 메타데이터를 입력합니다.</div></div>
              <div className="flow-step rv d2"><span className="fs-num">STEP 02</span><span className="fs-icon">💰</span><div className="fs-title">시청 가격 직접 설정</div><div className="fs-desc">내 케이스의 가치를 내가 결정합니다. 1~100 RAB 범위에서 자유롭게 설정하세요.</div><div className="fs-rab" style={{color: 'var(--teal)'}}>핵심: 가격 결정권은 업로더에게</div></div>
              <div className="flow-step rv d3"><span className="fs-num">STEP 03</span><span className="fs-icon">🤖</span><div className="fs-title">AI 품질 검수 + 등급</div><div className="fs-desc">AI가 48시간 내 자동 검수. Gold/Silver/Bronze 등급에 따라 10~30 RAB 업로드 보상 확정.</div><div className="fs-rab">→ 업로드 보상 +10~30 RAB</div></div>
              <div className="flow-step rv d4"><span className="fs-num">STEP 04</span><span className="fs-icon">▶️</span><div className="fs-title">동료 시청 → 자동 수익</div><div className="fs-desc">다른 치과의사가 시청할 때마다 설정한 가격(수수료 제외)이 즉시 내 계정에 적립됩니다.</div><div className="fs-rab" style={{color: 'var(--teal)'}}>시청마다 자동 수익 발생!</div></div>
              <div className="flow-step rv d5"><span className="fs-num">STEP 05</span><span className="fs-icon">📈</span><div className="fs-title">패시브 인컴 누적</div><div className="fs-desc">케이스가 쌓일수록 수익은 기하급수적으로 증가합니다. RAB는 현금 충전 및 향후 환전도 가능.</div><div className="fs-rab" style={{color: 'var(--gold)'}}>10건 × 월 20회 = 700+ RAB/월</div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* REWARD CALCULATOR */}
      <section id="rewards" className="calc-bg">
        <div className="si">
          <p className="sk rv">💰 수익 시뮬레이터</p>
          <h2 className="rv d1">내 케이스로<br/><em>얼마나 벌 수 있을까?</em></h2>
          <div className="calc-layout">
            {/* Calculator */}
            <div className="calc-panel rvl">
              <div className="cp-title">월 수익 시뮬레이터</div>
              <div className="cp-sub">슬라이더를 조정해 예상 월 수익을 확인하세요</div>

              <div className="calc-field">
                <div className="cf-label">월 업로드 건수 <span className="cf-val">{uploads}건</span></div>
                <input type="range" min="1" max="10" value={uploads} onChange={(e) => setUploads(parseInt(e.target.value))} />
              </div>
              <div className="calc-field">
                <div className="cf-label">평균 품질 점수 <span className="cf-val">{quality}점</span></div>
                <input type="range" min="0" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} />
              </div>
              <div className="calc-field">
                <div className="cf-label">케이스당 월 시청 수 <span className="cf-val">{views}회</span></div>
                <input type="range" min="0" max="100" value={views} onChange={(e) => setViews(parseInt(e.target.value))} />
              </div>
              <div className="calc-field">
                <div className="cf-label">내 월 시청 소비 <span className="cf-val">{spend}건</span></div>
                <input type="range" min="0" max="60" value={spend} onChange={(e) => setSpend(parseInt(e.target.value))} />
              </div>
              <div className="calc-field">
                <div className="cf-label">평균 열람 가격 설정 <span className="cf-val">{casePrice} RAB</span></div>
                <input type="range" min="1" max="20" value={casePrice} onChange={(e) => setCasePrice(parseInt(e.target.value))} />
              </div>

              <div className="calc-result">
                <div className="cr-rows">
                  <div className="cr-row"><span className="cr-l">업로드 보상</span><span className="cr-v cr-earn">+{uploadEarn} RAB</span></div>
                  <div className="cr-row"><span className="cr-l">시청 수익 (수수료 제외)</span><span className="cr-v cr-earn">+{viewEarn} RAB</span></div>
                  <div className="cr-row"><span className="cr-l">시청 소비 ({casePrice} RAB/건)</span><span className="cr-v cr-spend">-{spendCost} RAB</span></div>
                  <div className="cr-div"></div>
                  <div className="cr-row"><span className="cr-l" style={{fontWeight: 500}}>월 순 획득</span><span className={`cr-v cr-net ${netRab >= 0 ? 'pos' : 'neg'}`}>{netRab >= 0 ? '+' : ''}{netRab} RAB</span></div>
                </div>
                <div className="cr-monthly">
                  <div className="crm-label">월 누적 RAB</div>
                  <div><span className="crm-val">{Math.max(0, netRab)}</span><span className="crm-unit">RAB</span></div>
                  <div className="crm-note">
                    {netRab > 200 ? '훌륭합니다! 꾸준히 올리세요 🏆' : netRab > 50 ? '좋은 출발입니다 👍' : netRab > 0 ? '업로드를 늘려보세요' : '시청보다 업로드를 늘려보세요'}
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
                <div className="rd-title">업로드 보상</div>
                <p className="rd-desc">케이스 업로드 후 AI 품질 검수를 통과하면 48시간 후 보상이 확정됩니다. 기본 10 RAB에 품질 점수에 따라 최대 20 RAB 보너스가 추가됩니다.</p>
                <div className="rd-tags"><span className="rd-tag">48h 검수 후 확정</span><span className="rd-tag">월 10건 상한</span><span className="rd-tag">신규 회원 50% 적용</span></div>
              </div>
              <div className="rd-card rv d2">
                <div className="rd-header">
                  <span className="rd-icon">▶️</span>
                  <span className="rd-rab" style={{color: 'var(--teal)'}}>가격 자율 설정</span>
                </div>
                <div className="rd-title">시청료 자동 배분</div>
                <p className="rd-desc">다른 회원이 내 케이스를 시청하면 내가 설정한 가격에서 플랫폼 수수료를 제외한 금액이 즉시 내 계정에 적립됩니다. 케이스가 쌓일수록 패시브 인컴이 늘어납니다.</p>
                <div className="rd-tags"><span className="rd-tag">즉시 적립</span><span className="rd-tag">수익 분배</span><span className="rd-tag">본인 케이스 제외</span></div>
              </div>
              <div className="rd-card rv d3">
                <div className="rd-header">
                  <span className="rd-icon">❤️</span>
                  <span className="rd-rab" style={{color: 'var(--teal)'}}>+1 RAB / 좋아요</span>
                </div>
                <div className="rd-title">좋아요 수신 보상</div>
                <p className="rd-desc">케이스에 좋아요를 받을 때마다 1 RAB이 즉시 적립됩니다. 고품질 케이스일수록 더 많은 좋아요를 받아 추가 수익이 발생합니다.</p>
                <div className="rd-tags"><span className="rd-tag">즉시 적립</span><span className="rd-tag">자기 케이스 자기 좋아요 제외</span></div>
              </div>
              <div className="rd-card rv d4">
                <div className="rd-header">
                  <span className="rd-icon">🏅</span>
                  <span className="rd-rab" style={{color: 'var(--goldl)'}}>최대 +20 RAB</span>
                </div>
                <div className="rd-title">품질 보너스</div>
                <p className="rd-desc">48시간 후 시청 완료율과 좋아요율을 반영한 최종 품질 점수가 산정됩니다. 점수 구간에 따라 Gold(+20), Silver(+14), Bronze(+6) 보너스가 추가 지급됩니다.</p>
                <div className="rd-tags"><span className="rd-tag">48h 후 지급</span><span className="rd-tag">완료율 반영</span><span className="rd-tag">누적 적립</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* QUALITY TIERS */}
      <section id="tiers">
        <div className="si">
          <p className="sk rv">품질 등급</p>
          <h2 className="rv d1">케이스 품질에 따라<br/><em>보상이 달라집니다</em></h2>
          <p className="sdesc rv d2">AI 검수 점수(50점)와 48시간 커뮤니티 반응(50점)을 합산해 등급이 결정됩니다.</p>
          <div className="tiers-grid">
            <div className="tier-card t-gold rv d1">
              <span className="tier-emoji">🥇</span>
              <div className="tier-name">Gold</div>
              <div className="tier-score">85점 이상</div>
              <div className="tier-rab"><span className="big">+30</span><span className="unit">RAB</span></div>
              <div className="tier-req">
                <div className="tier-req-item">시청 완료율 80% 이상</div>
                <div className="tier-req-item">좋아요율 15% 이상</div>
                <div className="tier-req-item">AI 검수 만점 수준</div>
                <div className="tier-req-item">신고 0건</div>
              </div>
            </div>
            <div className="tier-card t-silver rv d2">
              <span className="tier-emoji">🥈</span>
              <div className="tier-name">Silver</div>
              <div className="tier-score">70~84점</div>
              <div className="tier-rab"><span className="big">+24</span><span className="unit">RAB</span></div>
              <div className="tier-req">
                <div className="tier-req-item">시청 완료율 65% 이상</div>
                <div className="tier-req-item">좋아요율 8% 이상</div>
                <div className="tier-req-item">AI 검수 양호</div>
                <div className="tier-req-item">신고 0~1건</div>
              </div>
            </div>
            <div className="tier-card t-bronze rv d3">
              <span className="tier-emoji">🥉</span>
              <div className="tier-name">Bronze</div>
              <div className="tier-score">50~69점</div>
              <div className="tier-rab"><span className="big">+16</span><span className="unit">RAB</span></div>
              <div className="tier-req">
                <div className="tier-req-item">시청 완료율 40% 이상</div>
                <div className="tier-req-item">AI 검수 기본 통과</div>
                <div className="tier-req-item">신고 1건 이하</div>
                <div className="tier-req-item">2분 이상 영상</div>
              </div>
            </div>
            <div className="tier-card t-none rv d4">
              <span className="tier-emoji">📋</span>
              <div className="tier-name">기본</div>
              <div className="tier-score">검수 통과</div>
              <div className="tier-rab"><span className="big">+10</span><span className="unit">RAB</span></div>
              <div className="tier-req">
                <div className="tier-req-item">AI 검수 통과</div>
                <div className="tier-req-item">치과 콘텐츠 확인</div>
                <div className="tier-req-item">얼굴 노출 없음</div>
                <div className="tier-req-item">중복 영상 아님</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* UPLOAD POLICY */}
      <section id="policy" className="policy-bg">
        <div className="si">
          <p className="sk rv">업로드 정책</p>
          <h2 className="rv d1">올려도 되는 것<br/><em>올리면 안 되는 것</em></h2>
          <div className="policy-grid">
            <div className="pol-card rv d1">
              <div className="pol-icon" style={{background: 'var(--teald)'}}>✅</div>
              <div className="pol-title">권장 콘텐츠</div>
              <p className="pol-desc">전문성 있는 치과 케이스 영상. 배우고 공유할 수 있는 내용이면 됩니다.</p>
              <div className="pol-rules">
                <div className="pol-rule"><span className="pr-ok">✓</span>임플란트 식립 과정 및 결과</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>복잡 발치 케이스 술식 영상</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>보철물 제작 및 세팅 과정</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>치주 수술 전·후 비교</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>교정 케이스 경과 관찰 기록</div>
                <div className="pol-rule"><span className="pr-ok">✓</span>구강 내 X-ray 해석 및 진단</div>
              </div>
            </div>
            <div className="pol-card rv d2">
              <div className="pol-icon" style={{background: 'var(--redd)'}}>🚫</div>
              <div className="pol-title">금지 콘텐츠</div>
              <p className="pol-desc">환자 프라이버시와 플랫폼 신뢰를 해치는 콘텐츠는 즉시 비공개 처리됩니다.</p>
              <div className="pol-rules">
                <div className="pol-rule"><span className="pr-no">✗</span>환자 얼굴·이름 노출 영상</div>
                <div className="pol-rule"><span className="pr-no">✗</span>치과와 무관한 일반 콘텐츠</div>
                <div className="pol-rule"><span className="pr-no">✗</span>2분 미만의 짧은 클립</div>
                <div className="pol-rule"><span className="pr-no">✗</span>동일 영상 중복 업로드</div>
                <div className="pol-rule"><span className="pr-no">✗</span>정지 화면 또는 흑백 영상</div>
                <div className="pol-rule"><span className="pr-no">✗</span>허위·과장된 케이스 설명</div>
              </div>
            </div>
            <div className="pol-card rv d3">
              <div className="pol-icon" style={{background: 'var(--goldd)'}}>⚠️</div>
              <div className="pol-title">보상 정책</div>
              <p className="pol-desc">공정한 보상 시스템을 위한 제한 사항입니다. 어뷰징 방지 장치가 내장되어 있습니다.</p>
              <div className="pol-rules">
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>월 업로드 보상 상한: 10건</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>보상 지급: 검수 후 48시간 대기</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>신규 3개월: 보상 50% 적용</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>불량 판정: 보상 취소 + 패널티</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>신고 3회 이상: 자동 비공개</div>
                <div className="pol-rule"><span style={{color: 'var(--gold)'}}>·</span>허위 신고자: RAB 차감</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* AI PIPELINE */}
      <section id="ai">
        <div className="si">
          <p className="sk rv">AI 품질 파이프라인</p>
          <h2 className="rv d1">업로드 후<br/><em>자동 검수</em> 과정</h2>
          <p className="sdesc rv d2">Google Cloud Functions가 트리거되어 영상을 자동 분석합니다. 사람의 개입 없이 48시간 내 검수 완료.</p>
          <div className="pipe-wrap">
            <div className="pipe-line"></div>
            <div className="pipe-grid">
              <div className="pipe-node rv d1">
                <div className="pn-dot pass">📁</div>
                <div className="pn-title">Storage 업로드</div>
                <div className="pn-desc">Firebase Storage에 영상 저장</div>
                <span className="pn-badge pb-pass">트리거</span>
              </div>
              <div className="pipe-node rv d2">
                <div className="pn-dot pass">⏱</div>
                <div className="pn-title">길이 / 해시</div>
                <div className="pn-desc">ffprobe로 길이 추출, MD5 중복 감지</div>
                <span className="pn-badge pb-pass">자동</span>
              </div>
              <div className="pipe-node rv d3">
                <div className="pn-dot warn">🤖</div>
                <div className="pn-title">Video Intelligence</div>
                <div className="pn-desc">치과 콘텐츠 레이블 감지</div>
                <span className="pn-badge pb-warn">AI 분석</span>
              </div>
              <div className="pipe-node rv d4">
                <div className="pn-dot fail">🙈</div>
                <div className="pn-title">Vision API</div>
                <div className="pn-desc">얼굴 감지 — 노출 시 즉시 차단</div>
                <span className="pn-badge pb-fail">Privacy</span>
              </div>
              <div className="pipe-node rv d5">
                <div className="pn-dot pass">🏅</div>
                <div className="pn-title">등급 + 보상</div>
                <div className="pn-desc">점수 산정 후 RAB 자동 지급</div>
                <span className="pn-badge pb-pass">확정</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* FAQ */}
      <section id="faq">
        <div className="si">
          <p className="sk rv">자주 묻는 질문</p>
          <h2 className="rv d1">업로드에 대해<br/><em>궁금한 것들</em></h2>
          <div className="faq-wrap rv d2">
            {[
              { q: "영상 업로드 후 언제 RAB를 받을 수 있나요?", a: "업로드 즉시 pending 상태로 RAB가 예약됩니다. AI 품질 검수가 완료되고 48시간이 경과하면 자동으로 확정 지급됩니다. 포인트 내역 페이지에서 대기 중인 RAB를 확인할 수 있습니다." },
              { q: "AI 검수에서 실패하면 어떻게 되나요?", a: "검수 실패 시 케이스는 자동으로 비공개 처리됩니다. 업로드 보상은 지급되지 않으며, 반복 위반 시 패널티가 적용될 수 있습니다. 실패 이유는 알림으로 상세히 안내됩니다. 수정 후 재업로드가 가능합니다." },
              { q: "환자 프라이버시는 어떻게 보호하나요?", a: "Google Vision API가 자동으로 얼굴을 감지하여 환자 얼굴이 포함된 영상은 업로드 단계에서 차단합니다. 또한 모든 케이스는 기본적으로 '회원 전용' 공개로 설정되어 치과 면허 인증 회원만 시청 가능합니다. 원하시면 '비공개' 설정도 가능합니다." },
              { q: "월 업로드 건수에 제한이 있나요?", a: "RAB 보상은 월 10건까지 지급됩니다. 10건 초과 업로드는 피드에 공개되지만 보상은 다음 달로 이월됩니다. 이는 어뷰징 방지와 토큰 공급량 조절을 위한 정책입니다. 추후 구독 등급에 따라 상한이 확대될 예정입니다." },
              { q: "RAB 토큰은 어떻게 사용하나요?", a: "현재 RAB는 업로더가 설정한 가격에 따라 케이스 시청에 사용할 수 있으며, 현금 결제로 충전이 가능합니다. 다운로드, 홍보 부스트 등 다양한 기능에도 활용될 예정입니다. 향후 현금 환전 기능 및 블록체인 기반 실거래 토큰 전환이 계획되어 있습니다." },
              { q: "가입하려면 무엇이 필요한가요?", a: "치과 면허 번호, 이메일, 병원명, 지역 정보로 가입할 수 있습니다. 치과 면허를 보유한 개원의만 가입 가능하며, 인증 완료 즉시 50 RAB 가입 보너스가 지급됩니다. 별도 결제 없이 무료로 시작하실 수 있습니다." }
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
          <p className="sk rv" style={{justifyContent: 'center'}}>내 케이스로 수익을 시작하세요</p>
          <h2 className="rv">가입 즉시 <em>50 RAB</em><br/>가격은 <em>내가 결정</em></h2>
          <p className="sdesc rv d2" style={{textAlign: 'center', margin: '0 auto 40px'}}>무료 가입 후 첫 케이스를 올리고 가격을 설정하세요.<br/>시청될 때마다 수익이 자동으로 쌓입니다.</p>
          <div className="cta-btns rv d3">
            <Link href="/auth/register" className="btn-cta">
              무료 가입 후 수익 시작하기
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/auth/login" className="btn-cta2">이미 회원이신가요?</Link>
          </div>
          <p className="cta-note rv d4">면허 번호로 인증 · 영구 무료 · 가격 자율 설정 · <a href="#">개인정보처리방침</a></p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-inner">
          <div>
            <div className="flogo"><span className="flogo-dot"></span>RabTube</div>
            <p className="fdesc">치과 개원의를 위한 전문 케이스 영상 커뮤니티. 지식을 공유하고 함께 성장합니다.</p>
          </div>
          <div>
            <div className="fcol-t">플랫폼</div>
            <ul className="flinks"><li><a href="#">케이스 피드</a></li><li><a href="#">업로드</a></li><li><a href="#">내 케이스</a></li><li><a href="#">포인트 내역</a></li></ul>
          </div>
          <div>
            <div className="fcol-t">RAB 토큰</div>
            <ul className="flinks"><li><a href="#">토큰 정책</a></li><li><a href="#">보상 구조</a></li><li><a href="#">로드맵</a></li><li><a href="#">시뮬레이터</a></li></ul>
          </div>
          <div>
            <div className="fcol-t">회사</div>
            <ul className="flinks"><li><a href="#">소개</a></li><li><a href="#">이용약관</a></li><li><a href="#">개인정보처리방침</a></li><li><a href="#">문의하기</a></li></ul>
          </div>
        </div>
        <div className="foot-bot">
          <div className="fcopy">© 2025 RabTube. All rights reserved.</div>
          <div className="frab">RAB TOKEN · UPLOAD PLATFORM</div>
        </div>
      </footer>
    </div>
  );
}
