import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => {
  const NextAuth = vi.fn().mockReturnValue({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  });
  return { default: NextAuth };
});

vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn().mockReturnValue({ adapter: 'mock' }),
}));

vi.mock('next-auth/providers/google', () => ({
  default: vi.fn().mockImplementation((config) => ({
    id: 'google',
    name: 'Google',
    ...config,
  })),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn().mockImplementation((config) => ({
    id: 'credentials',
    name: 'Credentials',
    ...config,
  })),
}));

vi.mock('./password', () => ({
  verifyPassword: vi.fn(),
}));

import { createAuthConfig, createDrizzleAdapter, handlers, signIn, signOut, auth } from './auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { verifyPassword } from './password';

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuthConfig', () => {
    it('should return a NextAuthConfig object', () => {
      const config = createAuthConfig();
      expect(config).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(Array.isArray(config.providers)).toBe(true);
    });

    it('should include providers', () => {
      const config = createAuthConfig();
      // Google + Credentials = 2 providers
      expect(config.providers).toHaveLength(2);
    });

    it('should use JWT session strategy', () => {
      const config = createAuthConfig();
      expect(config.session?.strategy).toBe('jwt');
    });

    it('should set trustHost to true', () => {
      const config = createAuthConfig();
      expect(config.trustHost).toBe(true);
    });

    it('should configure sign-in and error pages', () => {
      const config = createAuthConfig();
      expect(config.pages?.signIn).toBe('/en/auth/signin');
      expect(config.pages?.error).toBe('/en/auth/error');
    });

    it('should set the adapter when provided', () => {
      const mockAdapter = { adapter: 'mock' } as any;
      const config = createAuthConfig({ adapter: mockAdapter });
      expect(config.adapter).toBe(mockAdapter);
    });

    it('should not set adapter when not provided', () => {
      const config = createAuthConfig();
      expect(config.adapter).toBeUndefined();
    });
  });

  describe('createDrizzleAdapter', () => {
    it('should call DrizzleAdapter with the provided db', () => {
      const mockDb = {} as any;
      const result = createDrizzleAdapter(mockDb);
      expect(DrizzleAdapter).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        usersTable: expect.anything(),
        accountsTable: expect.anything(),
        sessionsTable: expect.anything(),
        verificationTokensTable: expect.anything(),
      }));
      expect(result).toEqual({ adapter: 'mock' });
    });
  });

  describe('default exports', () => {
    it('should export handlers', () => {
      expect(handlers).toBeDefined();
      expect(handlers.GET).toBeDefined();
      expect(handlers.POST).toBeDefined();
    });

    it('should export signIn', () => {
      expect(signIn).toBeDefined();
    });

    it('should export signOut', () => {
      expect(signOut).toBeDefined();
    });

    it('should export auth', () => {
      expect(auth).toBeDefined();
    });
  });

  describe('callbacks', () => {
    describe('jwt callback', () => {
      it('should set token.id and token.role from user', () => {
        const config = createAuthConfig();
        const jwtCallback = config.callbacks!.jwt as any;
        const token = { sub: 'test' };
        const user = { id: 'user-1', role: 'admin' };
        const result = jwtCallback({ token, user });
        expect(result.id).toBe('user-1');
        expect(result.role).toBe('admin');
      });

      it('should default role to user when user.role is undefined', () => {
        const config = createAuthConfig();
        const jwtCallback = config.callbacks!.jwt as any;
        const token = { sub: 'test' };
        const user = { id: 'user-1' };
        const result = jwtCallback({ token, user });
        expect(result.role).toBe('user');
      });

      it('should return token unchanged when no user', () => {
        const config = createAuthConfig();
        const jwtCallback = config.callbacks!.jwt as any;
        const token = { sub: 'test', id: 'existing' };
        const result = jwtCallback({ token, user: undefined });
        expect(result).toEqual(token);
      });
    });

    describe('session callback', () => {
      it('should set session user id and role from token', () => {
        const config = createAuthConfig();
        const sessionCallback = config.callbacks!.session as any;
        const session = { user: { id: '', role: 'user' as const } };
        const token = { id: 'user-1', role: 'admin' };
        const result = sessionCallback({ session, token, user: undefined });
        expect(result.user.id).toBe('user-1');
        expect(result.user.role).toBe('admin');
      });

      it('should default role to user when token.role is undefined', () => {
        const config = createAuthConfig();
        const sessionCallback = config.callbacks!.session as any;
        const session = { user: { id: '', role: 'admin' as const } };
        const token = { id: 'user-1' };
        const result = sessionCallback({ session, token, user: undefined });
        expect(result.user.role).toBe('user');
      });

      it('should fall back to user object when token is falsy', () => {
        const config = createAuthConfig();
        const sessionCallback = config.callbacks!.session as any;
        const session = { user: { id: '', role: 'user' as const } };
        const user = { id: 'user-2', role: 'admin' };
        const result = sessionCallback({ session, token: null, user });
        expect(result.user.id).toBe('user-2');
        expect(result.user.role).toBe('admin');
      });

      it('should default role to user when user.role is undefined and token is falsy', () => {
        const config = createAuthConfig();
        const sessionCallback = config.callbacks!.session as any;
        const session = { user: { id: '', role: 'admin' as const } };
        const user = { id: 'user-2' };
        const result = sessionCallback({ session, token: null, user });
        expect(result.user.role).toBe('user');
      });
    });

    describe('signIn callback', () => {
      it('should return true when no google check is configured', async () => {
        const config = createAuthConfig();
        const signInCallback = config.callbacks!.signIn as any;
        const result = await signInCallback({ account: { provider: 'google' } });
        expect(result).toBe(true);
      });

      it('should block google sign-in when checkGoogleEnabled returns false', async () => {
        const config = createAuthConfig({
          checkGoogleEnabled: vi.fn().mockResolvedValue(false),
        });
        const signInCallback = config.callbacks!.signIn as any;
        const result = await signInCallback({ account: { provider: 'google' } });
        expect(result).toBe(false);
      });

      it('should allow google sign-in when checkGoogleEnabled returns true', async () => {
        const config = createAuthConfig({
          checkGoogleEnabled: vi.fn().mockResolvedValue(true),
        });
        const signInCallback = config.callbacks!.signIn as any;
        const result = await signInCallback({ account: { provider: 'google' } });
        expect(result).toBe(true);
      });

      it('should always allow credentials sign-in (not checked in signIn callback)', async () => {
        const config = createAuthConfig({
          checkGoogleEnabled: vi.fn().mockResolvedValue(false),
        });
        const signInCallback = config.callbacks!.signIn as any;
        const result = await signInCallback({ account: { provider: 'credentials' } });
        expect(result).toBe(true);
      });
    });
  });

  describe('credentials authorize', () => {
    function getAuthorize(options?: any) {
      const config = createAuthConfig(options);
      // The credentials provider is the second provider
      const credentialsProvider = (config.providers as any[]).find(
        (p) => p.id === 'credentials'
      );
      return credentialsProvider.authorize;
    }

    it('should throw when credentials auth is disabled', async () => {
      const authorize = getAuthorize({
        checkCredentialsEnabled: vi.fn().mockResolvedValue(false),
      });
      await expect(
        authorize({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('Credentials authentication is disabled');
    });

    it('should throw when email is missing', async () => {
      const authorize = getAuthorize({
        checkCredentialsEnabled: vi.fn().mockResolvedValue(true),
        getUserByEmail: vi.fn(),
      });
      await expect(
        authorize({ email: '', password: 'pass' })
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw when password is missing', async () => {
      const authorize = getAuthorize({
        checkCredentialsEnabled: vi.fn().mockResolvedValue(true),
        getUserByEmail: vi.fn(),
      });
      await expect(
        authorize({ email: 'test@example.com', password: '' })
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw when getUserByEmail is not provided', async () => {
      const authorize = getAuthorize({
        checkCredentialsEnabled: vi.fn().mockResolvedValue(true),
      });
      await expect(
        authorize({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('Database not available');
    });

    it('should throw and record failed attempt when user not found', async () => {
      const onCredentialsSignIn = vi.fn().mockResolvedValue(undefined);
      const authorize = getAuthorize({
        checkCredentialsEnabled: vi.fn().mockResolvedValue(true),
        getUserByEmail: vi.fn().mockResolvedValue(null),
        onCredentialsSignIn,
      });
      await expect(
        authorize({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('Invalid email or password');
      expect(onCredentialsSignIn).toHaveBeenCalledWith('test@example.com', false);
    });

    it('should throw and record failed attempt when user has no password', async () => {
      const onCredentialsSignIn = vi.fn().mockResolvedValue(undefined);
      const authorize = getAuthorize({
        checkCredentialsEnabled: vi.fn().mockResolvedValue(true),
        getUserByEmail: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          password: null,
          name: 'Test',
          role: 'user',
        }),
        onCredentialsSignIn,
      });
      await expect(
        authorize({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('Invalid email or password');
      expect(onCredentialsSignIn).toHaveBeenCalledWith('test@example.com', false);
    });

    it('should throw and record failed attempt when password is invalid', async () => {
      const onCredentialsSignIn = vi.fn().mockResolvedValue(undefined);
      vi.mocked(verifyPassword).mockResolvedValue(false);
      const authorize = getAuthorize({
        checkCredentialsEnabled: vi.fn().mockResolvedValue(true),
        getUserByEmail: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          password: 'hashed',
          name: 'Test',
          role: 'user',
        }),
        onCredentialsSignIn,
      });
      await expect(
        authorize({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
      expect(verifyPassword).toHaveBeenCalledWith('wrong', 'hashed');
      expect(onCredentialsSignIn).toHaveBeenCalledWith('test@example.com', false);
    });

    it('should return user and record success when password is valid', async () => {
      const onCredentialsSignIn = vi.fn().mockResolvedValue(undefined);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      const authorize = getAuthorize({
        checkCredentialsEnabled: vi.fn().mockResolvedValue(true),
        getUserByEmail: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          password: 'hashed',
          name: 'Test User',
          role: 'admin',
        }),
        onCredentialsSignIn,
      });
      const result = await authorize({
        email: 'test@example.com',
        password: 'correct',
      });
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      });
      expect(onCredentialsSignIn).toHaveBeenCalledWith('test@example.com', true);
    });

    it('should work without checkCredentialsEnabled option', async () => {
      vi.mocked(verifyPassword).mockResolvedValue(true);
      const authorize = getAuthorize({
        getUserByEmail: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          password: 'hashed',
          name: 'Test',
          role: 'user',
        }),
      });
      const result = await authorize({
        email: 'test@example.com',
        password: 'pass',
      });
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'user',
      });
    });

    it('should work without onCredentialsSignIn option on failure', async () => {
      const authorize = getAuthorize({
        getUserByEmail: vi.fn().mockResolvedValue(null),
      });
      await expect(
        authorize({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
