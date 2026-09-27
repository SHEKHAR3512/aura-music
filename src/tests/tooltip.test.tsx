import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip, GlobalTooltipProvider } from '../components/ui/Tooltip';

describe('Aura Custom Tooltip System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('1. Explicit <Tooltip> Component', () => {
    it('renders child normally and shows custom Aura tooltip on hover after delay', () => {
      render(
        <Tooltip content="Shuffle Playlist" shortcut="Ctrl+S" side="top">
          <button data-testid="shuffle-btn">Shuffle</button>
        </Tooltip>
      );

      const btn = screen.getByTestId('shuffle-btn');
      expect(btn).toBeInTheDocument();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Hover over button
      fireEvent.pointerEnter(btn, { pointerType: 'mouse' });

      // Before delay (180ms default)
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // After delay
      act(() => {
        vi.advanceTimersByTime(100);
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Shuffle Playlist');
      expect(tooltip).toHaveTextContent('Ctrl+S');

      // Leave button
      fireEvent.pointerLeave(btn);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('does not display tooltip for touch interactions to avoid sticky popups on mobile', () => {
      render(
        <Tooltip content="Mobile Test">
          <button data-testid="touch-btn">Touch Me</button>
        </Tooltip>
      );

      const btn = screen.getByTestId('touch-btn');
      fireEvent.pointerEnter(btn, { pointerType: 'touch' });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('2. GlobalTooltipProvider (Universal native title suppression)', () => {
    it('suppresses native browser title attribute and displays custom Aura tooltip on hover', () => {
      render(
        <>
          <GlobalTooltipProvider />
          <button data-testid="gemini-sparkles" title="More Like This (Related Songs & Same Genre)">
            ✨ Gemini
          </button>
        </>
      );

      const btn = screen.getByTestId('gemini-sparkles');
      expect(btn.getAttribute('title')).toBe('More Like This (Related Songs & Same Genre)');

      // Hover over button
      fireEvent.pointerOver(btn, { pointerType: 'mouse' });

      // Title attribute must be stripped to prevent native OS popup!
      expect(btn.getAttribute('title')).toBeNull();
      // Accessibility preserved via data-tooltip and aria-label
      expect(btn.getAttribute('data-tooltip')).toBe('More Like This (Related Songs & Same Genre)');
      expect(btn.getAttribute('aria-label')).toBe('More Like This (Related Songs & Same Genre)');

      // Advance past debounce
      act(() => {
        vi.advanceTimersByTime(250);
      });

      const tooltip = screen.getByRole('tooltip', { hidden: true });
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('More Like This (Related Songs & Same Genre)');

      // Move mouse away
      fireEvent.pointerOut(btn);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('dismisses tooltip immediately when user clicks or presses Escape', () => {
      render(
        <>
          <GlobalTooltipProvider />
          <button data-testid="action-btn" data-tooltip="Quick Action" data-tooltip-shortcut="⌘K">
            Action
          </button>
        </>
      );

      const btn = screen.getByTestId('action-btn');
      fireEvent.pointerOver(btn, { pointerType: 'mouse' });

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();

      // Escape key dismisses
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});
