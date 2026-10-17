import { useEffect, useRef, useState } from 'react';
import { EmptyContentError, IncorrectPasswordError, loadContent, type Content, type Memory } from './content';
import { MemoryGap, MemoryObject } from './Object';
import { History } from './History';
import { Editor } from './Editor';
import { TombLoader } from './TombLoader';
import { Living } from './Lifetime';

const storageKey = 'blacktomb.unlock';
function forgetPassword() {
  try { localStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ }
}

export function App() {
  const [phase, setPhase] = useState<'locked' | 'growing' | 'still'>('locked');
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [content, setContent] = useState<Content>({ objects: [], epitaph: null, history: {}, deleted: [] });
  const [epitaphSelected, setEpitaphSelected] = useState(false);
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [editing, setEditing] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const readyAttempt = useRef<number | null>(null);
  const [error, setError] = useState('');
  const passwordInput = useRef<HTMLInputElement>(null);
  const attempt = useRef(0);
  const [history, setHistory] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const items = [...content.objects.map((item) => ({ ...item, kind: 'object' as const })),
    ...content.deleted.map((item) => ({ ...item, kind: 'gap' as const }))]
    .sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));

  const unlock = async (value: string, save: boolean, expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000) => {
    const current = ++attempt.current;
    readyAttempt.current = null;
    setProgress({ done: 0, total: 0 });
    setBusy(true);
    setError('');
    try {
      const decrypted = await loadContent(value, (done, total) => {
        if (current === attempt.current) setProgress({ done, total });
      });
      if (current !== attempt.current) return;
      if (save) {
        try { localStorage.setItem(storageKey, JSON.stringify({ password: value, expiresAt })); } catch { /* Optional storage. */ }
      } else forgetPassword();
      setContent(decrypted);
      setCurrentPassword(value);
      setCount(0);
      setPassword('');
      readyAttempt.current = current;
    } catch (cause) {
      if (current !== attempt.current) return;
      forgetPassword();
      setError(cause instanceof EmptyContentError ? '目前還沒有內容'
        : cause instanceof IncorrectPasswordError ? '密碼不正確' : '無法載入內容，請重試');
      setPassword('');
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!busy && error) passwordInput.current?.focus();
  }, [busy, error]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.password === 'string' && typeof saved.expiresAt === 'number' && saved.expiresAt > Date.now()) {
          void unlock(saved.password, true, saved.expiresAt);
        } else forgetPassword();
      }
    } catch { forgetPassword(); }
    return () => { attempt.current++; };
  }, []);
  useEffect(() => {
    if (phase !== 'growing') return;
    const timer = setTimeout(() => {
      if (count < items.length) setCount(count + 1);
      else setPhase('still');
    }, count < items.length ? 380 : 700);
    return () => clearTimeout(timer);
  }, [phase, count, items.length]);
  useEffect(() => {
    if (selected || epitaphSelected) dialog.current?.showModal();
  }, [selected, epitaphSelected]);
  const close = () => {
    dialog.current?.close();
    setSelected(null);
    setEpitaphSelected(false);
    setHistory(false);
    previousFocus.current?.focus();
  };

  return <main className={`cemetery ${phase}`}>
    <div className="ground" aria-hidden="true" />
    <div className="horizon" aria-hidden="true" />
    {phase === 'locked' ? busy ? <TombLoader {...progress} onFinished={() => {
      if (readyAttempt.current !== attempt.current) return;
      readyAttempt.current = null;
      setBusy(false);
      setPhase('growing');
    }} /> : <div className="gate"><form onSubmit={(event) => {
      event.preventDefault();
      if (!busy) void unlock(password, remember);
    }}>
      <label htmlFor="password">密碼</label>
      <input ref={passwordInput} id="password" type="password" autoComplete="current-password"
        value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby={error ? 'unlock-error' : undefined} />
      <label className="remember"><input type="checkbox" checked={remember}
        onChange={(event) => setRemember(event.target.checked)} />記住此裝置 30 天</label>
      <button type="submit" disabled={busy}>{busy ? '解開中…' : '進入'}</button>
      {error && <p id="unlock-error" role="alert">{error}</p>}
    </form></div> : <>
      <header className="masthead"><span className="mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 20.5V10a4.5 4.5 0 0 1 9 0v10.5M5 20.5h14" /><path className="mark-carve" d="M10.5 10.5h3" /></svg>無名之地</span><div className="masthead-actions"><button className="lock" onClick={() => setEditing(true)}>編輯</button><button className="lock" onClick={() => {
        attempt.current++;
        readyAttempt.current = null;
        setBusy(false);
        forgetPassword();
        dialog.current?.close();
        setSelected(null);
        setEpitaphSelected(false);
        setHistory(false);
        setContent({ objects: [], epitaph: null, history: {}, deleted: [] });
        setCurrentPassword('');
        setPassword('');
        setEditing(false);
        setCount(0);
        setRemember(false);
        setError('');
        setPhase('locked');
      }}>上鎖</button></div></header>
      {content.epitaph !== null && <section className="epitaph" aria-label="墓誌銘">
        <h1><Living text={content.epitaph.split('\n')[0]} /></h1>
        <p><Living text={content.epitaph.split('\n').slice(1).join('\n')} /></p>
        <span className="epitaph-line" aria-hidden="true" />
        <button className="history" onClick={() => {
          previousFocus.current = document.activeElement as HTMLElement;
          setEpitaphSelected(true); setHistory(true);
        }}>歷史</button>
      </section>}
      <section className="memories" aria-label="依日期排列的物件" aria-busy={phase === 'growing'}>
        {items.slice(0, count).map((item) => item.kind === 'gap'
          ? <MemoryGap key={`${item.date}-${item.slug}`} item={item} />
          : <MemoryObject key={`${item.date}-${item.slug}`}
          item={item} selected={selected?.date === item.date && selected?.slug === item.slug}
          onOpen={() => { previousFocus.current = document.activeElement as HTMLElement; setSelected(item); }} />)}
      </section>
      <footer><span role="status">{phase === 'growing' ? '記憶正在生長' : '生長完成'}</span><span>停留或長按，讓線條呼吸 · 點選閱讀</span></footer>
    </>}
    <dialog ref={dialog} aria-labelledby="memory-title" onCancel={(event) => { event.preventDefault(); close(); }}>
      {(selected || epitaphSelected) && <article className="panel">
        <div className="panel-top"><button onClick={close} aria-label="關閉文字面板">關閉 ×</button></div>
        <h2 id="memory-title">{epitaphSelected ? '墓誌銘' : selected?.date}</h2>
        <p className="memory-text">{epitaphSelected ? <Living text={content.epitaph ?? ''} /> : selected?.text}</p>
        <button className="history" aria-expanded={history} onClick={() => setHistory(!history)}>歷史</button>
        {history && <History password={currentPassword} versions={content.history[epitaphSelected
          ? 'epitaph.md.enc.json' : `${selected?.date}-${selected?.slug}.md.enc.json`] ?? []} />}
      </article>}
    </dialog>
    {editing && <Editor content={content} password={currentPassword} onChange={setContent} onDone={() => {
      setEditing(false); setCount(0); setPhase('growing');
    }} />}
  </main>;
}
