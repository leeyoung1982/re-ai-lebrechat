import React, { useEffect, useRef, useState } from 'react';
import animationData from '../../assets/lottie/login-bg.json';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setReduced(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}

export default function LoginBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [ok, setOk] = useState(true);

  useEffect(() => {
    let destroyed = false;
    let anim: any;

    async function init() {
      try {
        const lottie = (await import('lottie-web')).default;
        if (destroyed || !containerRef.current) return;

        containerRef.current.innerHTML = '';

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: !reducedMotion,
          autoplay: !reducedMotion,
          animationData,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
            progressiveLoad: true,
          },
        });

        if (reducedMotion) {
          anim.goToAndStop(0, true);
        }

        setOk(true);
      } catch (e) {
        setOk(false);
      }
    }

    init();

    return () => {
      destroyed = true;
      try {
        anim?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, [reducedMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Lottie layer */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="absolute inset-0 opacity-70" />
      </div>

      {/* Fallback overlay (in case lottie fails) */}
      <div className={['absolute inset-0 transition-opacity duration-500', ok ? 'opacity-20' : 'opacity-100'].join(' ')}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#1a1240] to-[#2a0b2a]" />
        <div
          className="absolute -inset-24 opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(212,37,142,0.35), transparent 45%),' +
              'radial-gradient(circle at 80% 30%, rgba(99,102,241,0.25), transparent 40%),' +
              'radial-gradient(circle at 40% 80%, rgba(14,165,233,0.18), transparent 45%)',
            animation: reducedMotion ? undefined : 'loginGlow 10s ease-in-out infinite',
          }}
        />
        <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.10))' }} />
        <div className="absolute inset-0 opacity-50" style={{ boxShadow: 'inset 0 0 160px rgba(0,0,0,0.65)' }} />
      </div>

      <style>
        {`
          @keyframes loginGlow {
            0% { transform: translate3d(0,0,0) scale(1.0); filter: hue-rotate(0deg); }
            50% { transform: translate3d(12px,-8px,0) scale(1.08); filter: hue-rotate(12deg); }
            100% { transform: translate3d(0,0,0) scale(1.0); filter: hue-rotate(0deg); }
          }
        `}
      </style>
    </div>
  );
}
