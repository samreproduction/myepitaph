export const shapeKinds = ['tree', 'flower', 'grass', 'bird', 'lantern', 'mountain'] as const;
export type ShapeKind = typeof shapeKinds[number];

export interface ShapeSpec {
  kind: ShapeKind;
  /** Ordered from ground/stem to upper details for the drawing animation. */
  paths: string[];
  parts: string[];
  fills: { cx: number; cy: number; r: number }[];
  strokeWidth: number;
  rotation: number;
}

/** Pure, stable text-to-line geometry; all control points stay inside the margins. */
export function shapeFor(text: string, override: { kind?: string } = {}): ShapeSpec {
  const letters = Array.from(text);
  const paragraphs = Math.max(1, text.split(/\n\s*\n|\n/).filter((part) => part.trim()).length);
  const punctuation = (text.match(/[，。！？、；：,.!?;:—]/g) ?? []).length;
  let hash = 2166136261;
  for (const letter of letters) hash = Math.imul(hash ^ letter.codePointAt(0)!, 16777619) >>> 0;
  const kind = shapeKinds.includes(override.kind as ShapeKind)
    ? override.kind as ShapeKind : shapeKinds[hash % shapeKinds.length];
  const size = Math.min(letters.length, 160) / 160;
  const top = 35 - size * 14;
  const lean = (hash % 9) - 4;
  const paths: string[] = [];
  const parts: string[] = [];
  const fills: ShapeSpec['fills'] = [];
  const add = (part: string, path: string) => { parts.push(part); paths.push(path); };
  const ground = () => add('ground', 'M 28 88 Q 50 86 72 88');

  if (kind === 'tree') {
    ground();
    add('trunk', `M 46 88 Q 49 65 ${48 + lean} ${top + 12} M 54 88 Q 51 65 ${52 + lean} ${top + 12}`);
    const levels = Math.min(4, paragraphs + 1);
    for (let i = 0; i < levels; i++) {
      const y = 72 - i * 10;
      add('branch', `M 50 ${y} Q 37 ${y - 3} ${30 + lean} ${y - 15} M 51 ${y - 3} Q 64 ${y - 7} ${71 + lean} ${y - 17}`);
    }
    add('crown', `M 31 65 C 13 66 12 46 23 42 C 16 28 31 ${top - 8} 41 ${top} C 50 ${top - 15} 69 ${top - 8} 70 ${top + 4} C 87 ${top + 2} 90 48 79 52 C 89 68 69 75 61 65 Q 45 77 31 65`);
    for (let i = 0; i < punctuation % 4; i++) fills.push({ cx: 34 + i * 13, cy: 47 + i % 2 * 9, r: 1.3 });
  } else if (kind === 'flower') {
    ground();
    const x = 50 + lean;
    add('stem', `M 50 88 Q ${58 + lean} 64 ${x} ${top + 12}`);
    add('leaf', 'M 52 73 Q 31 75 30 59 Q 47 58 52 73');
    if (punctuation % 2) add('leaf', 'M 53 65 Q 70 64 72 50 Q 57 49 53 65');
    const petals = 5 + Math.min(paragraphs, 4);
    for (let i = 0; i < petals; i++) {
      const angle = i * Math.PI * 2 / petals;
      const px = x + Math.cos(angle) * 15;
      const py = top + 5 + Math.sin(angle) * 15;
      add('petal', `M ${x} ${top + 5} Q ${px - Math.sin(angle) * 9} ${py + Math.cos(angle) * 9} ${px} ${py} Q ${px + Math.sin(angle) * 9} ${py - Math.cos(angle) * 9} ${x} ${top + 5}`);
    }
    fills.push({ cx: x, cy: top + 5, r: 2 });
  } else if (kind === 'grass') {
    ground();
    const blades = 5 + Math.min(paragraphs - 1, 4);
    for (let i = 0; i < blades; i++) {
      const x = 20 + i * 60 / (blades - 1);
      const y = 60 - size * 17 - (i * 7 % 19);
      add('blade', `M ${44 + i} 88 Q ${x + lean} 68 ${x} ${y} Q ${x + 6} 69 ${49 + i} 88`);
    }
    if (punctuation % 2) {
      add('flower-stem', 'M 57 88 Q 70 66 73 51');
      add('small-flower', 'M 73 51 Q 62 48 69 43 Q 70 34 76 42 Q 86 41 81 48 Q 81 57 73 51');
    }
  } else if (kind === 'bird') {
    add('perch', 'M 22 88 Q 50 83 80 87 M 66 85 L 74 79');
    add('feet', 'M 49 73 L 47 85 L 42 86 M 59 74 L 59 85 L 64 86');
    add('tail', `M 39 65 L 17 ${48 - size * 8} L 24 72 L 43 75`);
    add('body', `M 40 58 C 48 49 66 50 70 62 C 74 79 45 84 35 69 Q 32 62 40 58`);
    const head = top + 8;
    add('head', `M 56 55 C 49 ${head} 61 ${head - 11} 70 ${head - 4} Q 81 ${head + 4} 71 60`);
    add('beak', `M 75 ${head + 3} L 85 ${head + 8} L 74 ${head + 11}`);
    add('wing', `M 42 62 Q 54 ${59 + punctuation % 8} 63 65 Q 54 ${74 + Math.min(paragraphs, 4)} 42 62`);
    fills.push({ cx: 68, cy: head + 2, r: 1.5 });
  } else if (kind === 'lantern') {
    ground();
    add('base', 'M 35 82 L 65 82 L 68 88 L 32 88 Z');
    add('body', `M 32 81 L 35 ${top + 20} L 65 ${top + 20} L 68 81 Z M 40 80 L 42 ${top + 22} M 60 80 L 58 ${top + 22}`);
    add('flame', `M 49 76 Q ${39 - punctuation % 5} 67 51 ${57 - size * 7} Q 50 65 57 68 Q 62 78 49 76`);
    add('cap', `M 30 ${top + 20} Q 50 ${top + 7} 70 ${top + 20} Z`);
    add('handle', `M 40 ${top + 13} C 32 ${top - 7} 68 ${top - 7} 60 ${top + 13}`);
    add('cord', `M 50 ${top} Q ${50 + lean} 17 50 9`);
    for (let i = 0; i < Math.min(paragraphs, 3); i++) add('vent', `M ${44 + i * 6} ${top + 16} L ${44 + i * 6} ${top + 19}`);
  } else {
    ground();
    const count = paragraphs > 1 ? 3 : 2;
    add('ridge', `M 12 88 L ${34 + lean} ${top + 14} L 63 88`);
    add('ridge', `M 40 88 L 68 ${top} L 89 88`);
    if (count === 3) add('ridge', `M 17 88 L 24 ${top + 30} L 43 88`);
    add('snow', `M 59 ${top + 19} L 64 ${top + 22 + punctuation % 4} L 68 ${top + 13} L 74 ${top + 19} L 77 ${top + 23}`);
    add('moon', 'M 37 18 C 24 12 19 31 30 34 C 22 27 29 18 37 18');
  }
  return { kind, paths, parts, fills, strokeWidth: 1 + (hash % 5) / 10, rotation: (hash % 7 - 3) / 2 };
}
