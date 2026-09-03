import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppSettings } from '../types';

type Theme = AppSettings['theme'];

const OPTIONS: { value: Theme; Icon: React.FC<{ size?: number }> }[] = [
  { value: 'light',  Icon: Sun },
  { value: 'system', Icon: Monitor },
  { value: 'dark',   Icon: Moon },
];

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { settings, updateSettings } = useApp();

  if (compact) {
    // Cycles through: system → light → dark → system
    const next: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
    const current = OPTIONS.find(o => o.value === settings.theme)!;
    return (
      <button
        id="btn-theme-cycle"
        className="theme-btn-compact"
        onClick={() => updateSettings({ theme: next[settings.theme] })}
        title={`Theme: ${settings.theme}`}
      >
        <current.Icon size={18} />
      </button>
    );
  }

  return (
    <div className="theme-segmented" role="group" aria-label="Theme selector">
      {OPTIONS.map(({ value, Icon }) => (
        <button
          key={value}
          id={`btn-theme-${value}`}
          className={`theme-seg-btn${settings.theme === value ? ' theme-seg-btn--active' : ''}`}
          onClick={() => updateSettings({ theme: value })}
          title={value.charAt(0).toUpperCase() + value.slice(1)}
        >
          <Icon size={15} />
          <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
        </button>
      ))}
    </div>
  );
};
