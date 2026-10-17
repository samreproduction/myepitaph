import { useEffect, useState } from 'react';

// `{{存在:YYYY-MM-DD}}` in the epitaph becomes a live "N 小時 N 秒" count since that date (00:00 Hong Kong time).
const token = /\{\{存在:(\d{4}-\d{2}-\d{2})\}\}/g;

export function lifetime(birth: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(`${birth}T00:00:00+08:00`)) / 1000));
  const format = (value: number) => value.toLocaleString('en-US');
  return `${format(Math.floor(seconds / 3600))} 小時 ${format(seconds % 3600)} 秒`;
}

export function livingText(text: string, now: number) {
  return text.replace(token, (_, birth: string) => lifetime(birth, now));
}

export function Living({ text }: { text: string }) {
  const [now, setNow] = useState(Date.now);
  const live = new RegExp(token.source).test(text);
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [live]);
  // Keep the count on one line; split() puts the captured birth dates at odd indexes.
  return <>{text.split(token).map((part, index) => index % 2
    ? <span key={index} className="lifetime">{lifetime(part, now)}</span> : part)}</>;
}
