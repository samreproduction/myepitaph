export interface ShapeSpec {
  kind: string;
  paths: string[];
  strokeWidth: number;
  rotation: number;
}

/** Pure, stable text-to-line geometry; no content or cryptography dependency. */
export function shapeFor(text: string, override: { kind?: string } = {}): ShapeSpec {
  const letters = Array.from(text);
  const paragraphs = text.split(/\n\s*\n|\n/).filter((part) => part.trim()).length;
  const punctuation = (text.match(/[，。！？、；：,.!?;:—]/g) ?? []).length;
  let hash = 2166136261;
  for (const letter of letters) {
    hash = Math.imul(hash ^ letter.codePointAt(0)!, 16777619) >>> 0;
  }
  const kind = override.kind ?? ['branch', 'orbit', 'fold'][hash % 3];
  const spread = 15 + (hash % 23);
  const height = 18 + (letters.length % 24);
  const paths = kind === 'orbit'
    ? [`M 50 ${50 - height} C ${50 + spread} 20, ${50 + spread} 80, 50 ${50 + height} C ${50 - spread} 80, ${50 - spread} 20, 50 ${50 - height}`, 'M 24 68 L 76 32']
    : kind === 'fold'
      ? [`M 20 78 L ${50 - spread / 2} ${50 - height} L 75 66 L 40 54 L 58 82`, 'M 30 85 L 74 85']
      : [`M 50 86 Q ${40 + punctuation} 58 50 ${50 - height}`, `M 50 60 L ${50 - spread} ${30 + paragraphs * 3} M 49 70 L ${50 + spread} ${37 + punctuation}`];
  return { kind, paths, strokeWidth: 1 + (hash % 7) / 10, rotation: (hash % 25) - 12 };
}
