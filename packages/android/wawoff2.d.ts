// wawoff2 ships no types: the one function build-fonts.ts calls
declare module "wawoff2" {
  export function decompress(woff2: Uint8Array): Promise<Uint8Array>;
}
