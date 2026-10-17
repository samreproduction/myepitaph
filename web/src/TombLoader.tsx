import { Player, type CallbackListener, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';

const stoneCount = 15;
const laidFrame = (count: number) => count === 0 ? 0 : (count - 1) * 4 + 8;
const carvingStart = laidFrame(stoneCount);
const fadeStart = carvingStart + 8 + 9;
export const durationInFrames = fadeStart + 6 + 1;
const stones = [
  { x: .5, y: 146.5, width: 58.75, height: 13 },
  { x: 60.75, y: 146.5, width: 58.75, height: 13 },
  ...Array.from({ length: 5 }, (_, row) => {
    const widths = row % 2 === 0 ? [42, 42] : [21, 42, 21];
    let x = 18;
    return widths.map((width) => {
      const stone = { x: x + .75, y: 128 - row * 18 + .75, width: width - 1.5, height: 16.5 };
      x += width;
      return stone;
    });
  }).flat(),
  null,
];

export function TombBuild({ target, reducedMotion }: { target: number; reducedMotion: boolean }) {
  const frame = useCurrentFrame();
  const carving = reducedMotion ? Number(target === stoneCount)
    : interpolate(frame, [carvingStart, carvingStart + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <svg viewBox="0 0 120 160" aria-hidden="true">
    {stones.map((stone, i) => {
      const laid = i < target && (reducedMotion || frame >= i * 4 + 8);
      const started = i < target && (reducedMotion || frame > i * 4);
      const progress = reducedMotion ? 1 : interpolate(frame, [i * 4, i * 4 + 8], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
      });
      const props = {
        'data-stone': i, 'data-laid': laid ? 'true' : 'false',
        stroke: '#b5b9b2', strokeWidth: 1, strokeDasharray: started ? undefined : '2 3',
        fill: started ? '#2a2c2b' : 'none', opacity: started ? progress : .14,
        transform: started ? `translate(0 ${-10 * (1 - progress)})` : undefined,
      };
      return stone ? <rect key={i} {...stone} {...props} rx={1} />
        : <path key={i} {...props} strokeLinejoin="round" d="M19 54.5 L19 49.5 C19 19.5 101 19.5 101 49.5 L101 54.5 Z" />;
    })}
    <path d="M45 43 H75" stroke="#8c9088" strokeWidth={1} pathLength={1}
      strokeDasharray={1} strokeDashoffset={1 - carving} opacity={carving > 0 ? 1 : 0} />
  </svg>;
}

export function TombLoader({ done, total, onFinished }: { done: number; total: number; onFinished: () => void }) {
  const player = useRef<PlayerRef>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [fading, setFading] = useState(false);
  const target = total > 0 ? Math.min(stoneCount, Math.floor(done / total * stoneCount)) : 0;
  const complete = total > 0 && done === total;
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const instance = player.current;
    if (!instance) return;
    if (reducedMotion) {
      instance.pause();
      if (complete) {
        const timer = setTimeout(onFinished, 0);
        return () => clearTimeout(timer);
      }
      return;
    }
    const update: CallbackListener<'frameupdate'> = ({ detail: { frame } }) => {
      if (!complete && frame >= laidFrame(target)) instance.pause();
      if (complete && frame >= fadeStart) setFading(true);
    };
    instance.addEventListener('frameupdate', update);
    instance.addEventListener('ended', onFinished);
    if (complete || instance.getCurrentFrame() < laidFrame(target)) instance.play();
    else instance.pause();
    return () => {
      instance.removeEventListener('frameupdate', update);
      instance.removeEventListener('ended', onFinished);
    };
  }, [target, complete, reducedMotion, onFinished]);
  return <div className={`tomb-loader${fading ? ' tomb-loader-fading' : ''}`} role="progressbar"
    aria-label="解開內容" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
    <div className="tomb-loader-art"><Player ref={player} component={TombBuild} inputProps={{ target, reducedMotion }}
      durationInFrames={durationInFrames} fps={30} compositionWidth={120} compositionHeight={160}
      controls={false} clickToPlay={false} spaceKeyToPlayOrPause={false}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }} /></div>
    <p>解開 {done} / {total}</p>
  </div>;
}
