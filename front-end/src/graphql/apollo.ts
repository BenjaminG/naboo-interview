import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql';

/**
 * Creates a new Apollo Client instance for SSR usage.
 * Each SSR request should get a fresh client to prevent cache pollution.
 * @param cookie Optional cookie string to pass to the GraphQL server
 */
export function createSSRClient(
  cookie?: string
): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: GRAPHQL_URL,
      credentials: 'include',
      headers: cookie ? { cookie } : undefined,
    }),
    ssrMode: true,
  });
}

// Singleton client for client-side usage
let clientSideClient: ApolloClient<NormalizedCacheObject> | null = null;

/**
 * Returns a singleton Apollo Client instance for client-side usage.
 * The same instance is reused across the app lifecycle in the browser.
 */
export function getClientSideClient(): ApolloClient<NormalizedCacheObject> {
  if (!clientSideClient) {
    clientSideClient = new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        uri: GRAPHQL_URL,
        credentials: 'include',
      }),
      ssrMode: false,
    });
  }
  return clientSideClient;
}

/**
 * Backwards-compatible export.
 * On server: creates a new SSR client (note: pages should use createSSRClient directly)
 * On client: returns the singleton client
 */
export const graphqlClient: ApolloClient<NormalizedCacheObject> =
  typeof window === 'undefined' ? createSSRClient() : getClientSideClient();
