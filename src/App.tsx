import { useState, useEffect, useEffectEvent, startTransition } from 'react';
import type { DDay, ArchivedDDay, EmotionLog } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { useSync } from './hooks/useSync';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { decodeShareUrl } from './utils/share';
import Header from './components/Header';
import DDayCard from './components/DDayCard';
import DDayForm from './components/DDayForm';
import QuoteDisplay from './components/QuoteDisplay';
import EmptyState from './components/EmptyState';
import KanbanBoard from './components/KanbanBoard';
import HistoryTimeline from './components/HistoryTimeline';
import MissionControl from './components/MissionControl';
import './App.css';

type View = 'dday' | 'kanban' | 'history' | 'mission';

export default function App() {
  const { status: syncStatus } = useSync();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useLocalStorage<View>('app-view', 'mission');
  const [ddays, setDdays] = useLocalStorage<DDay[]>('dday-list', []);
  const [selectedId, setSelectedId] = useLocalStorage<string | null>('dday-selected', null);
  const [archivedDdays, setArchivedDdays] = useLocalStorage<ArchivedDDay[]>('dday-archive', []);
  const [showForm, setShowForm] = useState(false);
  const [sharedData, setSharedData] = useState<Partial<DDay> | null>(null);

  const navigateTo = (nextView: View) => {
    startTransition(() => {
      setView(nextView);
    });
  };

  const applySharedLink = useEffectEvent((shared: Partial<DDay>) => {
    setSharedData(shared);
    setShowForm(true);
    navigateTo('dday');
    window.history.replaceState({}, '', window.location.pathname);
  });

  useEffect(() => {
    const shared = decodeShareUrl();
    if (shared) {
      applySharedLink(shared);
    }
  }, [setView]);

  useEffect(() => {
    if (ddays.length > 0 && !ddays.find(d => d.id === selectedId)) {
      setSelectedId(ddays[0].id);
    }
  }, [ddays, selectedId, setSelectedId]);

  const handleAdd = (dday: DDay) => {
    setDdays(prev => [dday, ...prev]);
    setSelectedId(dday.id);
    setShowForm(false);
    setSharedData(null);
    navigateTo('dday');
  };

  const handleDelete = (id: string) => {
    setDdays(prev => prev.filter(d => d.id !== id));
    if (selectedId === id) {
      const remaining = ddays.filter(d => d.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
    // Clean up emotion log
    const raw = localStorage.getItem('emotion-log');
    if (raw) {
      try {
        const log: EmotionLog = JSON.parse(raw);
        delete log[id];
        localStorage.setItem('emotion-log', JSON.stringify(log));
        window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key: 'emotion-log' } }));
      } catch { /* skip */ }
    }
  };

  const handleArchive = (id: string) => {
    const dday = ddays.find(d => d.id === id);
    if (!dday) return;

    const archived: ArchivedDDay = {
      ...dday,
      archivedAt: new Date().toISOString(),
      completedAt: dday.targetDate,
      totalDurationMs: new Date(dday.targetDate).getTime() - new Date(dday.startDate).getTime(),
    };

    setArchivedDdays(prev => [archived, ...prev]);
    handleDelete(id);
  };

  const handleRestoreFromArchive = (id: string) => {
    const item = archivedDdays.find(a => a.id === id);
    if (!item) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { archivedAt, completedAt, totalDurationMs, ...dday } = item;
    setDdays(prev => [dday, ...prev]);
    setArchivedDdays(prev => prev.filter(a => a.id !== id));
    setSelectedId(id);
    navigateTo('dday');
  };

  const handlePermanentDelete = (id: string) => {
    if (!window.confirm('정말 영구적으로 삭제하시겠습니까?')) return;
    setArchivedDdays(prev => prev.filter(a => a.id !== id));
  };

  const selectedDday = ddays.find(d => d.id === selectedId);

  return (
    <div className="app" data-theme={theme}>
      <div className="bg-gradient" />
      <div className="bg-noise" />

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        showInstall={canInstall}
        onInstall={() => { void promptInstall(); }}
        onAddNew={() => {
          navigateTo('dday');
          setShowForm(true);
        }}
      />

      {/* Sync indicator */}
      <div className={`sync-indicator ${syncStatus}`}>
        {syncStatus === 'syncing' && (
          <><span className="sync-spinner" /> 동기화 중...</>
        )}
        {syncStatus === 'offline' && (
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15a8 8 0 0116 0" /><path d="M12 19h.01" /></svg> 오프라인 모드</>
        )}
        {syncStatus === 'pending' && (
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></svg> 오프라인 변경 사항 대기 중</>
        )}
        {syncStatus === 'synced' && (
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg> 동기화 완료</>
        )}
        {syncStatus === 'error' && (
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg> 동기화 실패</>
        )}
      </div>

      {/* Tab Navigation */}
      <nav className="tab-bar">
        <button
          className={`tab ${view === 'mission' ? 'active' : ''}`}
          onClick={() => navigateTo('mission')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 18L10 12l4 4 6-8" />
            <path d="M3 20h18" />
          </svg>
          미션 컨트롤
        </button>
        <button
          className={`tab ${view === 'kanban' ? 'active' : ''}`}
          onClick={() => navigateTo('kanban')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="18" rx="2" />
            <rect x="14" y="3" width="7" height="10" rx="2" />
          </svg>
          연휴 플래너
        </button>
        <button
          className={`tab ${view === 'dday' ? 'active' : ''}`}
          onClick={() => navigateTo('dday')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          D-Day
        </button>
        <button
          className={`tab ${view === 'history' ? 'active' : ''}`}
          onClick={() => navigateTo('history')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="5" rx="1" />
            <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8" />
            <path d="M10 12h4" />
          </svg>
          히스토리
        </button>
      </nav>

      <main className="app-main">
        {view === 'mission' ? (
          <MissionControl
            ddays={ddays}
            archivedDdays={archivedDdays}
            selectedId={selectedId}
            onFocusDDay={(id) => {
              setSelectedId(id);
              navigateTo('dday');
            }}
            onCreateDDay={() => {
              navigateTo('dday');
              setShowForm(true);
            }}
          />
        ) : view === 'kanban' ? (
          <KanbanBoard />
        ) : view === 'history' ? (
          <HistoryTimeline
            items={archivedDdays}
            onRestore={handleRestoreFromArchive}
            onPermanentDelete={handlePermanentDelete}
          />
        ) : (
          <>
            {ddays.length === 0 && !showForm ? (
              <EmptyState onAdd={() => setShowForm(true)} />
            ) : (
              <div className="app-layout">
                {ddays.length > 1 && (
                  <aside className="sidebar">
                    <h3 className="sidebar-title">My D-Days</h3>
                    <div className="sidebar-list">
                      {ddays.map(d => (
                        <DDayCard
                          key={d.id}
                          dday={d}
                          isSelected={false}
                          onSelect={() => setSelectedId(d.id)}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </aside>
                )}

                <div className="main-content">
                  {selectedDday && (
                    <DDayCard
                      key={selectedDday.id}
                      dday={selectedDday}
                      isSelected={true}
                      onSelect={() => {}}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                    />
                  )}
                  <QuoteDisplay />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showForm && (
        <DDayForm
          onAdd={handleAdd}
          onClose={() => {
            setShowForm(false);
            setSharedData(null);
          }}
          initialData={sharedData || undefined}
        />
      )}
    </div>
  );
}
