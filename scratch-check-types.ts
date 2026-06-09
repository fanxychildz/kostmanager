import { betterAuth } from 'better-auth';
// Let's inspect the types of betterAuth options or print keys of options
console.log('inspecting option properties...');
// We can check if it's on root, account, or advanced
// Let's create a dummy config and check compilation or types
const auth = betterAuth({
  database: {
    db: {} as any,
    type: 'sqlite',
  },
});
console.log('auth:', typeof auth);
