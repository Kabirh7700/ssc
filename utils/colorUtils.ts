
// This utility is a placeholder for a more robust way to access Tailwind theme colors in JS/TS.
// For now, charts will use hardcoded hex values or assume global Tailwind CSS variables are available.

interface ColorShades {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
  DEFAULT?: string; // For colors like primary.DEFAULT
  light?: string;   // For custom shades like primary.light
  hover?: string;   // For custom shades like primary.hover
  text?: string;    // For text colors associated with a semantic color
}

interface TailwindColors {
  primary?: ColorShades;
  accent?: ColorShades;
  neutral?: ColorShades;
  red?: ColorShades; // Kept for semantic meaning, might be same as danger
  green?: ColorShades; // Kept for semantic meaning, might be same as success
  blue?: ColorShades; // General blue
  yellow?: ColorShades; // General yellow, might be same as warning
  amber?: ColorShades;
  sky?: ColorShades;
  emerald?: ColorShades;
  rose?: ColorShades;
  indigo?: ColorShades;
  lime?: ColorShades;
  pink?: ColorShades;
  teal?: ColorShades; // Added teal
  cyan?: ColorShades; // Added cyan
  success?: ColorShades;
  warning?: ColorShades;
  danger?: ColorShades;
  // Add other colors from your tailwind.config.js as needed
}

// Attempt to get colors from the global tailwind object if available (e.g. from index.html script)
// This is a simplified approach and might not be robust in all environments.
let resolvedColors: TailwindColors = {};

const defaultThemeColors: TailwindColors = {
    primary: { DEFAULT: '#F59E0B', hover: '#D97706', light: '#FEF3C7' }, // amber-500
    accent: { DEFAULT: '#F59E0B', hover: '#D97706' }, // amber-500
    neutral: {
      50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB',
      400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151',
      800: '#1F2937', 900: '#11182C',
    },
    success: { DEFAULT: '#10B981', light: '#A7F3D0', text: '#ECFDF5' }, // emerald-500
    warning: { DEFAULT: '#FBBF24', light: '#FEF3C7', text: '#78350F' }, // amber-400
    danger: { DEFAULT: '#EF4444', light: '#FECACA', text: '#FEE2E2' },   // red-500
    // General palette colors, can be used by charts directly
    red: { 500: '#EF4444' },    // danger.DEFAULT
    green: { 500: '#10B981' },  // success.DEFAULT
    blue: { 500: '#3B82F6' },   // A general blue
    yellow: { 500: '#FBBF24' }, // warning.DEFAULT
    amber: {500: '#F59E0B'},    // primary.DEFAULT
    sky: {500: '#0EA5E9'},      // Sky blue
    emerald: {500: '#10B981'},  // success.DEFAULT
    rose: {500: '#F43F5E'},     // A reddish-pink
    indigo: {500: '#6366F1'},   // An indigo
    lime: {500: '#84CC16', 400: '#a3e635' }, // Added 400 shade for charts
    pink: {500: '#EC4899'},     // Pink
    teal: {400: '#2dd4bf', 500: '#14b8a6'}, // Added teal
    cyan: {500: '#06b6d4'}, // Added cyan
};


if (typeof window !== 'undefined' && (window as any).tailwind && (window as any).tailwind.config && (window as any).tailwind.config.theme && (window as any).tailwind.config.theme.extend && (window as any).tailwind.config.theme.extend.colors) {
    const twColors = (window as any).tailwind.config.theme.extend.colors;
    resolvedColors = { ...defaultThemeColors, ...twColors }; // Merge, letting Tailwind config override defaults
} else {
    resolvedColors = defaultThemeColors;
}


export const TailWindColor: Readonly<TailwindColors> = resolvedColors;