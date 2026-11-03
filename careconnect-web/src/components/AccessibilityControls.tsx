import { useEffect, useState } from 'react';
import { Moon, PhoneCall, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { contacts } from '../data/mockData';
import { getExtendedProfile, PROFILE_CHANGED_EVENT } from '../data/profileSupport';
import '../cognitive-accessibility.css';

type FontSize = 'normal' | 'large' | 'xlarge';

export default function AccessibilityControls() {
  const location = useLocation();

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('careconnect_font_size');
    return saved === 'large' || saved === 'xlarge' ? saved : 'normal';
  });

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('careconnect_theme') === 'dark',
  );

  const [, refreshProfile] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.ccFont = fontSize;
    localStorage.setItem('careconnect_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.dataset.ccTheme = darkMode ? 'dark' : 'light';
    localStorage.setItem('careconnect_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const refresh = () => refreshProfile((value) => value + 1);
    window.addEventListener(PROFILE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, refresh);
  }, []);

  const profile = getExtendedProfile();
  const family = contacts.find((contact) => contact.role === 'family');

  const familyName = profile.familyMemberName || family?.name || 'family member';
  const familyPhone = profile.familyMemberPhone || family?.phone || '';
  const inApp = location.pathname.startsWith('/app');

  return (
    <aside
      aria-label="Accessibility, display, and contact options"
      className={`cc-controls ${inApp ? 'cc-controls-app' : 'cc-controls-public'}`}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="cc-control-group" role="group" aria-label="Text size">
          <span className="cc-control-label">Text size</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cc-btn"
              aria-label="Normal text size"
              aria-pressed={fontSize === 'normal'}
              onClick={() => setFontSize('normal')}
            >
              A
            </button>
            <button
              type="button"
              className="cc-btn"
              aria-label="Large text size"
              aria-pressed={fontSize === 'large'}
              onClick={() => setFontSize('large')}
            >
              A+
            </button>
            <button
              type="button"
              className="cc-btn"
              aria-label="Extra large text size"
              aria-pressed={fontSize === 'xlarge'}
              onClick={() => setFontSize('xlarge')}
            >
              A++
            </button>
          </div>
        </div>

        <div className="cc-control-group">
          <span className="cc-control-label">Theme</span>
          <button
            type="button"
            className="cc-btn cc-theme-button"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
            <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

        {inApp && familyPhone && (
          <div className="cc-control-group">
            <span className="cc-control-label">Quick calls</span>
            <div className="flex flex-wrap items-center gap-2">
              {familyPhone && (
                <a
                  href={`tel:${familyPhone.replace(/\s/g, '')}`}
                  className="cc-family-button"
                  aria-label={`Call ${familyName}`}
                >
                  <PhoneCall className="w-5 h-5" aria-hidden="true" />
                  Call Family
                </a>
              )}

            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
