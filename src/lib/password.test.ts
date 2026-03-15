import { describe, it, expect } from 'vitest';
import { validatePassword, validateEmail, hashPassword, verifyPassword } from './password';

describe('validatePassword', () => {
  it('should reject passwords shorter than 8 characters', () => {
    const result = validatePassword('Abc123');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must be at least 8 characters');
  });

  it('should reject passwords longer than 128 characters', () => {
    const longPassword = 'Aa1' + 'x'.repeat(126);
    const result = validatePassword(longPassword);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must be less than 128 characters');
  });

  it('should reject passwords without uppercase letters', () => {
    const result = validatePassword('abcdefgh1');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one uppercase letter');
  });

  it('should reject passwords without lowercase letters', () => {
    const result = validatePassword('ABCDEFGH1');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one lowercase letter');
  });

  it('should reject passwords without numbers', () => {
    const result = validatePassword('Abcdefghi');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password must contain at least one number');
  });

  it('should accept valid passwords', () => {
    const result = validatePassword('SecurePass123');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should accept passwords with special characters', () => {
    const result = validatePassword('Secure@Pass123!');
    expect(result.valid).toBe(true);
  });

  it('should accept minimum valid password', () => {
    const result = validatePassword('Abcdefg1');
    expect(result.valid).toBe(true);
  });
});

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    expect(validateEmail('name+tag@email.org')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
    expect(validateEmail('no@spaces .com')).toBe(false);
  });
});

describe('hashPassword and verifyPassword', () => {
  it('should hash a password', async () => {
    const password = 'SecurePass123';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should produce different hashes for the same password', async () => {
    const password = 'SecurePass123';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it('should verify correct password', async () => {
    const password = 'SecurePass123';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'SecurePass123';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword123', hash);
    expect(isValid).toBe(false);
  });

  it('should reject empty password against valid hash', async () => {
    const password = 'SecurePass123';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('', hash);
    expect(isValid).toBe(false);
  });
});
