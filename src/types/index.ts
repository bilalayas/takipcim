export interface Task {
  id: string;
  name: string;
  category?: string;
  plannedDuration?: number; // minutes
  dates: string[]; // YYYY-MM-DD
}

export interface Session {
  id: string;
  taskId: string;
  taskName: string;
  date: string;
  duration: number; // seconds
  type: 'work' | 'break';
  timestamp: number;
}

export type ThemeMode = 'light' | 'dark';
export type ColorPalette = 'forest' | 'pink' | 'blue' | 'mono';

export interface AppSettings {
  themeMode: ThemeMode;
  colorPalette: ColorPalette;
  notifications: boolean;
  askBreakTimer: boolean;
  defaultBreakDuration: number; // minutes
  onboardingDone: boolean;
  useCase?: string;
}

export const defaultSettings: AppSettings = {
  themeMode: 'light',
  colorPalette: 'forest',
  notifications: true,
  askBreakTimer: true,
  defaultBreakDuration: 5,
  onboardingDone: false,
};

export const paletteNames: Record<ColorPalette, string> = {
  forest: 'Forest',
  pink: 'Pastel Pink',
  blue: 'Steel Blue',
  mono: 'Monochrome',
};
