// The fonts @pts/android bundles (ADR 0059): upstream's TrueType files in fonts/, from the releases @pts/web/fonts
// takes its WOFF2 files from (Aspekta @aspekta/fonts@2.100, IBM Plex Mono 2.5.0, IBM Plex Serif 2.0.0), since Android
// font resources read TrueType and OpenType only. They are copied as they are: a TrueType file converted from the
// WOFF2 would be a Modified Version under the OFL, which may not keep the Reserved Font Names (ADR 0076). `family` is
// the first name in the token's font stack (typeface/*), which PtsTypography maps to a PtsFonts property. Aspekta is
// one variable file; Android 8+ reads its weight axis, so each weight is one Font entry with a variation setting.
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
  ).map(([weight, style]) => ({ src: `${dir}/${name}-${style}.ttf`, res: `${res}_${style.toLowerCase()}`, weight }));

export const families: Family[] = [
  {
    property: "sans",
    family: "Aspekta",
    variable: true,
    files: [400, 500, 600, 700].map((weight) => ({ src: "aspekta/AspektaVF.ttf", res: "aspekta", weight })),
  },
  { property: "serif", family: "IBM Plex Serif", variable: false, files: plex("IBMPlexSerif", "ibm-plex-serif", "ibm_plex_serif") },
  { property: "mono", family: "IBM Plex Mono", variable: false, files: plex("IBMPlexMono", "ibm-plex-mono", "ibm_plex_mono") },
];
