import { useEffect, useRef, useState } from 'react';
import { loadVersion, type HistoryVersion } from './content';

function localDate(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function History({ versions, password }: { versions: HistoryVersion[]; password: string }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const attempt = useRef(0);
  useEffect(() => () => { attempt.current++; }, []);
  async function show(version: HistoryVersion) {
    const current = ++attempt.current;
    setChosen(version.file);
    setText('');
    setStatus('解開中…');
    try {
      const value = await loadVersion(version, password);
      if (current === attempt.current) { setText(value); setStatus(''); }
    } catch {
      if (current === attempt.current) setStatus('此版本無法用目前密碼解開');
    }
  }
  if (!versions.length) return <p role="status">沒有歷史紀錄</p>;
  return <section className="history-versions" aria-label="歷史版本">
    <ol>{versions.map((version, index) => <li key={version.file}>
      <button aria-pressed={chosen === version.file} onClick={() => void show(version)}>
        <time dateTime={version.date}>{localDate(version.date)}</time>{index === 0 && <span> 目前</span>}
      </button>
    </li>)}</ol>
    {status && <p role="status">{status}</p>}
    {chosen && !status && <p className="history-text">{text}</p>}
  </section>;
}
