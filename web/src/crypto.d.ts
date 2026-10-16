declare module '*.mjs' {
  export interface Envelope {
    v: number;
    kdf: string;
    iter: number;
    salt: string;
    iv: string;
    ct: string;
  }
  export function open(envelope: Envelope, password: string): Promise<string>;
  export function seal(text: string, password: string): Promise<Envelope>;
}
