import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useContext } from 'react';
import { DebugProvider, DebugContext } from '../debugContext';

const DEBUG_MODE_KEY = 'debug_mode';

// Test component that displays debug state and toggle
function DebugTestComponent() {
  const { isDebugMode, toggleDebugMode } = useContext(DebugContext);

  return (
    <div>
      <div data-testid="debug-mode">{isDebugMode ? 'true' : 'false'}</div>
      <button data-testid="toggle-btn" onClick={toggleDebugMode}>
        Toggle
      </button>
    </div>
  );
}

describe('DebugContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initialization', () => {
    it('initializes to false when localStorage is empty', () => {
      render(
        <DebugProvider>
          <DebugTestComponent />
        </DebugProvider>
      );

      expect(screen.getByTestId('debug-mode').textContent).toBe('false');
    });

    it('initializes to true when localStorage has "true"', () => {
      localStorage.setItem(DEBUG_MODE_KEY, 'true');

      render(
        <DebugProvider>
          <DebugTestComponent />
        </DebugProvider>
      );

      expect(screen.getByTestId('debug-mode').textContent).toBe('true');
    });

    it('initializes to false when localStorage has invalid value like "banana"', () => {
      localStorage.setItem(DEBUG_MODE_KEY, 'banana');

      render(
        <DebugProvider>
          <DebugTestComponent />
        </DebugProvider>
      );

      expect(screen.getByTestId('debug-mode').textContent).toBe('false');
    });

    it('initializes to false when localStorage has "false"', () => {
      localStorage.setItem(DEBUG_MODE_KEY, 'false');

      render(
        <DebugProvider>
          <DebugTestComponent />
        </DebugProvider>
      );

      expect(screen.getByTestId('debug-mode').textContent).toBe('false');
    });
  });

  describe('toggleDebugMode', () => {
    it('sets isDebugMode to true when toggling from false', () => {
      render(
        <DebugProvider>
          <DebugTestComponent />
        </DebugProvider>
      );

      expect(screen.getByTestId('debug-mode').textContent).toBe('false');

      act(() => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(screen.getByTestId('debug-mode').textContent).toBe('true');
    });

    it('sets localStorage to "true" when enabling debug mode', () => {
      render(
        <DebugProvider>
          <DebugTestComponent />
        </DebugProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(localStorage.getItem(DEBUG_MODE_KEY)).toBe('true');
    });

    it('sets isDebugMode to false when toggling from true', () => {
      localStorage.setItem(DEBUG_MODE_KEY, 'true');

      render(
        <DebugProvider>
          <DebugTestComponent />
        </DebugProvider>
      );

      expect(screen.getByTestId('debug-mode').textContent).toBe('true');

      act(() => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(screen.getByTestId('debug-mode').textContent).toBe('false');
    });

    it('removes localStorage key when disabling debug mode', () => {
      localStorage.setItem(DEBUG_MODE_KEY, 'true');

      render(
        <DebugProvider>
          <DebugTestComponent />
        </DebugProvider>
      );

      act(() => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(localStorage.getItem(DEBUG_MODE_KEY)).toBeNull();
    });
  });

  describe('context default values', () => {
    it('provides default context when used outside provider', () => {
      function DirectContextComponent() {
        const { isDebugMode, toggleDebugMode } = useContext(DebugContext);
        return (
          <div>
            <div data-testid="debug-mode">{isDebugMode ? 'true' : 'false'}</div>
            <button data-testid="toggle-btn" onClick={toggleDebugMode}>
              Toggle
            </button>
          </div>
        );
      }

      render(<DirectContextComponent />);

      expect(screen.getByTestId('debug-mode').textContent).toBe('false');

      act(() => {
        fireEvent.click(screen.getByTestId('toggle-btn'));
      });

      expect(screen.getByTestId('debug-mode').textContent).toBe('false');
    });
  });
});
