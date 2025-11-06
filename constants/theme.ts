/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0891b2'; // Deep Teal
const tintColorDark = '#22d3ee'; // Bright Blue

export const Colors = {
  light: {
    text: '#1f2937',
    background: '#f9fafb',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    border: '#e5e7eb',
    success: '#10b981', // Vibrant Green
    error: '#ef4444',
    warning: '#f59e0b',
    primary: '#0891b2', // Deep Teal
    secondary: '#3b82f6', // Bright Blue
    accent: '#10b981', // Vibrant Green
  },
  dark: {
    text: '#f9fafb',
    background: '#111827',
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    card: '#1f2937',
    border: '#374151',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    primary: '#22d3ee', // Bright Blue
    secondary: '#60a5fa',
    accent: '#34d399', // Vibrant Green
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
