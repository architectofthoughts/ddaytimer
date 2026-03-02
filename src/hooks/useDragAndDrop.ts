import { useState, useRef, useCallback, useEffect } from 'react';

interface DragItem {
  taskId: string;
  sourceDate: string;
  sourceIndex: number;
  text: string;
}

interface DropTarget {
  date: string;
  index: number;
}

interface DragState {
  item: DragItem | null;
  pointerX: number;
  pointerY: number;
  dropTarget: DropTarget | null;
  active: boolean;
}

interface UseDragAndDropOptions {
  onMove: (
    sourceDate: string,
    sourceIndex: number,
    targetDate: string,
    targetIndex: number
  ) => void;
}

const DRAG_THRESHOLD = 5;
const LONGPRESS_MS = 150;
const AUTO_SCROLL_ZONE = 40;
const AUTO_SCROLL_SPEED = 8;

export function useDragAndDrop({ onMove }: UseDragAndDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    item: null,
    pointerX: 0,
    pointerY: 0,
    dropTarget: null,
    active: false,
  });

  const pendingRef = useRef<{
    taskId: string;
    sourceDate: string;
    sourceIndex: number;
    text: string;
    startX: number;
    startY: number;
    pointerId: number;
    longPressTimer?: ReturnType<typeof setTimeout>;
    isTouch: boolean;
  } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animFrameRef = useRef<number>(0);

  const setColumnRef = useCallback((date: string, el: HTMLDivElement | null) => {
    if (el) {
      columnRefs.current.set(date, el);
    } else {
      columnRefs.current.delete(date);
    }
  }, []);

  const findDropTarget = useCallback((x: number, y: number): DropTarget | null => {
    for (const [date, colEl] of columnRefs.current.entries()) {
      const colRect = colEl.getBoundingClientRect();
      if (x >= colRect.left && x <= colRect.right) {
        // Find task containers
        const taskEls = colEl.querySelectorAll('.kanban-task');
        let insertIndex = 0;

        for (let i = 0; i < taskEls.length; i++) {
          const taskRect = taskEls[i].getBoundingClientRect();
          const midY = taskRect.top + taskRect.height / 2;
          if (y > midY) {
            insertIndex = i + 1;
          }
        }

        return { date, index: insertIndex };
      }
    }
    return null;
  }, []);

  const autoScroll = useCallback((x: number) => {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    if (x < rect.left + AUTO_SCROLL_ZONE) {
      board.scrollLeft -= AUTO_SCROLL_SPEED;
    } else if (x > rect.right - AUTO_SCROLL_ZONE) {
      board.scrollLeft += AUTO_SCROLL_SPEED;
    }
  }, []);

  const handlePointerDown = useCallback((
    e: React.PointerEvent,
    taskId: string,
    sourceDate: string,
    sourceIndex: number,
    text: string,
  ) => {
    // Ignore button clicks
    if ((e.target as HTMLElement).closest('button')) return;

    const isTouch = e.pointerType === 'touch';

    pendingRef.current = {
      taskId,
      sourceDate,
      sourceIndex,
      text,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      isTouch,
    };

    if (isTouch) {
      // Long press for touch
      pendingRef.current.longPressTimer = setTimeout(() => {
        if (pendingRef.current) {
          (e.target as HTMLElement).setPointerCapture(pendingRef.current.pointerId);
          setDragState({
            item: { taskId, sourceDate, sourceIndex, text },
            pointerX: e.clientX,
            pointerY: e.clientY,
            dropTarget: null,
            active: true,
          });
        }
      }, LONGPRESS_MS);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const pending = pendingRef.current;

    if (pending && !dragState.active) {
      const dx = e.clientX - pending.startX;
      const dy = e.clientY - pending.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!pending.isTouch && dist > DRAG_THRESHOLD) {
        // Mouse: start drag after threshold
        if (pending.longPressTimer) clearTimeout(pending.longPressTimer);
        (e.target as HTMLElement).setPointerCapture(pending.pointerId);
        setDragState({
          item: { taskId: pending.taskId, sourceDate: pending.sourceDate, sourceIndex: pending.sourceIndex, text: pending.text },
          pointerX: e.clientX,
          pointerY: e.clientY,
          dropTarget: null,
          active: true,
        });
      } else if (pending.isTouch && dist > DRAG_THRESHOLD) {
        // Touch moved before long press — cancel
        if (pending.longPressTimer) clearTimeout(pending.longPressTimer);
        pendingRef.current = null;
      }
      return;
    }

    if (dragState.active) {
      const target = findDropTarget(e.clientX, e.clientY);
      autoScroll(e.clientX);
      setDragState(prev => ({
        ...prev,
        pointerX: e.clientX,
        pointerY: e.clientY,
        dropTarget: target,
      }));
    }
  }, [dragState.active, findDropTarget, autoScroll]);

  const handlePointerUp = useCallback(() => {
    if (pendingRef.current?.longPressTimer) {
      clearTimeout(pendingRef.current.longPressTimer);
    }
    pendingRef.current = null;

    if (dragState.active && dragState.item && dragState.dropTarget) {
      const { sourceDate, sourceIndex } = dragState.item;
      const { date: targetDate, index: targetIndex } = dragState.dropTarget;

      // Only move if actually changed
      if (sourceDate !== targetDate || sourceIndex !== targetIndex) {
        onMove(sourceDate, sourceIndex, targetDate, targetIndex);
      }
    }

    setDragState({
      item: null,
      pointerX: 0,
      pointerY: 0,
      dropTarget: null,
      active: false,
    });
  }, [dragState, onMove]);

  // Clean up animation frame
  useEffect(() => {
    const ref = animFrameRef;
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, []);

  return {
    dragState,
    boardRef,
    setColumnRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
