import { useEffect, useRef, useState } from 'react';
import { epitaph, fixtures, type Fixture } from './fixtures';
import { MemoryObject } from './Object';

export function App() {
  const [phase, setPhase] = useState<'locked' | 'growing' | 'still'>('locked');
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<Fixture | null>(null);
  const [history, setHistory] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (phase !== 'growing') return;
    const timer = setTimeout(() => {
      if (count < fixtures.length) setCount(count + 1);
      else setPhase('still');
    }, count < fixtures.length ? 380 : 700);
    return () => clearTimeout(timer);
  }, [phase, count]);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  const close = () => {
    dialog.current?.close();
    setSelected(null);
    setHistory(false);
    previousFocus.current?.focus();
  };

  return <main className={`cemetery ${phase}`}>
    <div className="ground" aria-hidden="true" />
    <div className="horizon" aria-hidden="true" />
    {phase === 'locked' ? <div className="gate"><button onClick={() => setPhase('growing')}>進入</button></div> : <>
      <header className="masthead"><span>無名之地</span><span>假內容原型 / 2026</span></header>
      <section className="epitaph" aria-label="測試墓誌銘">
        <span className="eyebrow">此處留下的，只是測試</span>
        <h1>{epitaph.split('\n')[0]}</h1>
        <p>{epitaph.split('\n').slice(1).join('\n')}</p>
        <span className="epitaph-line" aria-hidden="true" />
      </section>
      <section className="memories" aria-label="依日期排列的測試物件" aria-busy={phase === 'growing'}>
        {fixtures.slice(0, count).map((item) => <MemoryObject key={item.slug}
          item={item} selected={selected?.slug === item.slug}
          onOpen={() => { previousFocus.current = document.activeElement as HTMLElement; setSelected(item); }} />)}
      </section>
      <footer><span role="status">{phase === 'growing' ? '記憶正在生長' : '生長完成'}</span><span>停留或長按，讓線條呼吸 · 點選閱讀</span></footer>
    </>}
    <dialog ref={dialog} aria-labelledby="memory-title" onCancel={(event) => { event.preventDefault(); close(); }}>
      {selected && <article className="panel">
        <div className="panel-top"><span>{selected.date}</span><button onClick={close} aria-label="關閉文字面板">關閉 ×</button></div>
        <h2 id="memory-title">測試物件文字</h2>
        <p className="memory-text">{selected.text}</p>
        <button className="history" onClick={() => setHistory(true)}>歷史</button>
        {history && <p role="status">尚未接入</p>}
      </article>}
    </dialog>
  </main>;
}
