export const THEME_COLORS = Object.freeze({
  primary: {
    50: '#F3F5FF',
    100: '#E6EAFF',
    200: '#CDD5FF',
    300: '#AEB9FB',
    400: '#8E9BF5',
    500: '#6F7EEA',
    600: '#5766D6',
    700: '#4552B8',
  },
  surface: {
    page: '#F8F8FD',
    card: '#FFFFFF',
    muted: '#F1F1F8',
  },
  line: '#E6E7F2',
  ink: {
    DEFAULT: '#2B2F45',
    soft: '#5B6079',
    faint: '#8A8FA8',
  },
  pastel: {
    mint: { bg: '#DDF5EA', text: '#1F6B4F' },
    sky: { bg: '#DCEEFB', text: '#1D5A8A' },
    lavender: { bg: '#E9E4FA', text: '#503E93' },
    peach: { bg: '#FFE8D9', text: '#9A4B1F' },
    butter: { bg: '#FFF3CF', text: '#7A5A00' },
    rose: { bg: '#FFE0E6', text: '#A02B45' },
    slate: { bg: '#ECEEF4', text: '#4A5068' },
  },
});

export const SEVERITY_PIN_COLORS = Object.freeze({
  low: THEME_COLORS.pastel.mint,
  medium: THEME_COLORS.pastel.butter,
  high: THEME_COLORS.pastel.peach,
  critical: THEME_COLORS.pastel.rose,
});

export default THEME_COLORS;
