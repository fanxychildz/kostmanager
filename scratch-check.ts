import { auth } from './src/server/auth';

// Let's inspect options and how routes are constructed
console.log('baseURL:', auth.options.baseURL);
console.log('endpoints:');
const handlerKeys = Object.keys(auth.api || {});
for (const key of handlerKeys) {
  const handler = (auth.api as any)[key];
  if (handler) {
    console.log(`- ${key}: method=${handler.method}, path=${handler.path}`);
  }
}
