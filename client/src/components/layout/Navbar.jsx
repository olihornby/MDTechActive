import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'mdtechactive-theme';
const A11Y_STORAGE_KEY = 'mdtechactive-a11y';
const TEXT_SCALE_OPTIONS = [
  { label: 'Small', scale: 0.95 },
  { label: 'Default', scale: 1 },
  { label: 'Large', scale: 1.1 },
];

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

const getInitialThemeTone = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) || '{}');
    if (Number.isFinite(Number(stored.themeTone))) {
      return clampNumber(Number(stored.themeTone), 0, 100);
    }
  } catch {
    // Ignore invalid stored data.
  }

  const storedTheme = localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'dark') {
    return 100;
  }

  if (storedTheme === 'light') {
    return 0;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 100 : 0;
};

const applyThemeTone = (tone) => {
  const normalized = clampNumber(Number(tone), 0, 100);
  const root = document.documentElement;
  root.style.setProperty('--theme-tone', String(normalized));
  root.setAttribute('data-theme-tone', String(normalized));

  if (normalized <= 0) {
    root.setAttribute('data-theme', 'light');
    localStorage.setItem(STORAGE_KEY, 'light');
    return normalized;
  }

  if (normalized >= 100) {
    root.setAttribute('data-theme', 'dark');
    localStorage.setItem(STORAGE_KEY, 'dark');
    return normalized;
  }

  root.setAttribute('data-theme', 'blend');
  localStorage.setItem(STORAGE_KEY, 'blend');
  return normalized;
};

const getAccessibilityPreferences = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) || '{}');
    const storedScaleIndex = Number(stored.textScaleIndex);
    const textScaleIndex = Number.isFinite(storedScaleIndex)
      ? clampNumber(storedScaleIndex, 0, TEXT_SCALE_OPTIONS.length - 1)
      : stored.largeText
        ? 2
        : 1;

    const storedTone = Number(stored.themeTone);
    const themeTone = Number.isFinite(storedTone)
      ? clampNumber(storedTone, 0, 100)
      : null;

    return {
      highContrast: Boolean(stored.highContrast),
      reducedMotion: Boolean(stored.reducedMotion),
      textScaleIndex,
      themeTone,
    };
  } catch {
    return {
      highContrast: false,
      reducedMotion: false,
      textScaleIndex: 1,
      themeTone: null,
    };
  }
};

const applyAccessibilityPreferences = (prefs) => {
  const root = document.documentElement;
  root.setAttribute('data-high-contrast', prefs.highContrast ? 'true' : 'false');
  root.setAttribute('data-reduced-motion', prefs.reducedMotion ? 'true' : 'false');
  root.setAttribute('data-text-scale', String(prefs.textScaleIndex));
  const scale = TEXT_SCALE_OPTIONS[prefs.textScaleIndex]?.scale ?? 1;
  root.style.setProperty('--text-scale', String(scale));
  localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
};

