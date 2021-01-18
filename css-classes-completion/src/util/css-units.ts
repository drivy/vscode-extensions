const DEFAULT_ROOT_FONT_SIZE = 16;

const remUnitRegex = /([-]?\d*\.?\d+)rem/;
const globalEndingRemUnitRegex = /([-]?\d*\.?\d+)rem;/g;

export const convertRemToPx = (
  rem: string,
  rootFontSizeInPx: number = DEFAULT_ROOT_FONT_SIZE
) => {
  const value = parseFloat(rem.startsWith(".") ? `0${rem}` : rem);
  return `${rootFontSizeInPx * value}px`;
};

export const extractRemUnit = (sValue: string) => {
  const match = sValue.match(remUnitRegex);
  return match ? match[1] : null;
};

export const addRemToPx = (sCss: string, rootFontSizeInPx?: number) => {
  return sCss.replace(
    globalEndingRemUnitRegex,
    (m) => `${m} /* ${convertRemToPx(m, rootFontSizeInPx)} */`
  );
};
