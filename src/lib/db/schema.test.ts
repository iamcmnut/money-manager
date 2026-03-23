import { describe, it, expect } from 'vitest';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  chargingNetworks,
  chargingRecords,
  loginAttempts,
} from './schema';
import type {
  User,
  NewUser,
  Account,
  Session,
  ChargingNetwork,
  NewChargingNetwork,
  ChargingRecord,
  NewChargingRecord,
  LoginAttempt,
  NewLoginAttempt,
} from './schema';

describe('schema tables', () => {
  it('users table is defined with correct columns', () => {
    expect(users).toBeDefined();
    const columns = Object.keys(users);
    expect(columns).toContain('id');
    expect(columns).toContain('email');
    expect(columns).toContain('password');
    expect(columns).toContain('name');
    expect(columns).toContain('image');
    expect(columns).toContain('role');
    expect(columns).toContain('emailVerified');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('accounts table is defined with correct columns', () => {
    expect(accounts).toBeDefined();
    const columns = Object.keys(accounts);
    expect(columns).toContain('userId');
    expect(columns).toContain('type');
    expect(columns).toContain('provider');
    expect(columns).toContain('providerAccountId');
    expect(columns).toContain('refreshToken');
    expect(columns).toContain('accessToken');
    expect(columns).toContain('expiresAt');
    expect(columns).toContain('tokenType');
    expect(columns).toContain('scope');
    expect(columns).toContain('idToken');
    expect(columns).toContain('sessionState');
  });

  it('sessions table is defined with correct columns', () => {
    expect(sessions).toBeDefined();
    const columns = Object.keys(sessions);
    expect(columns).toContain('sessionToken');
    expect(columns).toContain('userId');
    expect(columns).toContain('expires');
  });

  it('verificationTokens table is defined with correct columns', () => {
    expect(verificationTokens).toBeDefined();
    const columns = Object.keys(verificationTokens);
    expect(columns).toContain('identifier');
    expect(columns).toContain('token');
    expect(columns).toContain('expires');
  });

  it('chargingNetworks table is defined with correct columns', () => {
    expect(chargingNetworks).toBeDefined();
    const columns = Object.keys(chargingNetworks);
    expect(columns).toContain('id');
    expect(columns).toContain('name');
    expect(columns).toContain('slug');
    expect(columns).toContain('logo');
    expect(columns).toContain('website');
    expect(columns).toContain('phone');
    expect(columns).toContain('brandColor');
    expect(columns).toContain('referralCode');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('chargingRecords table is defined with correct columns', () => {
    expect(chargingRecords).toBeDefined();
    const columns = Object.keys(chargingRecords);
    expect(columns).toContain('id');
    expect(columns).toContain('userId');
    expect(columns).toContain('brandId');
    expect(columns).toContain('chargingDatetime');
    expect(columns).toContain('chargedKwh');
    expect(columns).toContain('costThb');
    expect(columns).toContain('avgUnitPrice');
    expect(columns).toContain('chargingPowerKw');
    expect(columns).toContain('chargingFinishDatetime');
    expect(columns).toContain('mileageKm');
    expect(columns).toContain('notes');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('loginAttempts table is defined with correct columns', () => {
    expect(loginAttempts).toBeDefined();
    const columns = Object.keys(loginAttempts);
    expect(columns).toContain('id');
    expect(columns).toContain('identifier');
    expect(columns).toContain('attemptType');
    expect(columns).toContain('success');
    expect(columns).toContain('ipAddress');
    expect(columns).toContain('attemptedAt');
  });
});

describe('schema type exports', () => {
  it('User types are properly exported', () => {
    // Type-level checks — these just verify the types compile
    const userType: User = {} as User;
    const newUserType: NewUser = {} as NewUser;
    expect(userType).toBeDefined();
    expect(newUserType).toBeDefined();
  });

  it('Account type is properly exported', () => {
    const accountType: Account = {} as Account;
    expect(accountType).toBeDefined();
  });

  it('Session type is properly exported', () => {
    const sessionType: Session = {} as Session;
    expect(sessionType).toBeDefined();
  });

  it('ChargingNetwork types are properly exported', () => {
    const network: ChargingNetwork = {} as ChargingNetwork;
    const newNetwork: NewChargingNetwork = {} as NewChargingNetwork;
    expect(network).toBeDefined();
    expect(newNetwork).toBeDefined();
  });

  it('ChargingRecord types are properly exported', () => {
    const record: ChargingRecord = {} as ChargingRecord;
    const newRecord: NewChargingRecord = {} as NewChargingRecord;
    expect(record).toBeDefined();
    expect(newRecord).toBeDefined();
  });

  it('LoginAttempt types are properly exported', () => {
    const attempt: LoginAttempt = {} as LoginAttempt;
    const newAttempt: NewLoginAttempt = {} as NewLoginAttempt;
    expect(attempt).toBeDefined();
    expect(newAttempt).toBeDefined();
  });
});
