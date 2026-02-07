import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Axios Instance', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('environment variable URL configuration', () => {
    it('uses NEXT_PUBLIC_API_URL when set', async () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/api';

      const { axiosInstance } = await import('../axios');

      expect(axiosInstance.defaults.baseURL).toBe(
        'https://api.example.com/api'
      );
    });

    it('falls back to localhost when env var is not set', async () => {
      delete process.env.NEXT_PUBLIC_API_URL;

      const { axiosInstance } = await import('../axios');

      expect(axiosInstance.defaults.baseURL).toBe('http://localhost:3000/api');
    });
  });

  describe('axios configuration', () => {
    it('has withCredentials enabled', async () => {
      const { axiosInstance } = await import('../axios');

      expect(axiosInstance.defaults.withCredentials).toBe(true);
    });

    it('has Content-Type header set to application/json', async () => {
      const { axiosInstance } = await import('../axios');

      expect(axiosInstance.defaults.headers['Content-Type']).toBe(
        'application/json'
      );
    });
  });
});
