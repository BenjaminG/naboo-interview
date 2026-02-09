import { describe, it, expect } from 'vitest';
import { formatDebugDate } from '../formatDebugDate';

describe('formatDebugDate', () => {
  it('formats a valid date as "Créé le DD mon. YYYY"', () => {
    const date = '2026-01-15T10:30:00.000Z';
    const result = formatDebugDate(date);

    expect(result).toBe('Créé le 15 janv. 2026');
  });

  it('returns null for null input', () => {
    const result = formatDebugDate(null);

    expect(result).toBeNull();
  });

  it('returns null for undefined input', () => {
    const result = formatDebugDate(undefined);

    expect(result).toBeNull();
  });

  it('formats dates in various months correctly', () => {
    expect(formatDebugDate('2026-02-20T12:00:00.000Z')).toBe('Créé le 20 févr. 2026');
    expect(formatDebugDate('2026-03-05T12:00:00.000Z')).toBe('Créé le 5 mars 2026');
    expect(formatDebugDate('2026-06-01T12:00:00.000Z')).toBe('Créé le 1 juin 2026');
    expect(formatDebugDate('2026-12-31T12:00:00.000Z')).toBe('Créé le 31 déc. 2026');
  });

  it('handles ISO date strings', () => {
    const isoDate = '2026-07-04T14:22:33.000Z';
    const result = formatDebugDate(isoDate);

    expect(result).toBe('Créé le 4 juil. 2026');
  });
});
