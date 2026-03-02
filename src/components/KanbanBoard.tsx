import { useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { v4 as uuidv4 } from 'uuid';

interface KanbanTask {
  id: string;
  text: string;
  completed: boolean;
}

type KanbanData = Record<string, KanbanTask[]>;

interface DateRange {
  start: string;
  end: string;
}

function generateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(dateStr: string): { month: number; day: number; weekday: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  return { month: date.getMonth() + 1, day: date.getDate(), weekday };
}

function isToday(dateStr: string): boolean {
  return todayStr() === dateStr;
}

function isPast(dateStr: string): boolean {
  return dateStr < todayStr();
}

export default function KanbanBoard() {
  const [dateRange, setDateRange] = useLocalStorage<DateRange | null>('kanban-range', null);
  const [data, setData] = useLocalStorage<KanbanData>('kanban-data', {});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [editingRange, setEditingRange] = useState(false);
  const [tempStart, setTempStart] = useState('');
  const [tempEnd, setTempEnd] = useState('');

  const dates = dateRange ? generateDates(dateRange.start, dateRange.end) : [];

  const handleMoveTask = useCallback((
    sourceDate: string,
    sourceIndex: number,
    targetDate: string,
    targetIndex: number,
  ) => {
    setData(prev => {
      const sourceTasks = [...(prev[sourceDate] || [])];
      const [moved] = sourceTasks.splice(sourceIndex, 1);
      if (!moved) return prev;

      if (sourceDate === targetDate) {
        // Same column reorder
        const adjustedIndex = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
        sourceTasks.splice(adjustedIndex, 0, moved);
        return { ...prev, [sourceDate]: sourceTasks };
      }

      // Cross-column move
      const targetTasks = [...(prev[targetDate] || [])];
      targetTasks.splice(targetIndex, 0, moved);
      return { ...prev, [sourceDate]: sourceTasks, [targetDate]: targetTasks };
    });
  }, [setData]);

  const {
    dragState,
    boardRef,
    setColumnRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDragAndDrop({ onMove: handleMoveTask });

  const openRangeEditor = () => {
    setTempStart(dateRange?.start || todayStr());
    setTempEnd(dateRange?.end || todayStr());
    setEditingRange(true);
  };

  const saveRange = () => {
    if (tempStart && tempEnd && tempStart <= tempEnd) {
      setDateRange({ start: tempStart, end: tempEnd });
      setEditingRange(false);
    }
  };

  const addTask = (date: string) => {
    const text = inputs[date]?.trim();
    if (!text) return;
    setData(prev => ({
      ...prev,
      [date]: [...(prev[date] || []), { id: uuidv4(), text, completed: false }],
    }));
    setInputs(prev => ({ ...prev, [date]: '' }));
  };

  const toggleTask = (date: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      [date]: (prev[date] || []).map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const deleteTask = (date: string, taskId: string) => {
    setData(prev => ({
      ...prev,
      [date]: (prev[date] || []).filter(t => t.id !== taskId),
    }));
  };

  // No dates set — show setup screen
  if (!dateRange) {
    return (
      <div className="kanban">
        <div className="kanban-setup">
          <div className="kanban-setup-icon">&#x1F4C5;</div>
          <h2 className="kanban-setup-title">플래너 기간 설정</h2>
          <p className="kanban-setup-desc">플래너에 사용할 기간을 지정해주세요.</p>
          <div className="kanban-range-form">
            <div className="kanban-range-field">
              <label>시작일</label>
              <input
                type="date"
                value={tempStart || todayStr()}
                onChange={e => setTempStart(e.target.value)}
              />
            </div>
            <span className="kanban-range-arrow">&#x2192;</span>
            <div className="kanban-range-field">
              <label>종료일</label>
              <input
                type="date"
                value={tempEnd || todayStr()}
                onChange={e => setTempEnd(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn-primary kanban-setup-btn"
            onClick={() => {
              const s = tempStart || todayStr();
              const e = tempEnd || todayStr();
              if (s <= e) {
                setDateRange({ start: s, end: e });
              }
            }}
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  const allTasks = dates.flatMap(d => data[d] || []);
  const completedCount = allTasks.filter(t => t.completed).length;
  const totalCount = allTasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const todayIndex = dates.findIndex(isToday);
  const dayProgress = todayIndex >= 0
    ? Math.round(((todayIndex + 1) / dates.length) * 100)
    : isPast(dates[dates.length - 1]) ? 100 : 0;

  // For timeline, show all if <= 9 days, otherwise show key dates
  const showTimeline = dates.length <= 9;

  return (
    <div className="kanban">
      {/* Progress Header */}
      <div className="kanban-header-card">
        <div className="kanban-header-top">
          <h2 className="kanban-title">
            <span className="kanban-title-icon">&#x1F3D6;&#xFE0F;</span>
            연휴 플래너
          </h2>
          <div className="kanban-header-actions">
            {totalCount > 0 && (
              <span className="kanban-stats">{completedCount}/{totalCount}</span>
            )}
            <button className="kanban-edit-range" onClick={openRangeEditor} aria-label="기간 변경">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Date Range Edit Modal */}
        {editingRange && (
          <div className="kanban-range-inline">
            <div className="kanban-range-form">
              <div className="kanban-range-field">
                <label>시작일</label>
                <input type="date" value={tempStart} onChange={e => setTempStart(e.target.value)} />
              </div>
              <span className="kanban-range-arrow">&#x2192;</span>
              <div className="kanban-range-field">
                <label>종료일</label>
                <input type="date" value={tempEnd} onChange={e => setTempEnd(e.target.value)} />
              </div>
            </div>
            <div className="kanban-range-actions">
              <button className="btn-secondary" onClick={() => setEditingRange(false)}>취소</button>
              <button className="btn-primary" onClick={saveRange} disabled={!tempStart || !tempEnd || tempStart > tempEnd}>적용</button>
            </div>
          </div>
        )}

        {/* Timeline (for <= 9 days) */}
        {showTimeline && (
          <div className="kanban-timeline">
            {dates.map((date, i) => {
              const { day, weekday } = formatDate(date);
              const today = isToday(date);
              const past = isPast(date);
              const tasks = data[date] || [];
              const done = tasks.length > 0 && tasks.every(t => t.completed);
              return (
                <div key={date} className="timeline-step">
                  {i > 0 && <div className={`timeline-line ${past || today ? 'filled' : ''}`} />}
                  <div className={`timeline-node ${today ? 'today' : ''} ${past ? 'past' : ''} ${done ? 'done' : ''}`}>
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <span className="timeline-day">{day}</span>
                    )}
                  </div>
                  <span className={`timeline-label ${today ? 'today' : ''}`}>{weekday}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="kanban-progress">
            <div className="kanban-progress-track">
              <div className="kanban-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="kanban-progress-text">{progress}%</span>
          </div>
        )}

        {/* Day progress */}
        <div className="kanban-day-indicator">
          <span className="kanban-day-text">
            {todayIndex >= 0
              ? `${todayIndex + 1}일차 / ${dates.length}일`
              : isPast(dates[dates.length - 1])
                ? '기간 종료'
                : '시작 전'}
          </span>
          <div className="kanban-day-bar">
            <div className="kanban-day-bar-fill" style={{ width: `${dayProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div
        className={`kanban-board ${dragState.active ? 'dragging' : ''}`}
        ref={boardRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {dates.map(date => {
          const { month, day, weekday } = formatDate(date);
          const tasks = data[date] || [];
          const today = isToday(date);
          const past = isPast(date) && !today;
          const dayDone = tasks.length > 0 && tasks.every(t => t.completed);
          const isDragOver = dragState.dropTarget?.date === date;

          return (
            <div
              key={date}
              className={`kanban-col ${today ? 'today' : ''} ${past ? 'past' : ''} ${dayDone ? 'all-done' : ''} ${isDragOver ? 'drag-over' : ''}`}
            >
              <div className="kanban-col-header">
                <div className="kanban-col-date">
                  <span className="kanban-col-day">{month}/{day}</span>
                  <span className="kanban-col-weekday">{weekday}</span>
                </div>
                {today && <span className="kanban-col-badge">TODAY</span>}
                {tasks.length > 0 && (
                  <span className="kanban-col-count">
                    {tasks.filter(t => t.completed).length}/{tasks.length}
                  </span>
                )}
              </div>

              <div
                className="kanban-tasks"
                ref={(el) => setColumnRef(date, el)}
              >
                {tasks.map((task, taskIndex) => (
                  <div key={task.id}>
                    {/* Drop indicator */}
                    {isDragOver && dragState.dropTarget?.index === taskIndex && (
                      <div className="kanban-drop-indicator" />
                    )}
                    <div
                      className={`kanban-task ${task.completed ? 'done' : ''} ${dragState.item?.taskId === task.id ? 'dragging' : ''}`}
                      onPointerDown={(e) => handlePointerDown(e, task.id, date, taskIndex, task.text)}
                      style={{ touchAction: 'none' }}
                    >
                      <button
                        className="kanban-check"
                        onClick={() => toggleTask(date, task.id)}
                        aria-label={task.completed ? '완료 취소' : '완료'}
                      >
                        {task.completed ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="4" fill="var(--accent)" stroke="var(--accent)" />
                            <path d="M8 12l3 3 5-5" stroke="#fff" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="4" stroke="var(--border-color)" />
                          </svg>
                        )}
                      </button>
                      <span className="kanban-task-text">{task.text}</span>
                      <button
                        className="kanban-task-del"
                        onClick={() => deleteTask(date, task.id)}
                        aria-label="삭제"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {/* Drop indicator at end */}
                {isDragOver && dragState.dropTarget?.index === tasks.length && (
                  <div className="kanban-drop-indicator" />
                )}
              </div>

              <form
                className="kanban-add"
                onSubmit={e => { e.preventDefault(); addTask(date); }}
              >
                <input
                  type="text"
                  placeholder="+ 할 일 추가"
                  value={inputs[date] || ''}
                  onChange={e => setInputs(prev => ({ ...prev, [date]: e.target.value }))}
                />
                {(inputs[date] || '').trim() && (
                  <button type="submit" className="kanban-add-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                )}
              </form>
            </div>
          );
        })}
      </div>

      {/* Drag Overlay */}
      {dragState.active && dragState.item && (
        <div
          className="kanban-drag-overlay"
          style={{
            left: dragState.pointerX,
            top: dragState.pointerY,
          }}
        >
          {dragState.item.text}
        </div>
      )}
    </div>
  );
}
