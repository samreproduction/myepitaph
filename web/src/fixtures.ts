export interface Fixture {
  date: string;
  slug: string;
  text: string;
}

export const epitaph = '測試墓誌銘\n這裡只有假文字\n不是任何人的真實記憶';

export const fixtures: Fixture[] = [
  { date: '2026-01-03', slug: 'test-one', text: '測試物件一。\n這是一段用來展示的假文字。' },
  { date: '2026-02-12', slug: 'test-two', text: '測試物件二：這不是日記，只是介面測試。' },
  { date: '2026-03-08', slug: 'test-three', text: '測試物件三。\n假段落。\n另一個假段落。' },
  { date: '2026-04-21', slug: 'test-four', text: '測試物件四，假文字，假標點，沒有真實故事。' },
  { date: '2026-05-16', slug: 'test-five', text: '測試物件五。僅供原型展示！' },
  { date: '2026-06-02', slug: 'test-six', text: '測試物件六？\n這是測試用的回答。' },
  { date: '2026-07-19', slug: 'test-seven', text: '測試物件七——一段比較長的假文字，用來生成另一種抽象線條。' },
  { date: '2026-08-30', slug: 'test-eight', text: '測試物件八。\n假內容的最後一件。' },
].sort((a, b) => a.date.localeCompare(b.date));
