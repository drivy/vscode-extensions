const DEFAULT_ROOT_FONT_SIZE = 16;

const remUnitRegex = /([-]?\d*\.?\d+)rem/;
const globalRemUnitRegex = /([-]?\d*\.?\d+)rem/g;

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

export const replaceRemToPx = (sCss: string, rootFontSizeInPx?: number) => {
  return sCss.replace(
    globalRemUnitRegex,
    (m) => `${convertRemToPx(m, rootFontSizeInPx)}`
  );
};

export const addRemToPx = (sCss: string, rootFontSizeInPx?: number) => {
  return sCss.replace(
    globalRemUnitRegex,
    (m) => `${m} /* ${convertRemToPx(m, rootFontSizeInPx)} */`
  );
};
