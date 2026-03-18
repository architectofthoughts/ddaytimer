import type { Theme } from '../types';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  showInstall: boolean;
  onInstall: () => void;
  onAddNew: () => void;
}

export default function Header({ theme, onToggleTheme, showInstall, onInstall, onAddNew }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-logo">
          <span className="logo-icon">&#x23F3;</span>
          D-Day Timer
        </h1>
      </div>
      <div className="header-right">
        {showInstall && (
          <button className="btn-install" onClick={onInstall}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M5 19h14" />
            </svg>
            <span>설치</span>
          </button>
        )}
        <button className="btn-add" onClick={onAddNew}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New</span>
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
