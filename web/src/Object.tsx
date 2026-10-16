import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { useCurrentFrame } from 'remotion';
import type { Fixture } from './fixtures';
import { shapeFor, type ShapeSpec } from './shape';

function Lines({ shape }: { shape: ShapeSpec }) {
  const frame = useCurrentFrame();
  const breath = Math.sin(frame / 60 * Math.PI * 2);
  return <svg viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth={shape.strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      transform={`rotate(${shape.rotation + breath * 4} 50 85) translate(0 ${breath * 2})`}>
      {shape.paths.map((path) => <path key={path} d={path} />)}
    </g>
  </svg>;
}

export function MemoryObject({ item, selected, onOpen }: {
  item: Fixture; selected: boolean; onOpen: () => void;
}) {
  const player = useRef<PlayerRef>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const shape = shapeFor(item.text);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setActive(false);
  };
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (active && !reducedMotion) player.current?.play();
    else { player.current?.pause(); player.current?.seekTo(0); }
  }, [active, reducedMotion]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return <button className={`memory ${selected ? 'dissolved' : ''}`}
    data-testid="memory-object" aria-label={`開啟${item.text.split(/[。？！：，\n]/)[0]}，${item.date}`}
    onKeyDown={() => { held.current = false; }}
    onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActive(true); }}
    onPointerLeave={stop} onBlur={stop}
    onPointerDown={(event) => {
      held.current = false;
      if (event.pointerType !== 'mouse') {
        event.currentTarget.setPointerCapture(event.pointerId);
        timer.current = setTimeout(() => { held.current = true; setActive(true); }, 500);
      }
    }}
    onPointerUp={stop} onPointerCancel={stop}
    onClick={() => { if (!held.current) { stop(); onOpen(); } held.current = false; }}>
    <span className="object-art"><Player ref={player} component={Lines} inputProps={{ shape }}
      durationInFrames={60} fps={30} compositionWidth={100} compositionHeight={100}
      loop controls={false} clickToPlay={false} spaceKeyToPlayOrPause={false}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }} /></span>
    <span className="object-date">{item.date}</span>
  </button>;
}
