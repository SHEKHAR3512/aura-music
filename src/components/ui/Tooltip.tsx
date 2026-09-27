import React, { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  side?: TooltipSide;
  sideOffset?: number;
  delay?: number;
  disabled?: boolean;
  className?: string;
  children: React.ReactElement;
}

interface TooltipCoords {
  x: number;
  y: number;
  side: TooltipSide;
  arrowX?: number;
  arrowY?: number;
}

// Global warm state tracking for instant hover switching between nearby buttons (like Radix / macOS)
let lastTooltipClosedAt = 0;
const WARM_THRESHOLD_MS = 350;

/**
 * Standalone Tooltip wrapper for explicit JSX usage
 */
export function Tooltip({
  content,
  shortcut,
  side = 'top',
  sideOffset = 8,
  delay = 180,
  disabled = false,
  className = '',
  children,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const tooltipId = useId();

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const calculatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 140; // reasonable estimate before DOM mount
    const tooltipHeight = 36;
    const padding = 10;

    let targetSide = side;
    let x = rect.left + rect.width / 2;
    let y = rect.top;

    // Flip side if clipping viewport boundaries
    if (targetSide === 'top' && rect.top - tooltipHeight - sideOffset < padding) {
      targetSide = 'bottom';
    } else if (targetSide === 'bottom' && rect.bottom + tooltipHeight + sideOffset > window.innerHeight - padding) {
      targetSide = 'top';
    }

    if (targetSide === 'top') {
      y = rect.top - sideOffset;
    } else if (targetSide === 'bottom') {
      y = rect.bottom + sideOffset;
    } else if (targetSide === 'left') {
      x = rect.left - sideOffset;
      y = rect.top + rect.height / 2;
    } else if (targetSide === 'right') {
      x = rect.right + sideOffset;
      y = rect.top + rect.height / 2;
    }

    setCoords({
      x,
      y,
      side: targetSide,
    });
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'touch') return;
    clearTimer();

    const element = e.currentTarget as HTMLElement;
    triggerRef.current = element;

    const isWarm = Date.now() - lastTooltipClosedAt < WARM_THRESHOLD_MS;
    const actualDelay = isWarm ? 0 : delay;

    timerRef.current = window.setTimeout(() => {
      calculatePosition(element);
      setIsOpen(true);
    }, actualDelay);
  };

  const handlePointerLeave = () => {
    clearTimer();
    if (isOpen) {
      lastTooltipClosedAt = Date.now();
      setIsOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const child = React.Children.only(children) as React.ReactElement<any>;

  return (
    <>
      {React.cloneElement(child, {
        onPointerEnter: (e: React.PointerEvent) => {
          child.props?.onPointerEnter?.(e);
          handlePointerEnter(e);
        },
        onPointerLeave: (e: React.PointerEvent) => {
          child.props?.onPointerLeave?.(e);
          handlePointerLeave();
        },
        onPointerDown: (e: React.PointerEvent) => {
          child.props?.onPointerDown?.(e);
          handlePointerLeave();
        },
        'aria-describedby': isOpen ? tooltipId : undefined,
      })}

      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          className="fixed pointer-events-none z-[99999] select-none"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform:
              coords.side === 'top'
                ? 'translate(-50%, -100%)'
                : coords.side === 'bottom'
                ? 'translate(-50%, 0)'
                : coords.side === 'left'
                ? 'translate(-100%, -50%)'
                : 'translate(0, -50%)',
          }}
        >
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0e18]/95 border border-white/15 text-slate-100 text-xs font-medium backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.85),0_0_16px_rgba(99,102,241,0.22)] animate-tooltip ${className}`}
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 text-slate-300 border border-white/10 tracking-wider">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/**
 * Global Tooltip Provider:
 * Automatically converts all browser-native title="..." popups across the whole app
 * into beautiful Aura-themed custom tooltips, while suppressing the ugly OS default popup!
 */
export function GlobalTooltipProvider() {
  const [activeTooltip, setActiveTooltip] = useState<{
    text: string;
    shortcut?: string;
    side: TooltipSide;
    x: number;
    y: number;
    arrowLeftPercent: number;
  } | null>(null);

  const timerRef = useRef<number | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  const hideTooltip = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (currentTargetRef.current) {
      currentTargetRef.current = null;
    }
    setActiveTooltip(prev => {
      if (prev) {
        lastTooltipClosedAt = Date.now();
      }
      return null;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePointerOver = (e: PointerEvent) => {
      // Ignore touch events so mobile taps don't leave sticky tooltips
      if (e.pointerType === 'touch') return;

      const target = e.target as HTMLElement | null;
      if (!target || !(target instanceof HTMLElement)) return;

      // Find nearest ancestor with title or data-tooltip
      const interactiveEl = target.closest<HTMLElement>('[data-tooltip], [title]');
      if (!interactiveEl) return;

      // If it has title, strip title so browser native tooltip NEVER appears
      const nativeTitle = interactiveEl.getAttribute('title');
      if (nativeTitle && nativeTitle.trim()) {
        const cleanTitle = nativeTitle.trim();
        // Preserve accessibility via aria-label if not already present
        if (!interactiveEl.getAttribute('aria-label')) {
          interactiveEl.setAttribute('aria-label', cleanTitle);
        }
        interactiveEl.setAttribute('data-tooltip', cleanTitle);
        interactiveEl.removeAttribute('title');
      }

      const tooltipText = interactiveEl.getAttribute('data-tooltip');
      if (!tooltipText || !tooltipText.trim()) return;

      // If we are already displaying tooltip for this element, don't restart
      if (currentTargetRef.current === interactiveEl && activeTooltip) return;

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      currentTargetRef.current = interactiveEl;

      const shortcut = interactiveEl.getAttribute('data-tooltip-shortcut') || undefined;
      const explicitSide = (interactiveEl.getAttribute('data-tooltip-side') as TooltipSide) || 'top';

      const isWarm = Date.now() - lastTooltipClosedAt < WARM_THRESHOLD_MS;
      const delay = isWarm ? 0 : 200;

      timerRef.current = window.setTimeout(() => {
        if (!currentTargetRef.current || !currentTargetRef.current.isConnected) {
          hideTooltip();
          return;
        }

        const rect = currentTargetRef.current.getBoundingClientRect();
        // If element is truly unrendered (except in test jsdom environment)
        const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
        if (!isJsdom && rect.width === 0 && rect.height === 0 && currentTargetRef.current.offsetParent === null) {
          hideTooltip();
          return;
        }

        const padding = 12;
        let chosenSide: TooltipSide = explicitSide;

        // Auto flip top/bottom depending on vertical screen space
        if (chosenSide === 'top' && rect.top < 44) {
          chosenSide = 'bottom';
        } else if (chosenSide === 'bottom' && rect.bottom > window.innerHeight - 44) {
          chosenSide = 'top';
        }

        const targetCenterX = rect.left + rect.width / 2;
        const clampedCenterX = Math.max(70, Math.min(window.innerWidth - 70, targetCenterX));
        const arrowOffset = targetCenterX - clampedCenterX;
        const arrowLeftPercent = 50 + (arrowOffset / 140) * 50; // Dynamic arrow centering

        let y = 0;
        if (chosenSide === 'top') {
          y = rect.top - 8;
        } else if (chosenSide === 'bottom') {
          y = rect.bottom + 8;
        } else if (chosenSide === 'left') {
          y = rect.top + rect.height / 2;
        } else if (chosenSide === 'right') {
          y = rect.top + rect.height / 2;
        }

        setActiveTooltip({
          text: tooltipText,
          shortcut,
          side: chosenSide,
          x: clampedCenterX,
          y,
          arrowLeftPercent: Math.max(15, Math.min(85, arrowLeftPercent)),
        });
      }, delay);
    };

    const handlePointerOut = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const related = e.relatedTarget as HTMLElement | null;
      // If moving within the same interactive element, don't hide
      if (currentTargetRef.current && related && currentTargetRef.current.contains(related)) {
        return;
      }

      hideTooltip();
    };

    const handleDismissEvents = () => {
      hideTooltip();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideTooltip();
      }
    };

    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    document.addEventListener('pointerdown', handleDismissEvents, { passive: true });
    document.addEventListener('scroll', handleDismissEvents, { passive: true, capture: true });
    window.addEventListener('blur', handleDismissEvents);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('pointerdown', handleDismissEvents);
      document.removeEventListener('scroll', handleDismissEvents, true);
      window.removeEventListener('blur', handleDismissEvents);
      document.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [activeTooltip]);

  if (!activeTooltip || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="tooltip"
      aria-hidden="true"
      className="fixed pointer-events-none z-[99999] select-none"
      style={{
        left: `${activeTooltip.x}px`,
        top: `${activeTooltip.y}px`,
        transform:
          activeTooltip.side === 'top'
            ? 'translate(-50%, -100%)'
            : activeTooltip.side === 'bottom'
            ? 'translate(-50%, 0)'
            : activeTooltip.side === 'left'
            ? 'translate(-100%, -50%)'
            : 'translate(0, -50%)',
      }}
    >
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0e18]/95 border border-white/15 text-slate-100 text-xs font-medium backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.85),0_0_16px_rgba(99,102,241,0.22)] animate-tooltip max-w-xs text-center">
          <span className="leading-snug">{activeTooltip.text}</span>
          {activeTooltip.shortcut && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 text-slate-300 border border-white/10 tracking-wider">
              {activeTooltip.shortcut}
            </kbd>
          )}
        </div>

        {/* Pointer Arrow Notch */}
        {activeTooltip.side === 'top' && (
          <div
            className="absolute -bottom-1 w-2 h-2 bg-[#0c0e18] border-r border-b border-white/15 rotate-45 -translate-x-1/2"
            style={{ left: `${activeTooltip.arrowLeftPercent}%` }}
          />
        )}
        {activeTooltip.side === 'bottom' && (
          <div
            className="absolute -top-1 w-2 h-2 bg-[#0c0e18] border-l border-t border-white/15 rotate-45 -translate-x-1/2"
            style={{ left: `${activeTooltip.arrowLeftPercent}%` }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
