import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';

export interface CustomThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  sidebar: string;
}

// Store theme preference in localStorage since user_preferences table doesn't exist
const THEME_STORAGE_KEY = 'user-theme-preference';

export function useThemePreference() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    if (!isInitialized) {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme) {
        setTheme(storedTheme);
      }
      setIsInitialized(true);
      setIsLoading(false);
    }
  }, [isInitialized, setTheme]);

  // Custom setTheme that also saves to localStorage
  const setThemeWithPersistence = useCallback((newTheme: string) => {
    setTheme(newTheme);
    setPreviewTheme(null);
    setIsSaving(true);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setIsSaving(false);
  }, [setTheme]);

  // Preview a theme temporarily without saving
  const startPreview = useCallback((themeToPreview: string) => {
    setPreviewTheme(themeToPreview);
    // Apply theme class temporarily
    document.documentElement.classList.remove('light', 'dark', 'trading', 'blue', 'green', 'purple', 'custom');
    document.documentElement.classList.add(themeToPreview);
  }, []);

  // Cancel preview and restore original theme
  const cancelPreview = useCallback(() => {
    if (previewTheme && theme) {
      document.documentElement.classList.remove('light', 'dark', 'trading', 'blue', 'green', 'purple', 'custom');
      document.documentElement.classList.add(theme);
    }
    setPreviewTheme(null);
  }, [previewTheme, theme]);

  // Apply preview as permanent theme
  const applyPreview = useCallback(() => {
    if (previewTheme) {
      setThemeWithPersistence(previewTheme);
    }
  }, [previewTheme, setThemeWithPersistence]);

  return {
    theme: previewTheme || theme,
    actualTheme: theme,
    resolvedTheme,
    setTheme: setThemeWithPersistence,
    isLoading: isLoading && !isInitialized,
    isSaving,
    // Preview functionality
    isPreviewActive: !!previewTheme,
    previewTheme,
    startPreview,
    cancelPreview,
    applyPreview,
  };
}
