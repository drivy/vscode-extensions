import { TinyColor } from '@ctrl/tinycolor';

export function getColorFromValue(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	if (value === 'transparent') {
		return 'rgba(0, 0, 0, 0.01)';
	}
	const color = new TinyColor(value);
	if (color.isValid) {
		return color.toRgbString();
	}
	return null;
}
