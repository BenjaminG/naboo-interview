describe('AppModule GraphQL Configuration', () => {
  describe('playground configuration', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      // Restore NODE_ENV after each test
      if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
      jest.resetModules();
    });

    it('should disable playground when NODE_ENV=production', async () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();

      // Re-import after changing NODE_ENV
      const { getPlaygroundConfig } = await import('./app.module');

      expect(getPlaygroundConfig()).toBe(false);
    });

    it('should enable playground when NODE_ENV=development', async () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      const { getPlaygroundConfig } = await import('./app.module');

      expect(getPlaygroundConfig()).toBe(true);
    });

    it('should enable playground when NODE_ENV is not set (dev default)', async () => {
      delete process.env.NODE_ENV;
      jest.resetModules();

      const { getPlaygroundConfig } = await import('./app.module');

      expect(getPlaygroundConfig()).toBe(true);
    });
  });
});
