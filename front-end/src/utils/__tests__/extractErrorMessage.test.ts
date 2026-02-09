import { describe, it, expect } from 'vitest';
import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { extractErrorMessage } from '../extractErrorMessage';

describe('extractErrorMessage', () => {
  describe('ApolloError with graphQLErrors', () => {
    it('returns the first graphQL error message', () => {
      const error = new ApolloError({
        graphQLErrors: [new GraphQLError('Email already exists')],
      });

      expect(extractErrorMessage(error)).toBe('Email already exists');
    });

    it('returns the first message when multiple graphQL errors exist', () => {
      const error = new ApolloError({
        graphQLErrors: [
          new GraphQLError('First error'),
          new GraphQLError('Second error'),
        ],
      });

      expect(extractErrorMessage(error)).toBe('First error');
    });

    it('handles graphQL error with empty message', () => {
      const error = new ApolloError({
        graphQLErrors: [new GraphQLError('')],
      });

      expect(extractErrorMessage(error)).toBe(
        'Une erreur est survenue. Veuillez réessayer.'
      );
    });
  });

  describe('ApolloError with networkError', () => {
    it('returns French network error message for network errors', () => {
      const error = new ApolloError({
        networkError: new Error('Failed to fetch'),
      });

      expect(extractErrorMessage(error)).toBe(
        'Impossible de contacter le serveur. Vérifiez votre connexion.'
      );
    });

    it('returns network error message even when message differs', () => {
      const error = new ApolloError({
        networkError: new Error('Network request failed'),
      });

      expect(extractErrorMessage(error)).toBe(
        'Impossible de contacter le serveur. Vérifiez votre connexion.'
      );
    });
  });

  describe('ApolloError with both graphQLErrors and networkError', () => {
    it('prioritizes graphQLErrors over networkError', () => {
      const error = new ApolloError({
        graphQLErrors: [new GraphQLError('Invalid credentials')],
        networkError: new Error('Network error'),
      });

      expect(extractErrorMessage(error)).toBe('Invalid credentials');
    });
  });

  describe('plain Error objects', () => {
    it('returns the error message', () => {
      const error = new Error('Something went wrong');

      expect(extractErrorMessage(error)).toBe('Something went wrong');
    });

    it('handles empty error message', () => {
      const error = new Error('');

      expect(extractErrorMessage(error)).toBe(
        'Une erreur est survenue. Veuillez réessayer.'
      );
    });
  });

  describe('null and undefined', () => {
    it('returns French fallback for null', () => {
      expect(extractErrorMessage(null)).toBe(
        'Une erreur est survenue. Veuillez réessayer.'
      );
    });

    it('returns French fallback for undefined', () => {
      expect(extractErrorMessage(undefined)).toBe(
        'Une erreur est survenue. Veuillez réessayer.'
      );
    });
  });

  describe('unknown error types', () => {
    it('returns fallback for string thrown as error', () => {
      expect(extractErrorMessage('string error')).toBe(
        'Une erreur est survenue. Veuillez réessayer.'
      );
    });

    it('returns fallback for number thrown as error', () => {
      expect(extractErrorMessage(42)).toBe(
        'Une erreur est survenue. Veuillez réessayer.'
      );
    });

    it('returns fallback for object without message property', () => {
      expect(extractErrorMessage({ code: 500 })).toBe(
        'Une erreur est survenue. Veuillez réessayer.'
      );
    });

    it('extracts message from object with message property', () => {
      expect(extractErrorMessage({ message: 'Custom error' })).toBe(
        'Custom error'
      );
    });
  });

  describe('type safety', () => {
    it('always returns a string', () => {
      const inputs = [
        new ApolloError({ graphQLErrors: [new GraphQLError('test')] }),
        new Error('test'),
        null,
        undefined,
        {},
        'string',
        42,
      ];

      inputs.forEach((input) => {
        const result = extractErrorMessage(input);
        expect(typeof result).toBe('string');
      });
    });

    it('never returns raw error objects', () => {
      const error = new Error('test');
      const result = extractErrorMessage(error);

      expect(result).not.toBe(error);
      expect(typeof result).toBe('string');
    });
  });

  describe('security - no sensitive data leakage', () => {
    it('does not expose stack traces in error messages', () => {
      const error = new Error('User error');
      error.stack = 'Error: User error\n    at /internal/path/file.js:123:45';

      const result = extractErrorMessage(error);

      expect(result).not.toContain('/internal/path');
      expect(result).not.toContain('file.js');
      expect(result).not.toContain(':123:45');
    });
  });
});
