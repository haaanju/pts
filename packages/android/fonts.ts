// The fonts @pts/android bundles (ADR 0059): the same files as @pts/web/fonts, decompressed from WOFF2 to TrueType,
// since Android font resources read TrueType and OpenType only. `family` is the first name in the token's font
// stack (typeface/*), which PtsTypography maps to a PtsFonts property. Aspekta is one variable file; Android 8+
// reads its weight axis, so each weight is one Font entry with a variation setting.
export type FontFile = { src: string; res: string; weight: number };
export type Family = { property: string; family: string; variable: boolean; files: FontFile[] };

const plex = (name: string, dir: string, res: string): FontFile[] =>
  (
    [
      [400, "Regular"],
      [500, "Medium"],
      [600, "SemiBold"],
      [700, "Bold"],
    ] as const
  ).map(([weight, style]) => ({ src: `${dir}/${name}-${style}.woff2`, res: `${res}_${style.toLowerCase()}`, weight }));

export const families: Family[] = [
  {
    property: "sans",
    family: "Aspekta",
    variable: true,
    files: [400, 500, 600, 700].map((weight) => ({ src: "aspekta/AspektaVF.woff2", res: "aspekta", weight })),
  },
  { property: "serif", family: "IBM Plex Serif", variable: false, files: plex("IBMPlexSerif", "ibm-plex-serif", "ibm_plex_serif") },
  { property: "mono", family: "IBM Plex Mono", variable: false, files: plex("IBMPlexMono", "ibm-plex-mono", "ibm_plex_mono") },
];
