import { betterAuth } from 'better-auth';

// Test 1: account.accountLinking
const auth1 = betterAuth({
  database: { db: {} as any, type: 'sqlite' },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    }
  }
});

// Test 2: advanced.accountLinking
const auth2 = betterAuth({
  database: { db: {} as any, type: 'sqlite' },
  advanced: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    }
  }
});
