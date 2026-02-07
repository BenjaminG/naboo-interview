import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql';

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

let clientSideClient: ApolloClient<NormalizedCacheObject> | null = null;

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

export const graphqlClient: ApolloClient<NormalizedCacheObject> =
  typeof window === 'undefined' ? createSSRClient() : getClientSideClient();
