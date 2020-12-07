const DEFAULT_ROOT_FONT_SIZE = 16;

const remUnitRegex = /([-]?\d*\.?\d+)rem/;
const globalEndingRemUnitRegex = /([-]?\d*\.?\d+)rem;/g;

export const convertRemToPx = (rem: string) => {
  const value = parseFloat(rem.startsWith(".") ? `0${rem}` : rem);
  return `${DEFAULT_ROOT_FONT_SIZE * value}px`;
};

export const extractRemUnit = (sValue: string) => {
  const match = sValue.match(remUnitRegex);
  return match ? match[1] : null;
};

export const addRemToPx = (sCss: string) => {
  return sCss.replace(
    globalEndingRemUnitRegex,
    (m) => `${m} /* ${convertRemToPx(m)} */`
  );
};
