import { useState } from 'react';

export interface UserPreferences {
  density: 'compact' | 'comfortable';
  sidebarCollapsed: boolean;
  focusMode: boolean;
  animationIntensity: 'none' | 'subtle' | 'full';
  autoReplay: boolean;
  themeContrast: 'standard' | 'high';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  density: 'comfortable',
  sidebarCollapsed: false,
  focusMode: false,
  animationIntensity: 'subtle',
  autoReplay: false,
  themeContrast: 'standard',
};

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('pql_preferences');
    return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
  });

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('pql_preferences', JSON.stringify(updated));
  };

  const toggleSidebar = () => {
    updatePreference('sidebarCollapsed', !preferences.sidebarCollapsed);
  };

  const toggleFocusMode = () => {
    updatePreference('focusMode', !preferences.focusMode);
  };

  return { preferences, updatePreference, toggleSidebar, toggleFocusMode };
};
