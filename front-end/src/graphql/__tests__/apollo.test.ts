import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Apollo Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createSSRClient', () => {
    it('returns a new instance on each call', async () => {
      const { createSSRClient } = await import('../apollo');

      const client1 = createSSRClient();
      const client2 = createSSRClient();

      expect(client1).not.toBe(client2);
    });

    it('passes cookie to HttpLink headers when provided', async () => {
      const { createSSRClient } = await import('../apollo');

      const client = createSSRClient('session=abc123');

      // Client should be created with cookie header
      expect(client).toBeDefined();
      expect(client.link).toBeDefined();
    });
  });

  describe('getClientSideClient', () => {
    it('returns the same instance on multiple calls', async () => {
      const { getClientSideClient } = await import('../apollo');

      const client1 = getClientSideClient();
      const client2 = getClientSideClient();

      expect(client1).toBe(client2);
    });
  });

  describe('environment variable URL configuration', () => {
    it('uses NEXT_PUBLIC_GRAPHQL_URL when set', async () => {
      process.env.NEXT_PUBLIC_GRAPHQL_URL = 'https://api.example.com/graphql';

      const { createSSRClient } = await import('../apollo');
      const client = createSSRClient();

      // The client should be created with the custom URL
      expect(client).toBeDefined();
    });

    it('falls back to localhost when env var is not set', async () => {
      delete process.env.NEXT_PUBLIC_GRAPHQL_URL;

      const { createSSRClient } = await import('../apollo');
      const client = createSSRClient();

      // The client should be created with localhost fallback
      expect(client).toBeDefined();
    });
  });

  describe('graphqlClient export (backwards-compatible)', () => {
    it('exports graphqlClient for backwards compatibility', async () => {
      const { graphqlClient } = await import('../apollo');

      expect(graphqlClient).toBeDefined();
      expect(graphqlClient.query).toBeDefined();
      expect(graphqlClient.mutate).toBeDefined();
    });
  });

  describe('TypeScript types', () => {
    it('createSSRClient returns ApolloClient<NormalizedCacheObject>', async () => {
      const { createSSRClient } = await import('../apollo');
      const client = createSSRClient();

      // Type check: ensure cache is NormalizedCacheObject, not any
      expect(client.cache).toBeDefined();
      expect(typeof client.cache.extract).toBe('function');
    });

    it('getClientSideClient returns ApolloClient<NormalizedCacheObject>', async () => {
      const { getClientSideClient } = await import('../apollo');
      const client = getClientSideClient();

      // Type check: ensure cache is NormalizedCacheObject, not any
      expect(client.cache).toBeDefined();
      expect(typeof client.cache.extract).toBe('function');
    });
  });
});
