import { useEffect, useState } from 'react';
import './IntroSplash.css';

type Stage = 'enter' | 'aim' | 'flash' | 'develop' | 'handoff' | 'exit';

const STAGE_TIMELINE: { stage: Stage; at: number }[] = [
  { stage: 'enter', at: 0 },
  { stage: 'aim', at: 900 },
  { stage: 'flash', at: 2000 },
  { stage: 'develop', at: 2300 },
  { stage: 'handoff', at: 3400 },
  { stage: 'exit', at: 4500 },
];

const TOTAL_DURATION = 5200;

interface IntroSplashProps {
  onComplete: () => void;
}

export function IntroSplash({ onComplete }: IntroSplashProps) {
  const [stage, setStage] = useState<Stage>('enter');
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    const timers = STAGE_TIMELINE.map(({ stage: s, at }) =>
      setTimeout(() => setStage(s), at)
    );
    const finalTimer = setTimeout(onComplete, TOTAL_DURATION);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finalTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = () => {
    if (skipping) return;
    setSkipping(true);
    setStage('exit');
    setTimeout(onComplete, 500);
  };

  return (
    <div className={`intro-splash stage-${stage}`} role="presentation">
      <button className="intro-skip" onClick={handleSkip} aria-label="Skip intro">
        Skip &gt;
      </button>

      <div className="intro-scene">
        <div className="intro-sprig intro-sprig-left" aria-hidden="true">
          <svg viewBox="0 0 60 120" fill="none">
            <path d="M30 120C20 90 40 70 26 40C16 20 30 6 30 0" stroke="#8ba57f" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="20" cy="55" rx="8" ry="4" transform="rotate(-30 20 55)" fill="#a9c19c" />
            <ellipse cx="34" cy="85" rx="8" ry="4" transform="rotate(25 34 85)" fill="#9db98f" />
            <g transform="translate(30,4)">
              <circle cx="0" cy="-6" r="5" fill="#d99bab" />
              <circle cx="5.5" cy="-2" r="5" fill="#d99bab" />
              <circle cx="3.5" cy="5" r="5" fill="#d99bab" />
              <circle cx="-3.5" cy="5" r="5" fill="#d99bab" />
              <circle cx="-5.5" cy="-2" r="5" fill="#d99bab" />
              <circle cx="0" cy="0" r="3.4" fill="#eccf9a" />
            </g>
          </svg>
        </div>

        <div className="intro-sprig intro-sprig-right" aria-hidden="true">
          <svg viewBox="0 0 60 120" fill="none">
            <path d="M30 120C40 90 20 70 34 40C44 20 30 6 30 0" stroke="#8ba57f" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="40" cy="55" rx="8" ry="4" transform="rotate(30 40 55)" fill="#a9c19c" />
            <ellipse cx="26" cy="85" rx="8" ry="4" transform="rotate(-25 26 85)" fill="#9db98f" />
            <g transform="translate(30,4)">
              <circle cx="0" cy="-6" r="5" fill="#d9b877" />
              <circle cx="5.5" cy="-2" r="5" fill="#d9b877" />
              <circle cx="3.5" cy="5" r="5" fill="#d9b877" />
              <circle cx="-3.5" cy="5" r="5" fill="#d9b877" />
              <circle cx="-5.5" cy="-2" r="5" fill="#d9b877" />
              <circle cx="0" cy="0" r="3.4" fill="#eccf9a" />
            </g>
          </svg>
        </div>

        {/* Bear + camera group */}
        <div className="intro-bear-wrap">
          <svg
            className="intro-bear"
            viewBox="0 0 260 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* shadow */}
            <ellipse cx="130" cy="238" rx="70" ry="10" fill="#c9a15a" opacity="0.18" />

            {/* body */}
            <ellipse cx="130" cy="182" rx="62" ry="52" fill="#c69a6d" />
            <ellipse cx="130" cy="196" rx="38" ry="30" fill="#e8d3b6" />

            {/* legs */}
            <circle cx="98" cy="228" r="18" fill="#c69a6d" />
            <circle cx="162" cy="228" r="18" fill="#c69a6d" />
            <circle cx="98" cy="228" r="8" fill="#e8d3b6" />
            <circle cx="162" cy="228" r="8" fill="#e8d3b6" />

            {/* right arm (holds camera, will lift on "aim") */}
            <g className="bear-arm-right" style={{ transformOrigin: '176px 168px' }}>
              <ellipse cx="188" cy="185" rx="16" ry="26" fill="#c69a6d" transform="rotate(20 188 185)" />
            </g>

            {/* left arm (extends to hand off polaroid) */}
            <g className="bear-arm-left" style={{ transformOrigin: '84px 168px' }}>
              <ellipse cx="72" cy="185" rx="16" ry="26" fill="#c69a6d" transform="rotate(-20 72 185)" />
            </g>

            {/* head */}
            <g className="bear-head" style={{ transformOrigin: '130px 108px' }}>
              <circle cx="86" cy="70" r="20" fill="#c69a6d" />
              <circle cx="174" cy="70" r="20" fill="#c69a6d" />
              <circle cx="86" cy="70" r="10" fill="#e8d3b6" />
              <circle cx="174" cy="70" r="10" fill="#e8d3b6" />
              <circle cx="130" cy="108" r="58" fill="#c69a6d" />
              <ellipse cx="130" cy="122" rx="30" ry="22" fill="#e8d3b6" />
              <circle cx="130" cy="118" r="7" fill="#4a3428" />
              <circle cx="108" cy="96" r="5" fill="#4a3428" />
              <circle cx="152" cy="96" r="5" fill="#4a3428" />
              <path d="M118 132 Q130 140 142 132" stroke="#4a3428" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>

            {/* camera, held by right arm/hand */}
            <g className="intro-camera" style={{ transformOrigin: '196px 178px' }}>
              <rect x="168" y="158" width="56" height="42" rx="8" fill="#4a3428" />
              <rect x="168" y="158" width="56" height="10" rx="4" fill="#3a281f" />
              <circle cx="196" cy="180" r="14" fill="#2e211a" />
              <circle cx="196" cy="180" r="9" fill="#7a9676" />
              <circle cx="192" cy="176" r="2.6" fill="#e8d3b6" opacity="0.8" />
              <rect x="211" y="163" width="8" height="6" rx="1.5" fill="#d99bab" />

              {/* flash burst */}
              <g className="intro-flash-burst" opacity="0">
                <circle cx="215" cy="166" r="16" fill="#fffaf0" />
              </g>
            </g>

            {/* polaroid ejecting from camera bottom */}
            <g className="intro-polaroid-group" style={{ transformOrigin: '196px 200px' }}>
              <rect
                className="intro-polaroid"
                x="176"
                y="196"
                width="40"
                height="48"
                rx="2"
                fill="#fdfdfb"
                stroke="#e5dccb"
              />
              <rect className="intro-polaroid-photo" x="180" y="200" width="32" height="32" fill="#8ba57f" />
            </g>
          </svg>
        </div>

        {/* full-screen flash overlay */}
        <div className="intro-flash-overlay" />

        <div className="intro-caption">
          <span className="intro-caption-title">SnapJigsaw</span>
          <span className="intro-caption-sub">say cheese...</span>
        </div>
      </div>
    </div>
  );
}
