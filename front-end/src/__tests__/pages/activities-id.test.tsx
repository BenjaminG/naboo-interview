import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Activity Details Page (activities/[id].tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSSRClient.mockReturnValue({ query: mockQuery });
  });

  describe('getServerSideProps', () => {
    it('uses createSSRClient instead of graphqlClient singleton', async () => {
      const { getServerSideProps } = await import('@/pages/activities/[id]');

      mockQuery.mockResolvedValueOnce({
        data: {
          getActivity: {
            id: '1',
            name: 'Test Activity',
            description: 'Test',
            city: 'Paris',
            price: 100,
            owner: { firstName: 'John', lastName: 'Doe' },
          },
        },
      });

      const mockReq = {
        headers: { cookie: 'session=abc123' },
      };

      await getServerSideProps({
        req: mockReq,
        res: {},
        params: { id: '1' },
        resolvedUrl: '/activities/1',
        query: {},
      } as any);

      // Should use createSSRClient with cookie
      expect(mockCreateSSRClient).toHaveBeenCalledWith('session=abc123');
    });

    it('returns activity on successful query', async () => {
      const { getServerSideProps } = await import('@/pages/activities/[id]');

      const mockActivity = {
        id: '1',
        name: 'Test Activity',
        description: 'Test desc',
        city: 'Paris',
        price: 100,
        owner: { firstName: 'John', lastName: 'Doe' },
      };

      mockQuery.mockResolvedValueOnce({
        data: { getActivity: mockActivity },
      });

      const result = await getServerSideProps({
        req: { headers: { cookie: '' } },
        res: {},
        params: { id: '1' },
        resolvedUrl: '/activities/1',
        query: {},
      } as any);

      expect(result).toEqual({
        props: {
          activity: mockActivity,
        },
      });
    });

    it('returns notFound: true on query failure', async () => {
      const { getServerSideProps } = await import('@/pages/activities/[id]');

      mockQuery.mockRejectedValueOnce(new Error('Activity not found'));

      const result = await getServerSideProps({
        req: { headers: { cookie: '' } },
        res: {},
        params: { id: 'non-existent' },
        resolvedUrl: '/activities/non-existent',
        query: {},
      } as any);

      expect(result).toEqual({
        notFound: true,
      });
    });

    it('returns notFound: true when params.id is missing', async () => {
      const { getServerSideProps } = await import('@/pages/activities/[id]');

      const result = await getServerSideProps({
        req: { headers: { cookie: '' } },
        res: {},
        params: {},
        resolvedUrl: '/activities/',
        query: {},
      } as any);

      expect(result).toEqual({
        notFound: true,
      });
    });

    it('returns notFound: true when params.id is an array', async () => {
      const { getServerSideProps } = await import('@/pages/activities/[id]');

      const result = await getServerSideProps({
        req: { headers: { cookie: '' } },
        res: {},
        params: { id: ['1', '2'] },
        resolvedUrl: '/activities/',
        query: {},
      } as any);

      expect(result).toEqual({
        notFound: true,
      });
    });
  });
});
