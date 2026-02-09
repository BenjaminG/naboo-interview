import { Topbar } from "@/components";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, DebugProvider, SnackbarProvider } from "@/contexts";
import { routes } from "@/routes";
import { graphqlClient } from "@/graphql/apollo";
import { mantineTheme } from "@/utils";
import { ApolloProvider } from "@apollo/client";
import { Container, MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={mantineTheme}>
      <SnackbarProvider>
        <ApolloProvider client={graphqlClient}>
          <AuthProvider>
            <DebugProvider>
              <Topbar routes={routes} />
              <Container>
                <ErrorBoundary>
                  <Component {...pageProps} />
                </ErrorBoundary>
              </Container>
            </DebugProvider>
          </AuthProvider>
        </ApolloProvider>
      </SnackbarProvider>
    </MantineProvider>
  );
}
