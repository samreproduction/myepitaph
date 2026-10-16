import { useEffect, useRef, useState } from 'react';
import { open, seal } from '../../src/crypto.mjs';
import type { Content, Memory } from './content';
import { parseFilename } from './content';
import { commitContent } from './github';

const tokenKey = 'blacktomb.token';
const success = '已提交，約一分鐘後上線';
const pathFor = (item: Memory) => `objects/${item.date}-${item.slug}.md.enc.json`;
export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function Editor({ content, password, onChange, onDone }: {
  content: Content; password: string; onChange: (content: Content) => void; onDone: () => void;
}) {
  const [token, setToken] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [epitaph, setEpitaph] = useState(content.epitaph ?? '');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const originals = useRef({ epitaph: content.epitaph, objects: Object.fromEntries(content.objects.map((item) => [pathFor(item), item.text])) });
  const [date, setDate] = useState(today);
  const [slug, setSlug] = useState('entry');
  const [text, setText] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    let active = true;
    void (async () => {
      try {
        const raw = localStorage.getItem(tokenKey);
        if (raw) {
          const value = await open(JSON.parse(raw), password);
          if (active) setToken(value);
        }
      } catch { if (active) setMessages({ token: '無法讀取權杖，請重新貼上' }); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [password]);

  async function run(key: string, work: () => Promise<void>) {
    if (busy) return;
    setBusy(key);
    setMessages((previous) => ({ ...previous, [key]: '' }));
    try { await work(); setMessages((previous) => ({ ...previous, [key]: key === 'token' ? '權杖已加密儲存' : success })); }
    catch (cause) { setMessages((previous) => ({ ...previous, [key]: cause instanceof Error ? cause.message : '操作失敗' })); }
    finally { setBusy(''); }
  }
  const status = (key: string) => messages[key] && <p role="status">{messages[key]}</p>;
  const save = (key: string, work: () => Promise<void>) => <button disabled={!!busy || !token} onClick={() => void run(key, work)}>{busy === key ? '提交中…' : '儲存'}</button>;

  return <section className="editor" aria-label="編輯面板" aria-busy={!!busy}>
    <header><h1 ref={heading} tabIndex={-1}>編輯</h1><button disabled={!!busy || loading} onClick={onDone}>完成</button></header>
    <section aria-label="GitHub 權杖">
      {loading ? <p>讀取權杖中…</p> : token ? <>
        <p>權杖已載入</p><button disabled={!!busy} onClick={() => {
          try { localStorage.removeItem(tokenKey); setToken(''); setInput(''); setMessages({}); }
          catch { setMessages({ token: '無法移除權杖，請檢查瀏覽器儲存設定' }); }
        }}>移除權杖</button>
      </> : <>
        <label htmlFor="github-token">貼上 GitHub 細粒度權杖（只授權 myepitaph，權限 Contents: Read and write，請設到期日）</label>
        <input id="github-token" type="password" autoComplete="off" value={input} onChange={(event) => setInput(event.target.value)} />
        <button disabled={!!busy || !input.trim()} onClick={() => void run('token', async () => {
          const value = input.trim();
          try { localStorage.setItem(tokenKey, JSON.stringify(await seal(value, password))); }
          catch { throw new Error('無法加密儲存權杖，請檢查瀏覽器儲存設定'); }
          setToken(value); setInput('');
        })}>{busy === 'token' ? '儲存中…' : '儲存權杖'}</button>
      </>}{status('token')}
    </section>
    <section aria-label="編輯墓誌銘"><label htmlFor="edit-epitaph">墓誌銘</label>
      <textarea id="edit-epitaph" value={epitaph} onChange={(event) => setEpitaph(event.target.value)} />
      {save('epitaph', async () => {
        await commitContent('epitaph.md.enc.json', { mode: 'update', originalText: originals.current.epitaph, text: epitaph }, password, token);
        originals.current.epitaph = epitaph;
        onChange({ ...content, epitaph });
      })}{status('epitaph')}
    </section>
    <section aria-label="物件清單"><h2>物件清單</h2>
      {[...content.objects].sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug)).map((item) => {
        const path = pathFor(item);
        return <details key={path} data-testid="edit-object"><summary>{item.date} {item.text.split('\n')[0]}</summary>
          <label>物件文字<textarea value={drafts[path] ?? item.text} onChange={(event) => setDrafts({ ...drafts, [path]: event.target.value })} /></label>
          {save(path, async () => {
            const value = drafts[path] ?? item.text;
            await commitContent(path, { mode: 'update', originalText: originals.current.objects[path], text: value }, password, token);
            originals.current.objects[path] = value;
            onChange({ ...content, objects: content.objects.map((entry) => pathFor(entry) === path ? { ...entry, text: value } : entry) });
          })}
          <button disabled={!!busy || !token} onClick={() => {
            if (window.confirm('確定刪除？內容仍保留在 Git 歷史')) void run(path, async () => {
              await commitContent(path, { mode: 'remove', originalText: originals.current.objects[path] }, password, token);
              delete originals.current.objects[path];
              onChange({ ...content, objects: content.objects.filter((entry) => pathFor(entry) !== path),
                deleted: [...content.deleted, { date: item.date, slug: item.slug, deletedAt: new Date().toISOString() }] });
              setMessages((previous) => ({ ...previous, deletion: success }));
            });
          }}>刪除</button>{status(path)}
        </details>;
      })}{status('deletion')}
    </section>
    <section aria-label="新增物件"><h2>新增物件</h2>
      <label>日期<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label>短名<input value={slug} onChange={(event) => setSlug(event.target.value)} /></label>
      <label>新增文字<textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
      {save('new', async () => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('請填寫日期');
        const clean = slug.replace(/[/\\]/g, '').trim() || 'entry';
        const path = await commitContent(pathFor({ date, slug: clean, text }), { mode: 'create', text }, password, token);
        const metadata = parseFilename(path.slice('objects/'.length));
        if (!metadata) throw new Error('無法辨識新增物件路徑');
        const item = { ...metadata, text };
        originals.current.objects[path] = text;
        onChange({ ...content, objects: [...content.objects, item] });
        setText('');
      })}{status('new')}
    </section>
  </section>;
}
