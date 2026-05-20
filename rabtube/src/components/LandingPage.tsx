'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  useEffect(() => {
    // Scroll reveal animation
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('vis');
            revealObserver.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll('.landing-page-root .rev, .landing-page-root .revl, .landing-page-root .revr');
    revealElements.forEach((el) => revealObserver.observe(el));

    // Score bars animate on reveal
    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll('.sbf').forEach((bar, i) => {
              const element = bar as HTMLElement;
              const w = element.dataset.w || '0';
              element.style.width = '0%';
              setTimeout(() => {
                element.style.width = `${w}%`;
              }, 100 + i * 150);
            });
            barObserver.unobserve(e.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    const scoreCard = document.querySelectorAll('.landing-page-root .scard');
    scoreCard.forEach((el) => barObserver.observe(el));

    // Nav scroll background transition
    const handleScroll = () => {
      const navEl = document.getElementById('landing-nav');
      if (navEl) {
        navEl.style.background = window.scrollY > 60 ? 'rgba(8,19,30,.97)' : 'rgba(8,19,30,.82)';
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Smooth anchor scroll
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.hash && anchor.hash.startsWith('#')) {
        const targetEl = document.querySelector(anchor.hash);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);

    return () => {
      revealObserver.disconnect();
      barObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return (
    <div className="landing-page-root">
      {/* SCOPED STYLE INJECTION */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono&display=swap');

        .landing-page-root {
          --ink: #08131e;
          --ink2: #0d1f30;
          --ink3: #132840;
          --teal: #0fba8c;
          --teal-glow: rgba(15,186,140,.18);
          --teal-dim: #0d3d2e;
          --gold: #c9a84c;
          --gold-lt: #e8c96a;
          --gold-dim: rgba(201,168,76,.12);
          --off: #f2ede6;
          --off2: #d8d0c4;
          --slate: #6e8fa8;
          --slate2: #4a6a82;
          --line: rgba(255,255,255,.07);
          --serif: 'Cormorant Garamond', Georgia, serif;
          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'DM Mono', monospace;
          --ease: cubic-bezier(.22, 1, .36, 1);

          font-family: var(--sans);
          background: var(--ink);
          color: var(--off);
          -webkit-font-smoothing: antialiased;
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .landing-page-root *, 
        .landing-page-root *::before, 
        .landing-page-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .landing-page-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: .022;
          pointer-events: none;
          z-index: 9999;
        }

        /* NAV */
        .landing-page-root nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 200;
          height: 60px;
          padding: 0 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(8,19,30,.82);
          backdrop-filter: blur(20px);
          border-bottom: .5px solid var(--line);
        }
        .landing-page-root .logo {
          font-family: var(--serif);
          font-size: 24px;
          font-weight: 600;
          color: var(--off);
          letter-spacing: -.3px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .landing-page-root .logo-chip {
          font-family: var(--sans);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          background: var(--teal-dim);
          color: var(--teal);
          padding: 3px 9px;
          border-radius: 20px;
        }
        .landing-page-root .nav-r {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .landing-page-root .nav-r a {
          font-size: 13px;
          color: var(--slate);
          text-decoration: none;
          transition: color .2s;
        }
        .landing-page-root .nav-r a:hover {
          color: var(--off);
        }
        .landing-page-root .btn-nav {
          background: transparent;
          border: .5px solid var(--teal);
          color: var(--teal) !important;
          padding: 7px 20px;
          border-radius: 6px;
          font-size: 13px !important;
          font-weight: 500 !important;
          transition: all .2s !important;
        }
        .landing-page-root .btn-nav:hover {
          background: var(--teal);
          color: var(--ink) !important;
          box-shadow: 0 0 20px var(--teal-glow);
        }

        /* HERO */
        .landing-page-root .hero {
          min-height: 100vh;
          padding: 140px 56px 100px;
          position: relative;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .landing-page-root .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse 80% 70% at 62% 35%, rgba(15,186,140,.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 15% 78%, rgba(201,168,76,.04) 0%, transparent 50%);
        }
        .landing-page-root .hero-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 70% 80% at 65% 40%, black 0%, transparent 70%);
        }
        .landing-page-root .hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .landing-page-root .kicker {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--teal);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .landing-page-root .kicker::before {
          content: '';
          width: 28px;
          height: 1px;
          background: var(--teal);
        }
        .landing-page-root h1 {
          font-family: var(--serif);
          font-size: clamp(44px, 5vw, 70px);
          font-weight: 600;
          line-height: 1.08;
          letter-spacing: -.5px;
          margin-bottom: 28px;
        }
        .landing-page-root h1 em {
          font-style: italic;
          color: var(--teal);
        }
        .landing-page-root .hero-desc {
          font-size: 16px;
          line-height: 1.78;
          color: var(--off2);
          max-width: 480px;
          margin-bottom: 44px;
          font-weight: 300;
        }
        .landing-page-root .hero-btns {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .landing-page-root .btn-p {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--teal);
          color: var(--ink);
          font-size: 14px;
          font-weight: 600;
          padding: 13px 28px;
          border-radius: 8px;
          text-decoration: none;
          transition: all .2s;
          letter-spacing: .2px;
        }
        .landing-page-root .btn-p:hover {
          background: #0da87d;
          box-shadow: 0 4px 28px var(--teal-glow);
          transform: translateY(-2px);
        }
        .landing-page-root .btn-p svg {
          transition: transform .2s;
        }
        .landing-page-root .btn-p:hover svg {
          transform: translateX(3px);
        }
        .landing-page-root .btn-g {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: .5px solid rgba(255,255,255,.15);
          color: var(--off2);
          font-size: 14px;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          transition: all .2s;
        }
        .landing-page-root .btn-g:hover {
          border-color: rgba(255,255,255,.3);
          color: var(--off);
        }
        .landing-page-root .hero-stats {
          display: flex;
          gap: 40px;
          margin-top: 52px;
          padding-top: 40px;
          border-top: .5px solid var(--line);
          opacity: 0;
          animation: fadeUp .9s var(--ease) .7s forwards;
        }
        .landing-page-root .stat-n {
          font-family: var(--serif);
          font-size: 36px;
          font-weight: 600;
          color: var(--off);
          letter-spacing: -1px;
          display: block;
        }
        .landing-page-root .stat-n span {
          font-size: 20px;
          color: var(--teal);
        }
        .landing-page-root .stat-l {
          font-size: 11px;
          color: var(--slate);
          letter-spacing: .5px;
          margin-top: 2px;
        }

        /* Mockup */
        .landing-page-root .hero-vis {
          opacity: 0;
          animation: fadeUp .9s var(--ease) .35s forwards;
          position: relative;
        }
        .landing-page-root .mf {
          background: var(--ink2);
          border-radius: 16px;
          border: .5px solid var(--line);
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,.5);
        }
        .landing-page-root .mb {
          height: 40px;
          background: var(--ink3);
          border-bottom: .5px solid var(--line);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 8px;
        }
        .landing-page-root .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .landing-page-root .dr { background: #e05555; }
        .landing-page-root .dy { background: #d4920c; }
        .landing-page-root .dg { background: var(--teal); }
        .landing-page-root .mu {
          flex: 1;
          height: 22px;
          background: rgba(255,255,255,.04);
          border-radius: 4px;
          margin-left: 8px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--slate);
        }
        .landing-page-root .mp {
          padding: 18px;
        }
        .landing-page-root .mh {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .landing-page-root .ml {
          font-family: var(--serif);
          font-size: 14px;
          color: var(--off);
          font-weight: 600;
        }
        .landing-page-root .mn {
          display: flex;
          gap: 6px;
        }
        .landing-page-root .mni {
          font-size: 9px;
          color: var(--slate);
          padding: 3px 7px;
          border-radius: 4px;
          background: rgba(255,255,255,.04);
        }
        .landing-page-root .mpi {
          background: var(--teal);
          color: var(--ink);
          font-size: 9px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .landing-page-root .mfil {
          display: flex;
          gap: 5px;
          margin-bottom: 12px;
        }
        .landing-page-root .mc {
          font-size: 9px;
          padding: 3px 9px;
          border-radius: 20px;
          border: .5px solid rgba(255,255,255,.1);
          color: var(--slate);
        }
        .landing-page-root .mc.on {
          background: var(--teal-dim);
          border-color: var(--teal);
          color: var(--teal);
        }
        .landing-page-root .mg {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 7px;
        }
        .landing-page-root .mcard {
          background: rgba(255,255,255,.03);
          border-radius: 7px;
          border: .5px solid var(--line);
          overflow: hidden;
        }
        .landing-page-root .mth {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          position: relative;
        }
        .landing-page-root .mbg {
          position: absolute;
          top: 5px;
          left: 5px;
          font-size: 7px;
          font-weight: 600;
          padding: 2px 5px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: .4px;
        }
        .landing-page-root .mdu {
          position: absolute;
          bottom: 4px;
          right: 4px;
          font-size: 8px;
          background: rgba(0,0,0,.6);
          color: rgba(255,255,255,.8);
          padding: 1px 4px;
          border-radius: 2px;
        }
        .landing-page-root .minfo {
          padding: 6px 7px;
        }
        .landing-page-root .mt {
          font-size: 9px;
          font-weight: 500;
          color: var(--off);
          line-height: 1.3;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .landing-page-root .mm {
          font-size: 8px;
          color: var(--slate);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .landing-page-root .mrab {
          margin-left: auto;
          font-size: 8px;
          color: var(--gold);
          font-weight: 500;
        }
        .landing-page-root .bimp { background: #0d3d2e; color: var(--teal); }
        .landing-page-root .bpro { background: #0d1e3d; color: #6ba3e8; }
        .landing-page-root .bper { background: #3d2d0d; color: #d4920c; }
        .landing-page-root .bort { background: #2d1a40; color: #b07ae8; }
        .landing-page-root .t1 { background: linear-gradient(135deg, #0d2a1f, #0a1929); }
        .landing-page-root .t2 { background: linear-gradient(135deg, #0a1929, #1a0d29); }
        .landing-page-root .t3 { background: linear-gradient(135deg, #2a1800, #0a1929); }
        .landing-page-root .t4 { background: linear-gradient(135deg, #0a1929, #001a2a); }
        .landing-page-root .t5 { background: linear-gradient(135deg, #1a0a1a, #0a1929); }
        .landing-page-root .t6 { background: linear-gradient(135deg, #001a10, #0a1929); }
        .landing-page-root .rab-float {
          position: absolute;
          top: -16px;
          right: -16px;
          background: var(--ink3);
          border: .5px solid var(--gold);
          border-radius: 10px;
          padding: 10px 14px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0,0,0,.4);
        }
        .landing-page-root .rf-amt {
          font-family: var(--serif);
          font-size: 22px;
          font-weight: 600;
          color: var(--gold-lt);
          display: block;
        }
        .landing-page-root .rf-lbl {
          font-size: 9px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--gold);
        }

        /* SECTIONS */
        .landing-page-root section {
          padding: 120px 56px;
          position: relative;
        }
        .landing-page-root .si {
          max-width: 1200px;
          margin: 0 auto;
        }
        .landing-page-root .sk {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--teal);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .landing-page-root .sk::before {
          content: '';
          width: 24px;
          height: 1px;
          background: var(--teal);
        }
        .landing-page-root h2 {
          font-family: var(--serif);
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -.3px;
          margin-bottom: 20px;
        }
        .landing-page-root h2 em {
          font-style: italic;
          color: var(--teal);
        }
        .landing-page-root .sdesc {
          font-size: 16px;
          line-height: 1.8;
          color: var(--off2);
          max-width: 540px;
          font-weight: 300;
        }
        .landing-page-root .divider {
          width: 100%;
          height: .5px;
          background: var(--line);
        }

        /* STEPS */
        .landing-page-root .steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          margin-top: 64px;
        }
        .landing-page-root .step {
          background: var(--ink2);
          padding: 40px 32px;
          position: relative;
          overflow: hidden;
          transition: background .25s;
          cursor: default;
        }
        .landing-page-root .step:hover {
          background: var(--ink3);
        }
        .landing-page-root .step::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--teal), transparent);
          opacity: 0;
          transition: opacity .3s;
        }
        .landing-page-root .step:hover::before {
          opacity: 1;
        }
        .landing-page-root .step:first-child {
          border-radius: 10px 0 0 10px;
        }
        .landing-page-root .step:last-child {
          border-radius: 0 10px 10px 0;
        }
        .landing-page-root .sn {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--teal);
          letter-spacing: 2px;
          margin-bottom: 24px;
          display: block;
        }
        .landing-page-root .si2 {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: var(--teal-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          font-size: 22px;
        }
        .landing-page-root .st {
          font-family: var(--serif);
          font-size: 22px;
          font-weight: 600;
          color: var(--off);
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .landing-page-root .sd {
          font-size: 14px;
          line-height: 1.7;
          color: var(--off2);
          font-weight: 300;
        }
        .landing-page-root .srab {
          margin-top: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--gold);
          background: var(--gold-dim);
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: 500;
        }

        /* FEATURES */
        .landing-page-root .fbg {
          background: var(--ink2);
        }
        .landing-page-root .fg {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          margin-top: 64px;
        }
        .landing-page-root .fc {
          background: var(--ink);
          padding: 48px 44px;
          position: relative;
          overflow: hidden;
          transition: background .2s;
        }
        .landing-page-root .fc:hover {
          background: var(--ink2);
        }
        .landing-page-root .fc::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: .5px;
          background: var(--line);
        }
        .landing-page-root .fn {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--slate2);
          letter-spacing: 2px;
          margin-bottom: 32px;
        }
        .landing-page-root .fi {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .landing-page-root .ftit {
          font-family: var(--serif);
          font-size: 26px;
          font-weight: 600;
          color: var(--off);
          margin-bottom: 14px;
          line-height: 1.2;
        }
        .landing-page-root .fdesc {
          font-size: 14px;
          line-height: 1.8;
          color: var(--off2);
          font-weight: 300;
          max-width: 380px;
        }
        .landing-page-root .ftags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 24px;
        }
        .landing-page-root .ftag {
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 4px;
          border: .5px solid var(--line);
          color: var(--slate);
          letter-spacing: .3px;
        }

        /* CATEGORIES */
        .landing-page-root .cg {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-top: 64px;
        }
        .landing-page-root .cc {
          background: var(--ink2);
          padding: 32px 20px 28px;
          text-align: center;
          transition: all .25s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .landing-page-root .cc::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: var(--teal);
          transition: width .3s;
        }
        .landing-page-root .cc:hover::before {
          width: 100%;
        }
        .landing-page-root .cc:hover {
          background: var(--ink3);
        }
        .landing-page-root .cc:first-child {
          border-radius: 10px 0 0 10px;
        }
        .landing-page-root .cc:last-child {
          border-radius: 0 10px 10px 0;
        }
        .landing-page-root .ce {
          font-size: 28px;
          display: block;
          margin-bottom: 14px;
        }
        .landing-page-root .cn {
          font-size: 12px;
          font-weight: 500;
          color: var(--off);
          margin-bottom: 6px;
        }
        .landing-page-root .cnt {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--slate);
        }

        /* TOKEN */
        .landing-page-root .tl {
          display: grid;
          grid-template-columns: 1fr 480px;
          gap: 80px;
          align-items: start;
          margin-top: 64px;
        }
        .landing-page-root .tf {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .landing-page-root .tr {
          display: grid;
          grid-template-columns: 110px 1fr;
          background: var(--ink2);
          border: .5px solid var(--line);
          overflow: hidden;
          transition: border-color .2s;
        }
        .landing-page-root .tr:hover {
          border-color: rgba(255, 255, 255, .15);
        }
        .landing-page-root .tr:first-child {
          border-radius: 10px 10px 0 0;
        }
        .landing-page-root .tr:last-child {
          border-radius: 0 0 10px 10px;
        }
        .landing-page-root .trl {
          padding: 18px 20px;
          border-right: .5px solid var(--line);
          display: flex;
          align-items: center;
        }
        .landing-page-root .trlt {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .8px;
          text-transform: uppercase;
        }
        .landing-page-root .trc {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .landing-page-root .tra {
          font-size: 14px;
          color: var(--off2);
          font-weight: 300;
        }
        .landing-page-root .tram {
          font-family: var(--mono);
          font-size: 13px;
          font-weight: 500;
          padding: 3px 9px;
          border-radius: 4px;
        }
        .landing-page-root .earn {
          color: var(--teal);
          background: var(--teal-dim);
        }
        .landing-page-root .spend {
          color: #e05555;
          background: rgba(224, 85, 85, .1);
        }
        .landing-page-root .tpanel {
          background: var(--ink2);
          border-radius: 16px;
          border: .5px solid var(--line);
          overflow: hidden;
        }
        .landing-page-root .tph {
          padding: 28px;
          border-bottom: .5px solid var(--line);
        }
        .landing-page-root .tpt {
          font-family: var(--serif);
          font-size: 20px;
          font-weight: 600;
          color: var(--off);
          margin-bottom: 4px;
        }
        .landing-page-root .tps {
          font-size: 12px;
          color: var(--slate);
        }
        .landing-page-root .tpb {
          padding: 24px 28px;
        }
        .landing-page-root .rabb {
          text-align: center;
          padding: 28px 0;
          border-bottom: .5px solid var(--line);
          margin-bottom: 24px;
        }
        .landing-page-root .rtick {
          font-family: var(--serif);
          font-size: 64px;
          font-weight: 700;
          color: var(--gold-lt);
          letter-spacing: -2px;
          line-height: 1;
        }
        .landing-page-root .rname {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gold);
          margin-top: 6px;
        }
        .landing-page-root .rdesc {
          font-size: 12px;
          color: var(--slate);
          margin-top: 8px;
        }
        .landing-page-root .tmet {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
        }
        .landing-page-root .tm {
          background: rgba(255, 255, 255, .02);
          padding: 16px;
          text-align: center;
        }
        .landing-page-root .tm:nth-child(1) { border-radius: 8px 0 0 0; }
        .landing-page-root .tm:nth-child(2) { border-radius: 0 8px 0 0; }
        .landing-page-root .tm:nth-child(3) { border-radius: 0 0 0 8px; }
        .landing-page-root .tm:nth-child(4) { border-radius: 0 0 8px 0; }
        .landing-page-root .tmv {
          font-family: var(--serif);
          font-size: 24px;
          font-weight: 600;
          color: var(--off);
          display: block;
        }
        .landing-page-root .tml {
          font-size: 10px;
          color: var(--slate);
          letter-spacing: .5px;
          margin-top: 3px;
        }
        .landing-page-root .troad {
          margin-top: 24px;
          padding-top: 24px;
          border-top: .5px solid var(--line);
        }
        .landing-page-root .trdt {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--slate);
          margin-bottom: 14px;
        }
        .landing-page-root .pi {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: .5px solid rgba(255, 255, 255, .04);
        }
        .landing-page-root .pi:last-child {
          border-bottom: none;
        }
        .landing-page-root .pd {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .landing-page-root .pt {
          font-size: 12px;
          color: var(--off2);
        }
        .landing-page-root .pb {
          margin-left: auto;
          font-size: 9px;
          padding: 2px 7px;
          border-radius: 3px;
          font-weight: 500;
        }
        .landing-page-root .pnow {
          background: var(--teal-dim);
          color: var(--teal);
        }
        .landing-page-root .psoon {
          background: rgba(255, 255, 255, .06);
          color: var(--slate);
        }

        /* QUALITY */
        .landing-page-root .qbg {
          background: var(--ink2);
        }
        .landing-page-root .ql {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          margin-top: 64px;
        }
        .landing-page-root .qch {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .landing-page-root .qi {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: var(--ink);
          border: .5px solid var(--line);
          transition: all .2s;
        }
        .landing-page-root .qi:first-child {
          border-radius: 10px 10px 0 0;
        }
        .landing-page-root .qi:last-child {
          border-radius: 0 0 10px 10px;
        }
        .landing-page-root .qi:hover {
          background: var(--ink3);
          border-color: rgba(255, 255, 255, .12);
        }
        .landing-page-root .qic {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .landing-page-root .qpass {
          background: var(--teal-dim);
        }
        .landing-page-root .qwarn {
          background: rgba(212, 146, 12, .12);
        }
        .landing-page-root .qtt {
          font-size: 13px;
          font-weight: 500;
          color: var(--off);
          margin-bottom: 2px;
        }
        .landing-page-root .qd {
          font-size: 11px;
          color: var(--slate);
        }
        .landing-page-root .qs {
          font-size: 10px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .landing-page-root .sp {
          background: var(--teal-dim);
          color: var(--teal);
        }
        .landing-page-root .sa {
          background: rgba(212, 146, 12, .12);
          color: #d4920c;
        }
        .landing-page-root .scard {
          background: var(--ink);
          border-radius: 16px;
          border: .5px solid var(--line);
          padding: 36px;
        }
        .landing-page-root .sct {
          font-family: var(--serif);
          font-size: 18px;
          color: var(--off);
          margin-bottom: 6px;
        }
        .landing-page-root .scs {
          font-size: 12px;
          color: var(--slate);
          margin-bottom: 32px;
        }
        .landing-page-root .sbars {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .landing-page-root .sbh {
          display: flex;
          justify-content: space-between;
          margin-bottom: 7px;
        }
        .landing-page-root .sbl {
          font-size: 12px;
          color: var(--off2);
        }
        .landing-page-root .sbv {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--teal);
        }
        .landing-page-root .sbt {
          height: 4px;
          background: rgba(255, 255, 255, .06);
          border-radius: 2px;
          overflow: hidden;
        }
        .landing-page-root .sbf {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--teal), #0dd4a0);
          transition: width 1.5s var(--ease);
        }
        .landing-page-root .stot {
          margin-top: 28px;
          padding: 20px;
          background: rgba(15, 186, 140, .05);
          border-radius: 10px;
          border: .5px solid var(--teal-dim);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .landing-page-root .stl {
          font-size: 12px;
          color: var(--off2);
        }
        .landing-page-root .stv {
          font-family: var(--serif);
          font-size: 32px;
          font-weight: 600;
          color: var(--teal);
        }
        .landing-page-root .tier-g {
          font-size: 11px;
          color: var(--gold);
          background: var(--gold-dim);
          padding: 3px 8px;
          border-radius: 4px;
          margin-left: 8px;
        }

        /* PRICING */
        .landing-page-root .pg {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          margin-top: 64px;
        }
        .landing-page-root .pc {
          background: var(--ink2);
          padding: 44px 36px;
          position: relative;
          overflow: hidden;
          transition: background .2s;
        }
        .landing-page-root .pc:hover {
          background: var(--ink3);
        }
        .landing-page-root .pc.feat {
          background: var(--teal-dim);
          border: .5px solid rgba(15, 186, 140, .3);
        }
        .landing-page-root .pc:first-child {
          border-radius: 10px 0 0 10px;
        }
        .landing-page-root .pc:last-child {
          border-radius: 0 10px 10px 0;
        }
        .landing-page-root .pbadge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--teal);
          color: var(--ink);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 0 0 0 8px;
        }
        .landing-page-root .ptier {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--slate);
          margin-bottom: 20px;
        }
        .landing-page-root .pname {
          font-family: var(--serif);
          font-size: 28px;
          font-weight: 600;
          color: var(--off);
          margin-bottom: 6px;
        }
        .landing-page-root .pnum {
          font-family: var(--serif);
          font-size: 48px;
          font-weight: 700;
          color: var(--off);
          letter-spacing: -1px;
        }
        .landing-page-root .pper {
          font-size: 13px;
          color: var(--slate);
          margin-left: 4px;
        }
        .landing-page-root .psub {
          font-size: 12px;
          color: var(--slate);
          margin-bottom: 36px;
        }
        .landing-page-root .pdiv {
          width: 100%;
          height: .5px;
          background: var(--line);
          margin-bottom: 28px;
        }
        .landing-page-root .pfl {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 36px;
        }
        .landing-page-root .pfl li {
          font-size: 13px;
          color: var(--off2);
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 300;
        }
        .landing-page-root .pfl li::before {
          content: '✓';
          color: var(--teal);
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .landing-page-root .pfl li.dim::before {
          content: '–';
          color: var(--slate2);
        }
        .landing-page-root .pfl li.dim {
          color: var(--slate);
        }
        .landing-page-root .pbtn {
          display: block;
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all .2s;
        }
        .landing-page-root .pbtn-m {
          background: var(--teal);
          color: var(--ink);
        }
        .landing-page-root .pbtn-m:hover {
          background: #0da87d;
          box-shadow: 0 4px 20px var(--teal-glow);
        }
        .landing-page-root .pbtn-g {
          border: .5px solid rgba(255, 255, 255, .15);
          color: var(--off2);
        }
        .landing-page-root .pbtn-g:hover {
          border-color: rgba(255, 255, 255, .3);
          color: var(--off);
        }

        /* TESTIMONIALS */
        .landing-page-root .testbg {
          background: var(--ink2);
        }
        .landing-page-root .testg {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          margin-top: 64px;
        }
        .landing-page-root .testc {
          background: var(--ink);
          padding: 40px 36px;
          transition: background .2s;
          position: relative;
        }
        .landing-page-root .testc:hover {
          background: rgba(13, 33, 55, .7);
        }
        .landing-page-root .testc:first-child {
          border-radius: 10px 0 0 10px;
        }
        .landing-page-root .testc:last-child {
          border-radius: 0 10px 10px 0;
        }
        .landing-page-root .testq {
          font-family: var(--serif);
          font-size: 15px;
          line-height: 1.78;
          color: var(--off2);
          font-style: italic;
          margin-bottom: 28px;
        }
        .landing-page-root .testa {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 24px;
          border-top: .5px solid var(--line);
        }
        .landing-page-root .testav {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--ink3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--serif);
          font-size: 16px;
          font-weight: 600;
          color: var(--teal);
          flex-shrink: 0;
          border: .5px solid var(--teal-dim);
        }
        .landing-page-root .testn {
          font-size: 13px;
          font-weight: 500;
          color: var(--off);
        }
        .landing-page-root .testr {
          font-size: 11px;
          color: var(--slate);
          margin-top: 2px;
        }
        .landing-page-root .testrab {
          margin-left: auto;
          text-align: right;
        }
        .landing-page-root .testrabv {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--gold-lt);
        }
        .landing-page-root .testrl {
          font-size: 9px;
          color: var(--gold);
          letter-spacing: 1px;
        }

        /* CTA */
        .landing-page-root .cta {
          padding: 140px 56px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .landing-page-root .cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(15, 186, 140, .07) 0%, transparent 70%);
        }
        .landing-page-root .ctai {
          position: relative;
          max-width: 680px;
          margin: 0 auto;
        }
        .landing-page-root .cta h2 {
          font-size: clamp(40px, 5vw, 64px);
          margin-bottom: 22px;
        }
        .landing-page-root .cta .sdesc {
          margin: 0 auto 44px;
          text-align: center;
        }
        .landing-page-root .ctabtns {
          display: flex;
          justify-content: center;
          gap: 14px;
        }
        .landing-page-root .ctanote {
          font-size: 12px;
          color: var(--slate);
          margin-top: 20px;
        }
        .landing-page-root .ctanote a {
          color: var(--teal);
          text-decoration: none;
        }

        /* FOOTER */
        .landing-page-root footer {
          background: var(--ink);
          border-top: .5px solid var(--line);
          padding: 64px 56px 40px;
        }
        .landing-page-root .fg2 {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          margin-bottom: 60px;
        }
        .landing-page-root .flogo {
          font-family: var(--serif);
          font-size: 22px;
          font-weight: 600;
          color: var(--off);
          margin-bottom: 12px;
          display: block;
        }
        .landing-page-root .fdesc2 {
          font-size: 13px;
          line-height: 1.7;
          color: var(--slate);
          font-weight: 300;
          max-width: 260px;
        }
        .landing-page-root .fcol {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--slate2);
          margin-bottom: 20px;
        }
        .landing-page-root .flinks {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .landing-page-root .flinks a {
          font-size: 13px;
          color: var(--slate);
          text-decoration: none;
          transition: color .2s;
        }
        .landing-page-root .flinks a:hover {
          color: var(--off);
        }
        .landing-page-root .fbot {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 32px;
          border-top: .5px solid var(--line);
        }
        .landing-page-root .fcopy {
          font-size: 12px;
          color: var(--slate2);
        }
        .landing-page-root .frabn {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--gold);
          opacity: .6;
        }

        /* SCROLL ANIMATIONS */
        .landing-page-root .rev {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .8s var(--ease), transform .8s var(--ease);
        }
        .landing-page-root .rev.vis {
          opacity: 1;
          transform: none;
        }
        .landing-page-root .revl {
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity .8s var(--ease), transform .8s var(--ease);
        }
        .landing-page-root .revl.vis {
          opacity: 1;
          transform: none;
        }
        .landing-page-root .revr {
          opacity: 0;
          transform: translateX(24px);
          transition: opacity .8s var(--ease), transform .8s var(--ease);
        }
        .landing-page-root .revr.vis {
          opacity: 1;
          transform: none;
        }
        .landing-page-root .d1 { transition-delay: .1s; }
        .landing-page-root .d2 { transition-delay: .2s; }
        .landing-page-root .d3 { transition-delay: .3s; }
        .landing-page-root .d4 { transition-delay: .4s; }
        .landing-page-root .d5 { transition-delay: .5s; }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        /* HERO ANIMATIONS */
        .landing-page-root .ha1 { opacity: 0; animation: fadeUp .8s var(--ease) .1s forwards; }
        .landing-page-root .ha2 { opacity: 0; animation: fadeUp .9s var(--ease) .25s forwards; }
        .landing-page-root .ha3 { opacity: 0; animation: fadeUp .9s var(--ease) .4s forwards; }
        .landing-page-root .ha4 { opacity: 0; animation: fadeUp .9s var(--ease) .55s forwards; }

        @media(max-width: 960px) {
          .landing-page-root nav { padding: 0 24px; }
          .landing-page-root .hero { padding: 120px 24px 80px; }
          .landing-page-root .hero-inner { grid-template-columns: 1fr; }
          .landing-page-root .hero-vis { display: none; }
          .landing-page-root section { padding: 80px 24px; }
          .landing-page-root .steps, 
          .landing-page-root .fg, 
          .landing-page-root .cg, 
          .landing-page-root .pg, 
          .landing-page-root .testg, 
          .landing-page-root .ql, 
          .landing-page-root .tl {
            grid-template-columns: 1fr;
          }
          .landing-page-root .fg2 { grid-template-columns: 1fr 1fr; }
          .landing-page-root .step:first-child, 
          .landing-page-root .step:last-child, 
          .landing-page-root .fc:first-child, 
          .landing-page-root .fc:last-child, 
          .landing-page-root .cc:first-child, 
          .landing-page-root .cc:last-child, 
          .landing-page-root .pc:first-child, 
          .landing-page-root .pc:last-child, 
          .landing-page-root .testc:first-child, 
          .landing-page-root .testc:last-child {
            border-radius: 8px;
          }
        }
      ` }} />

      <nav id="landing-nav">
        <Link href="/" className="logo">
          RabTube <span className="logo-chip">Beta</span>
        </Link>
        <div className="nav-r">
          <a href="#features">기능</a>
          <a href="#token">RAB 토큰</a>
          <a href="#pricing">요금제</a>
          <Link href="/auth/register" className="btn-nav">
            무료로 시작하기
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-inner">
          <div>
            <p className="kicker ha1">치과 개원의 전용 플랫폼</p>
            <h1 className="ha2">
              케이스를 공유하고<br />
              <em>함께 성장하는</em><br />
              치과의사 커뮤니티
            </h1>
            <p className="hero-desc ha3">
              나의 진료 케이스를 업로드하고 동료 원장님들과 나누세요.<br />
              케이스를 올릴수록 <span style={{ color: 'var(--gold)' }}>RAB 토큰</span>으로 보상받고<br />
              플랫폼의 수익을 함께 나눕니다.
            </p>
            <div className="hero-btns ha4">
              <Link href="/auth/register" className="btn-p">
                무료 회원가입
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a href="#features" className="btn-g">
                서비스 살펴보기
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <span className="stat-n">
                  7<span>개</span>
                </span>
                <div className="stat-l">진료 카테고리</div>
              </div>
              <div>
                <span className="stat-n">
                  70<span>%</span>
                </span>
                <div className="stat-l">시청료 업로더 배분</div>
              </div>
              <div>
                <span className="stat-n">
                  48<span>h</span>
                </span>
                <div className="stat-l">AI 검수 후 보상</div>
              </div>
            </div>
          </div>
          <div className="hero-vis">
            <div style={{ position: 'relative' }}>
              <div className="rab-float">
                <span className="rf-amt">+30</span>
                <div className="rf-lbl">RAB</div>
              </div>
              <div className="mf">
                <div className="mb">
                  <div className="dot dr"></div>
                  <div className="dot dy"></div>
                  <div className="dot dg"></div>
                  <div className="mu">rabtube.vercel.app</div>
                </div>
                <div className="mp">
                  <div className="mh">
                    <span className="ml">RabTube</span>
                    <div className="mn">
                      <span className="mni">피드</span>
                      <span className="mni">내 케이스</span>
                      <span className="mpi">+ 업로드</span>
                    </div>
                  </div>
                  <div className="mfil">
                    <span className="mc on">전체</span>
                    <span className="mc">임플란트</span>
                    <span className="mc">보철</span>
                    <span className="mc">치주</span>
                    <span className="mc">교정</span>
                  </div>
                  <div className="mg">
                    <div className="mcard">
                      <div className="mth t1">
                        🦷<span className="mbg bimp">임플란트</span>
                        <span className="mdu">5:18</span>
                      </div>
                      <div className="minfo">
                        <div className="mt">상악 구치부 즉시 식립</div>
                        <div className="mm">
                          김민준<span className="mrab">+3.5 RAB</span>
                        </div>
                      </div>
                    </div>
                    <div className="mcard">
                      <div className="mth t2">
                        👑<span className="mbg bpro">보철</span>
                        <span className="mdu">8:42</span>
                      </div>
                      <div className="minfo">
                        <div className="mt">전치부 올세라믹 6본</div>
                        <div className="mm">
                          이수진<span className="mrab">+3.5 RAB</span>
                        </div>
                      </div>
                    </div>
                    <div className="mcard">
                      <div className="mth t3">
                        🔬<span className="mbg bper">치주</span>
                        <span className="mdu">12:05</span>
                      </div>
                      <div className="minfo">
                        <div className="mt">만성치주염 전악</div>
                        <div className="mm">
                          박종훈<span className="mrab">+3.5 RAB</span>
                        </div>
                      </div>
                    </div>
                    <div className="mcard">
                      <div className="mth t4">
                        😁<span className="mbg bort">교정</span>
                        <span className="mdu">6:30</span>
                      </div>
                      <div className="minfo">
                        <div className="mt">투명교정 1년 경과</div>
                        <div className="mm">
                          최지은<span className="mrab">+3.5 RAB</span>
                        </div>
                      </div>
                    </div>
                    <div className="mcard">
                      <div className="mth t5">
                        🧬<span className="mbg bimp">보존</span>
                        <span className="mdu">3:50</span>
                      </div>
                      <div className="minfo">
                        <div className="mt">레진 인레이 수복</div>
                        <div className="mm">
                          정현우<span className="mrab">+3.5 RAB</span>
                        </div>
                      </div>
                    </div>
                    <div className="mcard">
                      <div className="mth t6">
                        🌟<span className="mbg bpro">소아</span>
                        <span className="mdu">4:15</span>
                      </div>
                      <div className="minfo">
                        <div className="mt">유구치 기성금속관</div>
                        <div className="mm">
                          한미래<span className="mrab">+3.5 RAB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="si">
          <p className="sk rev">이용 방법</p>
          <h2 className="rev d1">
            4단계로 시작하는<br />
            <em>케이스 공유</em>
          </h2>
          <div className="steps">
            <div className="step rev d1">
              <span className="sn">01</span>
              <div className="si2">🪪</div>
              <div className="st">면허 인증 가입</div>
              <p className="sd">치과 면허 번호로 인증된 개원의만 가입 가능합니다. 전문가 커뮤니티의 신뢰를 지킵니다.</p>
              <div className="srab">🎁 가입 즉시 +50 RAB</div>
            </div>
            <div className="step rev d2">
              <span className="sn">02</span>
              <div className="si2">📹</div>
              <div className="st">케이스 업로드</div>
              <p className="sd">진료 케이스 영상을 드래그앤드롭으로 쉽게 업로드합니다. 카테고리, 치아 번호, 난이도를 설정하세요.</p>
              <div className="srab">📤 업로드 시 +10~30 RAB</div>
            </div>
            <div className="step rev d3">
              <span className="sn">03</span>
              <div className="si2">🤖</div>
              <div className="st">AI 자동 검수</div>
              <p className="sd">Google Vision AI가 치과 콘텐츠 여부, 환자 얼굴 노출, 영상 품질을 48시간 내에 자동 검수합니다.</p>
              <div className="srab">✅ 통과 시 보상 확정</div>
            </div>
            <div className="step rev d4">
              <span className="sn">04</span>
              <div className="si2">💰</div>
              <div className="st">수익 자동 배분</div>
              <p className="sd">내 케이스를 시청할 때마다 시청료의 70%가 RAB 토큰으로 자동 적립됩니다. Phase 2에서 현금 환전 예정.</p>
              <div className="srab">🪙 시청료 70% 자동 적립</div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* FEATURES */}
      <section id="features" className="fbg">
        <div className="si">
          <p className="sk rev">핵심 기능</p>
          <h2 className="rev d1">
            치과 개원의를 위해<br />
            <em>설계된</em> 모든 것
          </h2>
          <div className="fg">
            <div className="fc rev d1">
              <div className="fn">F — 01</div>
              <div className="fi" style={{ background: 'var(--teal-dim)' }}>📹</div>
              <div className="ftit">전문 케이스<br />영상 업로드</div>
              <p className="fdesc">MP4, MOV, AVI 최대 2GB 지원. 드래그앤드롭 업로드와 실시간 진행률 표시. Firebase Storage 기반으로 안전한 보관.</p>
              <div className="ftags">
                <span className="ftag">최대 2GB</span>
                <span className="ftag">드래그앤드롭</span>
                <span className="ftag">실시간 진행률</span>
              </div>
            </div>
            <div className="fc rev d2">
              <div className="fn">F — 02</div>
              <div className="fi" style={{ background: 'rgba(44,123,229,.12)' }}>🔍</div>
              <div className="ftit">7개 카테고리<br />정밀 분류</div>
              <p className="fdesc">임플란트, 보철, 치주, 교정, 보존, 소아, 구강외과. 치아 번호 태그와 난이도 설정으로 원하는 케이스를 즉시 탐색합니다.</p>
              <div className="ftags">
                <span className="ftag">치아번호 태그</span>
                <span className="ftag">난이도 분류</span>
                <span className="ftag">키워드 검색</span>
              </div>
            </div>
            <div className="fc rev d3">
              <div className="fn">F — 03</div>
              <div className="fi" style={{ background: 'var(--gold-dim)' }}>🤖</div>
              <div className="ftit">Google AI<br />자동 품질 검수</div>
              <p className="fdesc">Video Intelligence API가 치과 콘텐츠를 판별하고 Vision API가 환자 얼굴 노출을 감지합니다. 불량 콘텐츠는 즉시 비공개 처리됩니다.</p>
              <div className="ftags">
                <span className="ftag">Video Intelligence</span>
                <span className="ftag">얼굴 감지</span>
                <span className="ftag">중복 차단</span>
              </div>
            </div>
            <div className="fc rev d4">
              <div className="fn">F — 04</div>
              <div className="fi" style={{ background: 'rgba(176,122,232,.1)' }}>🪙</div>
              <div className="ftit">RAB 토큰<br />자동 보상 시스템</div>
              <p className="fdesc">업로드, 시청, 좋아요 수신 시 RAB 토큰이 자동 적립됩니다. Firebase 트랜잭션 기반으로 안전하게 처리. 월 업로드 상한과 소각 구조로 인플레이션을 방지합니다.</p>
              <div className="ftags">
                <span className="ftag">Firestore 트랜잭션</span>
                <span className="ftag">48h 검수 후 지급</span>
                <span className="ftag">소각 메커니즘</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories">
        <div className="si">
          <p className="sk rev">케이스 카테고리</p>
          <h2 className="rev d1">
            모든 진료 영역을<br />
            <em>커버합니다</em>
          </h2>
          <div className="cg">
            <div className="cc rev d1">
              <span className="ce">🔩</span>
              <div className="cn">임플란트</div>
              <div className="cnt">식립 / 골이식 / GBR</div>
            </div>
            <div className="cc rev d2">
              <span className="ce">👑</span>
              <div className="cn">보철</div>
              <div className="cnt">크라운 / 브릿지 / 세라믹</div>
            </div>
            <div className="cc rev d2">
              <span className="ce">🔬</span>
              <div className="cn">치주</div>
              <div className="cnt">스케일링 / 수술 / 재생</div>
            </div>
            <div className="cc rev d3">
              <span className="ce">😁</span>
              <div className="cn">교정</div>
              <div className="cnt">브라켓 / 투명 / 설측</div>
            </div>
            <div className="cc rev d4">
              <span className="ce">🧬</span>
              <div className="cn">보존</div>
              <div className="cnt">레진 / 인레이 / 근관</div>
            </div>
            <div className="cc rev d4">
              <span className="ce">🌟</span>
              <div className="cn">소아</div>
              <div className="cnt">유치 / 기성관 / 공간</div>
            </div>
            <div className="cc rev d5">
              <span className="ce">🔪</span>
              <div className="cn">구강외과</div>
              <div className="cnt">발치 / 낭종 / 종양</div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* TOKEN ECONOMY */}
      <section id="token">
        <div className="si">
          <p className="sk rev">RAB 토큰 이코노미</p>
          <h2 className="rev d1">
            케이스를 올릴수록<br />
            <em>수익이 쌓입니다</em>
          </h2>
          <p className="sdesc rev d2">
            RAB는 RabTube 플랫폼 전용 유틸리티 토큰입니다. 지식을 공유할수록 더 많이 획득하고, Phase 2에서 현금으로 환전할 수 있습니다.
          </p>
          <div className="tl">
            <div>
              <div className="tf revl">
                <div className="tr">
                  <div className="trl">
                    <span className="trlt" style={{ color: 'var(--teal)' }}>획득</span>
                  </div>
                  <div className="trc">
                    <span className="tra">회원가입 보너스 (1회)</span>
                    <span className="tram earn">+50 RAB</span>
                  </div>
                </div>
                <div className="tr">
                  <div className="trl">
                    <span className="trlt" style={{ color: 'var(--teal)' }}>획득</span>
                  </div>
                  <div className="trc">
                    <span className="tra">케이스 업로드 (AI 통과 후)</span>
                    <span className="tram earn">+10~30 RAB</span>
                  </div>
                </div>
                <div className="tr">
                  <div className="trl">
                    <span className="trlt" style={{ color: 'var(--teal)' }}>획득</span>
                  </div>
                  <div className="trc">
                    <span className="tra">좋아요 수신</span>
                    <span className="tram earn">+1 RAB / 건</span>
                  </div>
                </div>
                <div className="tr">
                  <div className="trl">
                    <span className="trlt" style={{ color: 'var(--teal)' }}>획득</span>
                  </div>
                  <div className="trc">
                    <span className="tra">시청료 자동 배분 (70%)</span>
                    <span className="tram earn">+3.5 RAB / 시청</span>
                  </div>
                </div>
                <div className="tr">
                  <div className="trl">
                    <span className="trlt" style={{ color: '#e05555' }}>소비</span>
                  </div>
                  <div className="trc">
                    <span className="tra">케이스 시청</span>
                    <span className="tram spend">-5 RAB / 건</span>
                  </div>
                </div>
                <div className="tr">
                  <div className="trl">
                    <span className="trlt" style={{ color: '#e05555' }}>소비</span>
                  </div>
                  <div className="trc">
                    <span className="tra">케이스 다운로드</span>
                    <span className="tram spend">-10 RAB / 건</span>
                  </div>
                </div>
                <div className="tr">
                  <div className="trl">
                    <span className="trlt" style={{ color: '#e05555' }}>소비</span>
                  </div>
                  <div className="trc">
                    <span className="tra">피드 홍보 부스트</span>
                    <span className="tram spend">-50 RAB / 주</span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: '18px',
                  padding: '16px 20px',
                  background: 'var(--gold-dim)',
                  borderRadius: '8px',
                  border: '.5px solid rgba(201,168,76,.2)',
                }}
                className="revl d2"
              >
                <p style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 500, marginBottom: '4px' }}>
                  Phase 2 — 현금 환전 예정 (6개월 이내)
                </p>
                <p style={{ fontSize: '13px', color: 'var(--off2)', fontWeight: 300 }}>
                  RAB 토큰을 현금으로 환전하는 기능이 오픈됩니다. 이후 블록체인 기반 실거래 토큰으로 전환 예정.
                </p>
              </div>
            </div>
            <div className="tpanel revr">
              <div className="tph">
                <div className="tpt">RAB Token</div>
                <div className="tps">RabTube Utility Token · Phase 1</div>
              </div>
              <div className="tpb">
                <div className="rabb">
                  <div className="rtick">RAB</div>
                  <div className="rname">RabTube Token</div>
                  <div className="rdesc">Firestore DB 포인트 · 블록체인 전환 예정</div>
                </div>
                <div className="tmet">
                  <div className="tm">
                    <span className="tmv">10M</span>
                    <div className="tml">초기 발행량</div>
                  </div>
                  <div className="tm">
                    <span className="tmv">70%</span>
                    <div className="tml">생태계 보상</div>
                  </div>
                  <div className="tm">
                    <span className="tmv">10%</span>
                    <div className="tml">소각률</div>
                  </div>
                  <div className="tm">
                    <span className="tmv">48h</span>
                    <div className="tml">보상 지급</div>
                  </div>
                </div>
                <div className="troad">
                  <div className="trdt">도입 로드맵</div>
                  <div className="pi">
                    <div className="pd" style={{ background: 'var(--teal)' }}></div>
                    <span className="pt">Phase 1 — DB 포인트 시스템</span>
                    <span className="pb pnow">현재</span>
                  </div>
                  <div className="pi">
                    <div className="pd" style={{ background: 'var(--gold)' }}></div>
                    <span className="pt">Phase 2 — 내부 환전 + 현금 정산</span>
                    <span className="pb psoon">6개월</span>
                  </div>
                  <div className="pi">
                    <div className="pd" style={{ background: 'var(--slate)' }}></div>
                    <span className="pt">Phase 3 — Kaia 블록체인 ERC-20</span>
                    <span className="pb psoon">12개월</span>
                  </div>
                  <div className="pi">
                    <div className="pd" style={{ background: 'var(--slate2)' }}></div>
                    <span className="pt">Phase 4 — 거래소 상장 + 글로벌</span>
                    <span className="pb psoon">계획 중</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* QUALITY */}
      <section id="quality" className="qbg">
        <div className="si">
          <p className="sk rev">AI 품질 검수</p>
          <h2 className="rev d1">
            쓰레기 자료는<br />
            <em>걸러냅니다</em>
          </h2>
          <p className="sdesc rev d2">
            Google Cloud AI가 자동으로 콘텐츠를 검수합니다. 고품질 케이스만 보상을 받고 플랫폼의 전문성을 유지합니다.
          </p>
          <div className="ql">
            <div className="qch revl">
              <div className="qi">
                <div className="qic qpass">⏱</div>
                <div>
                  <div className="qtt">영상 길이 검사</div>
                  <div className="qd">최소 2분(120초) 이상 영상만 보상 지급</div>
                </div>
                <span className="qs sp">자동</span>
              </div>
              <div className="qi">
                <div className="qic qpass">🦷</div>
                <div>
                  <div className="qtt">치과 콘텐츠 감지</div>
                  <div className="qd">Video Intelligence API로 구강/치과 레이블 확인</div>
                </div>
                <span className="qs sp">AI 분석</span>
              </div>
              <div className="qi">
                <div className="qic qpass">🙈</div>
                <div>
                  <div className="qtt">환자 얼굴 미노출</div>
                  <div className="qd">Vision API로 환자 얼굴 감지 시 즉시 차단</div>
                </div>
                <span className="qs sp">자동 차단</span>
              </div>
              <div className="qi">
                <div className="qic qpass">🔄</div>
                <div>
                  <div className="qtt">중복 영상 방지</div>
                  <div className="qd">MD5 해시 비교로 동일 영상 재업로드 차단</div>
                </div>
                <span className="qs sp">해시 비교</span>
              </div>
              <div className="qi">
                <div className="qic qwarn">🚩</div>
                <div>
                  <div className="qtt">커뮤니티 신고</div>
                  <div className="qd">3회 누적 신고 시 자동 비공개 + 패널티</div>
                </div>
                <span className="qs sa">커뮤니티</span>
              </div>
              <div className="qi">
                <div className="qic qwarn">📊</div>
                <div>
                  <div className="qtt">시청 완료율 추적</div>
                  <div className="qd">48시간 후 완료율 70% 이상 시 품질 보너스</div>
                </div>
                <span className="qs sa">48h 반영</span>
              </div>
            </div>
            <div className="scard revr">
              <div className="sct">품질 점수 산정</div>
              <div className="scs">AI 검사 50점 + 커뮤니티 반응 50점 = 최대 100점</div>
              <div className="sbars">
                <div>
                  <div className="sbh">
                    <span className="sbl">영상 길이 (2분+)</span>
                    <span className="sbv">25점</span>
                  </div>
                  <div className="sbt">
                    <div className="sbf" data-w="25"></div>
                  </div>
                </div>
                <div>
                  <div className="sbh">
                    <span className="sbl">치과 콘텐츠 확인</span>
                    <span className="sbv">35점</span>
                  </div>
                  <div className="sbt">
                    <div className="sbf" data-w="35"></div>
                  </div>
                </div>
                <div>
                  <div className="sbh">
                    <span className="sbl">시청 완료율 (48h)</span>
                    <span className="sbv">30점</span>
                  </div>
                  <div className="sbt">
                    <div className="sbf" data-w="30"></div>
                  </div>
                </div>
                <div>
                  <div className="sbh">
                    <span className="sbl">좋아요 / 저장</span>
                    <span className="sbv">10점</span>
                  </div>
                  <div className="sbt">
                    <div className="sbf" data-w="10"></div>
                  </div>
                </div>
              </div>
              <div className="stot">
                <div>
                  <div className="stl">종합 점수 85점 이상</div>
                  <div style={{ fontSize: '12px', color: 'var(--slate)', marginTop: '2px' }}>
                    Gold 티어 — 최대 보상 수령
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="stv">+30</span>
                  <span style={{ fontSize: '13px', color: 'var(--teal)', marginLeft: '4px' }}>RAB</span>
                  <span className="tier-g">🥇 Gold</span>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px',
                    background: 'rgba(255,255,255,.02)',
                    borderRadius: '8px',
                    border: '.5px solid var(--line)',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--slate)', marginBottom: '4px' }}>
                    Silver (70점+)
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', color: 'var(--off2)', fontSize: '13px' }}>
                    +24 RAB
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px',
                    background: 'rgba(255,255,255,.02)',
                    borderRadius: '8px',
                    border: '.5px solid var(--line)',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--slate)', marginBottom: '4px' }}>
                    Bronze (50점+)
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', color: 'var(--off2)', fontSize: '13px' }}>
                    +16 RAB
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px',
                    background: 'rgba(255,255,255,.02)',
                    borderRadius: '8px',
                    border: '.5px solid var(--line)',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--slate)', marginBottom: '4px' }}>
                    기본 통과
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', color: 'var(--off2)', fontSize: '13px' }}>
                    +10 RAB
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* PRICING */}
      <section id="pricing">
        <div className="si">
          <p className="sk rev">요금제</p>
          <h2 className="rev d1">
            지식을 나눌수록<br />
            <em>더 많이 돌려받습니다</em>
          </h2>
          <div className="pg">
            <div className="pc rev d1">
              <div className="ptier">Free</div>
              <div className="pname">스타터</div>
              <div>
                <span className="pnum">₩0</span>
              </div>
              <div className="psub">영원히 무료</div>
              <div className="pdiv"></div>
              <ul className="pfl">
                <li>가입 보너스 50 RAB</li>
                <li>월 5건 케이스 업로드</li>
                <li>전체 케이스 시청</li>
                <li>기본 카테고리 검색</li>
                <li className="dim">프리미엄 케이스</li>
                <li className="dim">케이스 다운로드</li>
                <li className="dim">홍보 부스트</li>
              </ul>
              <Link href="/auth/register" className="pbtn pbtn-g">
                무료로 시작
              </Link>
            </div>
            <div className="pc feat rev d2">
              <div className="pbadge">추천</div>
              <div className="ptier">Pro</div>
              <div className="pname">프로</div>
              <div>
                <span className="pnum">₩29,000</span>
                <span className="pper">/월</span>
              </div>
              <div className="psub">또는 200 RAB/월로 결제 가능</div>
              <div className="pdiv"></div>
              <ul className="pfl">
                <li>가입 보너스 50 RAB</li>
                <li>월 50건 케이스 업로드</li>
                <li>전체 케이스 무제한 시청</li>
                <li>프리미엄 케이스 시청</li>
                <li>케이스 다운로드 (10 RAB/건)</li>
                <li>홍보 부스트 기능</li>
                <li className="dim">다중 계정 관리</li>
              </ul>
              <Link href="/auth/register" className="pbtn pbtn-m">
                프로 시작하기
              </Link>
            </div>
            <div className="pc rev d3">
              <div className="ptier">Clinic</div>
              <div className="pname">클리닉</div>
              <div>
                <span className="pnum">₩79,000</span>
                <span className="pper">/월</span>
              </div>
              <div className="psub">직원 최대 5명 서브계정</div>
              <div className="pdiv"></div>
              <ul className="pfl">
                <li>팀 가입 보너스 × 5</li>
                <li>무제한 케이스 업로드</li>
                <li>전체 케이스 무제한 시청</li>
                <li>프리미엄 케이스 시청</li>
                <li>케이스 다운로드 무제한</li>
                <li>홍보 부스트 + 분석</li>
                <li>다중 계정 5인 관리</li>
              </ul>
              <Link href="/auth/register" className="pbtn pbtn-g">
                클리닉 문의
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* TESTIMONIALS */}
      <section id="reviews" className="testbg">
        <div className="si">
          <p className="sk rev">원장님들의 이야기</p>
          <h2 className="rev d1">
            동료의 케이스에서<br />
            <em>배웁니다</em>
          </h2>
          <div className="testg">
            <div className="testc rev d1">
              <p className="testq">
                "임플란트 케이스를 10건 올렸는데 매달 안정적으로 수익이 들어옵니다. 교육 콘텐츠를 만들면서 RAB도 쌓이니 일석이조입니다."
              </p>
              <div className="testa">
                <div className="testav">김</div>
                <div>
                  <div className="testn">김민준 원장</div>
                  <div className="testr">연세스마일치과 · 강남구 · 개원 8년</div>
                </div>
                <div className="testrab">
                  <div className="testrabv">+340 RAB</div>
                  <div className="testrl">누적 획득</div>
                </div>
              </div>
            </div>
            <div className="testc rev d2">
              <p className="testq">
                "보철 케이스를 올리면서 동료들의 피드백을 받을 수 있어서 좋습니다. 학술 활동과 수익을 동시에 할 수 있는 플랫폼이에요."
              </p>
              <div className="testa">
                <div className="testav">이</div>
                <div>
                  <div className="testn">이수진 원장</div>
                  <div className="testr">서울보철치과 · 서초구 · 개원 12년</div>
                </div>
                <div className="testrab">
                  <div className="testrabv">+215 RAB</div>
                  <div className="testrl">누적 획득</div>
                </div>
              </div>
            </div>
            <div className="testc rev d3">
              <p className="testq">
                "치주 케이스는 항상 공유하기 어려운 분야인데, 회원 전용 공개 기능 덕분에 안심하고 올릴 수 있습니다. AI 검수가 신뢰를 줍니다."
              </p>
              <div className="testa">
                <div className="testav">박</div>
                <div>
                  <div className="testn">박종훈 원장</div>
                  <div className="testr">분당치주과 · 분당구 · 개원 15년</div>
                </div>
                <div className="testrab">
                  <div className="testrabv">+480 RAB</div>
                  <div className="testrl">누적 획득</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* CTA */}
      <section className="cta">
        <div className="ctai">
          <p className="sk rev" style={{ justifyContent: 'center' }}>
            지금 시작하세요
          </p>
          <h2 className="rev">
            첫 케이스 업로드 후<br />
            <em>50 + 10 RAB</em> 즉시 지급
          </h2>
          <p className="sdesc rev d1" style={{ margin: '0 auto 44px', textAlign: 'center' }}>
            가입 즉시 50 RAB 보너스 지급. 첫 케이스를 업로드하면 추가 10 RAB. 지금 치과 개원의 커뮤니티에 합류하세요.
          </p>
          <div className="ctabtns rev d2">
            <Link href="/auth/register" className="btn-p">
              무료 회원가입 — 60 RAB 받기
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/auth/login" className="btn-g">
              이미 회원이신가요?
            </Link>
          </div>
          <p className="ctanote rev d3">
            신용카드 불필요 · 치과 면허 번호로 인증 · <a href="#">개인정보 처리방침</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="fg2">
          <div>
            <span className="flogo">RabTube</span>
            <p className="fdesc2">치과 개원의를 위한 전문 케이스 영상 커뮤니티. 지식을 공유하고 함께 성장합니다.</p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--ink2)',
                  border: '.5px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📧
              </div>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--ink2)',
                  border: '.5px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                💬
              </div>
            </div>
          </div>
          <div>
            <div className="fcol">플랫폼</div>
            <ul className="flinks">
              <li>
                <a href="#">케이스 피드</a>
              </li>
              <li>
                <a href="#">업로드</a>
              </li>
              <li>
                <a href="#">내 케이스</a>
              </li>
              <li>
                <a href="#">포인트 내역</a>
              </li>
            </ul>
          </div>
          <div>
            <div className="fcol">RAB 토큰</div>
            <ul className="flinks">
              <li>
                <a href="#">토큰 정책</a>
              </li>
              <li>
                <a href="#">보상 구조</a>
              </li>
              <li>
                <a href="#">로드맵</a>
              </li>
              <li>
                <a href="#">FAQ</a>
              </li>
            </ul>
          </div>
          <div>
            <div className="fcol">회사</div>
            <ul className="flinks">
              <li>
                <a href="#">소개</a>
              </li>
              <li>
                <a href="#">이용약관</a>
              </li>
              <li>
                <a href="#">개인정보처리방침</a>
              </li>
              <li>
                <a href="#">문의하기</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="fbot">
          <div className="fcopy">© 2025 RabTube. All rights reserved.</div>
          <div className="frabn">RAB TOKEN · PHASE 1</div>
        </div>
      </footer>
    </div>
  );
}
