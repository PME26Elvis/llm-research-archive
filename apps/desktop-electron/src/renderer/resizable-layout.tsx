import React, { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  adjustSidebarWidth,
  loadLayoutPreferences,
  saveLayoutPreferences,
  type LayoutPreferences,
} from './layout-preferences';

const initialPreferences = loadLayoutPreferences(window.localStorage);

interface ResizableLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function ResizableLayout({ sidebar, children }: ResizableLayoutProps) {
  const [preferences, setPreferences] = useState<LayoutPreferences>(initialPreferences);
  const dragStartRef = useRef<{ x: number; width: number } | null>(null);

  function commit(next: LayoutPreferences) {
    const saved = saveLayoutPreferences(window.localStorage, next);
    setPreferences(saved);
  }

  function setWidth(width: number) {
    commit({ ...preferences, sidebarWidth: width, sidebarCollapsed: false });
  }

  function toggleSidebar() {
    commit({ ...preferences, sidebarCollapsed: !preferences.sidebarCollapsed });
  }

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      setWidth(start.width + event.clientX - start.x);
    };
    const onPointerUp = () => {
      dragStartRef.current = null;
      document.body.classList.remove('resizing-sidebar');
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.body.classList.remove('resizing-sidebar');
    };
  }, [preferences]);

  const style = {
    '--sidebar-width': preferences.sidebarCollapsed ? '0px' : `${preferences.sidebarWidth}px`,
  } as CSSProperties;

  return (
    <main
      className="app"
      style={style}
      data-testid="app-ready"
      data-sidebar-collapsed={preferences.sidebarCollapsed}
      data-sidebar-width={preferences.sidebarWidth}
    >
      <aside hidden={preferences.sidebarCollapsed} data-testid="navigation-pane">
        {sidebar}
      </aside>
      {!preferences.sidebarCollapsed && (
        <div
          className="pane-separator"
          role="separator"
          aria-label="調整導覽欄寬度"
          aria-orientation="vertical"
          aria-valuemin={MIN_SIDEBAR_WIDTH}
          aria-valuemax={MAX_SIDEBAR_WIDTH}
          aria-valuenow={preferences.sidebarWidth}
          tabIndex={0}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragStartRef.current = { x: event.clientX, width: preferences.sidebarWidth };
            document.body.classList.add('resizing-sidebar');
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              setWidth(adjustSidebarWidth(preferences.sidebarWidth, -20));
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              setWidth(adjustSidebarWidth(preferences.sidebarWidth, 20));
            } else if (event.key === 'Home') {
              event.preventDefault();
              setWidth(MIN_SIDEBAR_WIDTH);
            } else if (event.key === 'End') {
              event.preventDefault();
              setWidth(MAX_SIDEBAR_WIDTH);
            }
          }}
        />
      )}
      <section className="reader-pane">
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={preferences.sidebarCollapsed ? '顯示導覽欄' : '隱藏導覽欄'}
          aria-expanded={!preferences.sidebarCollapsed}
          onClick={toggleSidebar}
        >
          {preferences.sidebarCollapsed ? '顯示導覽欄' : '隱藏導覽欄'}
        </button>
        {children}
      </section>
    </main>
  );
}
