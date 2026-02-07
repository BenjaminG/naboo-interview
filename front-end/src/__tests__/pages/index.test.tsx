import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Apollo client module
const mockQuery = vi.fn();
const mockCreateSSRClient = vi.fn(() => ({
  query: mockQuery,
}));

vi.mock('@/graphql/apollo', () => ({
  createSSRClient: mockCreateSSRClient,
  graphqlClient: {
    query: vi.fn(),
  },
}));

// Mock Mantine components
vi.mock('@mantine/core', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-alert">{children}</div>
  ),
  Button: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

// Mock components
vi.mock('@/components', () => ({
  Activity: ({ activity }: { activity: { id: string } }) => (
    <div data-testid="activity">{activity.id}</div>
  ),
  PageTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

// Mock hooks
vi.mock('@/utils', () => ({
  useGlobalStyles: () => ({ classes: { link: 'link-class' } }),
}));

describe('Home Page (index.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSSRClient.mockReturnValue({ query: mockQuery });
  });

  describe('getServerSideProps', () => {
    it('uses createSSRClient instead of graphqlClient singleton', async () => {
      const { getServerSideProps } = await import('@/pages/index');

      mockQuery.mockResolvedValueOnce({
        data: { getLatestActivities: [] },
      });

      const mockReq = {
        headers: { cookie: 'session=abc123' },
      };

      await getServerSideProps({
        req: mockReq,
        res: {},
        resolvedUrl: '/',
        query: {},
      } as any);

      // Should use createSSRClient, not the singleton
      expect(mockCreateSSRClient).toHaveBeenCalledWith('session=abc123');
    });

    it('returns activities on successful query', async () => {
      const { getServerSideProps } = await import('@/pages/index');

      const mockActivities = [
        { id: '1', name: 'Activity 1' },
        { id: '2', name: 'Activity 2' },
      ];

      mockQuery.mockResolvedValueOnce({
        data: { getLatestActivities: mockActivities },
      });

      const result = await getServerSideProps({
        req: { headers: { cookie: '' } },
        res: {},
        resolvedUrl: '/',
        query: {},
      } as any);

      expect(result).toEqual({
        props: {
          activities: mockActivities,
        },
      });
    });

    it('returns empty activities with error: true on query failure', async () => {
      const { getServerSideProps } = await import('@/pages/index');

      mockQuery.mockRejectedValueOnce(new Error('Network error'));

      const result = await getServerSideProps({
        req: { headers: { cookie: '' } },
        res: {},
        resolvedUrl: '/',
        query: {},
      } as any);

      expect(result).toEqual({
        props: {
          activities: [],
          error: true,
        },
      });
    });
  });

  describe('Component rendering', () => {
    it('displays error message in French when error prop is true', async () => {
      const { default: Home } = await import('@/pages/index');

      render(<Home activities={[]} error={true} />);

      // Should show error alert with French error message
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(/indisponible/i)).toBeInTheDocument();
    });

    it('renders activities normally when no error', async () => {
      const { default: Home } = await import('@/pages/index');

      const activities = [
        {
          id: '1',
          name: 'Activity 1',
          description: 'Desc 1',
          city: 'Paris',
          price: 100,
          owner: { firstName: 'John', lastName: 'Doe' },
        },
      ];

      render(<Home activities={activities} />);

      expect(screen.getByTestId('activity')).toBeInTheDocument();
    });
  });
});
