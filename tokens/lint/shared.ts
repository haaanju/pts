// Small helpers the pts/* rules share.

/** A dimension's value when it is in px, e.g. { value: 16, unit: "px" } → 16; undefined for anything else */
export const px = (value: unknown) => {
  const v = value as { value?: number; unit?: string } | undefined;
  return v && typeof v.value === "number" && v.unit === "px" ? v.value : undefined;
};

/** A report that sends each key once: the same problem shows up in every permutation that shares the values */
export const reportOnce = () => {
  const seen = new Set<string>();
  return (key: string, send: () => void) => {
    if (!seen.has(key)) {
      seen.add(key);
      send();
    }
  };
};