function Navbar() {
  const [themeTone, setThemeTone] = useState(0);
  const [a11y, setA11y] = useState({
    highContrast: false,
    reducedMotion: false,
    textScaleIndex: 1,
    themeTone: null,
  });
  const [ttsSupported, setTtsSupported] = useState(false);
  const [ttsStatus, setTtsStatus] = useState('Idle');
  const [ttsSpeaking, setTtsSpeaking] = useState(false);

  useEffect(() => {
    const preferredTone = getInitialThemeTone();
    const a11yPrefs = getAccessibilityPreferences();
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    setThemeTone(preferredTone);
    const mergedPrefs = { ...a11yPrefs, themeTone: preferredTone };
    setA11y(mergedPrefs);
    setTtsSupported(supported);
    applyThemeTone(preferredTone);
    applyAccessibilityPreferences(mergedPrefs);
  }, []);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const toggleA11yPreference = (key) => {
    setA11y((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      applyAccessibilityPreferences(next);
      return next;
    });
  };

  const handleThemeToneChange = (event) => {
    const nextTone = clampNumber(Number(event.target.value), 0, 100);
    setThemeTone(nextTone);
    const normalizedTone = applyThemeTone(nextTone);
    setA11y((prev) => {
      const next = { ...prev, themeTone: normalizedTone };
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleTextScaleChange = (event) => {
    const nextIndex = clampNumber(Number(event.target.value), 0, TEXT_SCALE_OPTIONS.length - 1);
    setA11y((prev) => {
      const next = { ...prev, textScaleIndex: nextIndex };
      applyAccessibilityPreferences(next);
      return next;
    });
  };

  const stopTts = () => {
    if (!ttsSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    setTtsSpeaking(false);
    setTtsStatus('Stopped');
  };

  const speakText = (text, label) => {
    if (!ttsSupported) {
      setTtsStatus('Text-to-speech is not supported in this browser.');
      return;
    }

    const cleaned = String(text || '').trim();
    if (!cleaned) {
      setTtsStatus(`No ${label.toLowerCase()} text to read.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(cleaned);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setTtsSpeaking(true);
      setTtsStatus(`Reading ${label.toLowerCase()}...`);
    };
    utterance.onend = () => {
      setTtsSpeaking(false);
      setTtsStatus('Finished');
    };
    utterance.onerror = () => {
      setTtsSpeaking(false);
      setTtsStatus('Could not read text.');
    };
    window.speechSynthesis.speak(utterance);
  };

  const readSelection = () => {
    const selected = window.getSelection ? window.getSelection().toString() : '';
    speakText(selected, 'Selection');
  };

  const readWholePage = () => {
    const main = document.querySelector('#main-content');
    const text = main?.innerText || document.body?.innerText || '';
    speakText(text, 'Page');
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className="navbar navbar-expand-lg theme-navbar shadow-sm" aria-label="Primary">
        <div className="container">
        <div className="d-flex w-100 align-items-center justify-content-between">
          <span className="navbar-brand fw-semibold">MD TechActive</span>
          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
            <div className="dropdown theme-accessibility">
              <button
                className="btn btn-sm theme-toggle-btn theme-accessibility-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="Accessibility options"
              >
                Accessibility
              </button>
              <div className="dropdown-menu dropdown-menu-end p-3 accessibility-menu">
                <p className="small fw-semibold mb-2">Accessibility Support</p>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="theme-tone">Theme Tone</label>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small">Light</span>
                    <input
                      id="theme-tone"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={themeTone}
                      onChange={handleThemeToneChange}
                      className="form-range theme-range"
                      aria-label="Theme tone"
                    />
                    <span className="small">Dark</span>
                  </div>
                </div>
                <div className="form-check form-switch mb-2">
                  <input
                    id="a11y-contrast"
                    className="form-check-input"
                    type="checkbox"
                    checked={a11y.highContrast}
                    onChange={() => toggleA11yPreference('highContrast')}
                  />
                  <label className="form-check-label" htmlFor="a11y-contrast">High Contrast</label>
                </div>
                <div className="form-check form-switch mb-2">
                  <input
                    id="a11y-motion"
                    className="form-check-input"
                    type="checkbox"
                    checked={a11y.reducedMotion}
                    onChange={() => toggleA11yPreference('reducedMotion')}
                  />
                  <label className="form-check-label" htmlFor="a11y-motion">Reduce Motion</label>
                </div>
                <div className="mb-2">
                  <label className="form-label small fw-semibold" htmlFor="a11y-text">Text Size</label>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small">A</span>
                    <input
                      id="a11y-text"
                      type="range"
                      min="0"
                      max={TEXT_SCALE_OPTIONS.length - 1}
                      step="1"
                      value={a11y.textScaleIndex}
                      onChange={handleTextScaleChange}
                      className="form-range theme-range"
                      aria-label="Text size"
                    />
                    <span className="small">A+</span>
                  </div>
                  <p className="small mb-0 text-secondary">
                    {TEXT_SCALE_OPTIONS[a11y.textScaleIndex]?.label}
                  </p>
                </div>
                <hr className="my-3" />
                <p className="small fw-semibold mb-2">Text To Speech</p>
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={readSelection}
                    disabled={!ttsSupported}
                  >
                    Read Selected Text
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={readWholePage}
                    disabled={!ttsSupported}
                  >
                    Read Whole Page
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={stopTts}
                    disabled={!ttsSupported || !ttsSpeaking}
                  >
                    Stop Reading
                  </button>
                  <p className="small mb-0 a11y-tts-status" role="status" aria-live="polite">
                    {ttsSupported ? `TTS: ${ttsStatus}` : 'TTS: Not supported in this browser'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
