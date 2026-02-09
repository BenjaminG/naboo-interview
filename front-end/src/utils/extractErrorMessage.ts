import { ApolloError } from '@apollo/client';

const FALLBACK_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';
const NETWORK_ERROR_MESSAGE =
  'Impossible de contacter le serveur. Vérifiez votre connexion.';

function isApolloError(error: unknown): error is ApolloError {
  return error instanceof ApolloError;
}

function isErrorLike(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

export function extractErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return FALLBACK_MESSAGE;
  }

  if (isApolloError(error)) {
    if (error.graphQLErrors.length > 0) {
      const message = error.graphQLErrors[0].message;
      return message || FALLBACK_MESSAGE;
    }

    if (error.networkError) {
      return NETWORK_ERROR_MESSAGE;
    }

    return FALLBACK_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message || FALLBACK_MESSAGE;
  }

  if (isErrorLike(error)) {
    return error.message || FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
}
