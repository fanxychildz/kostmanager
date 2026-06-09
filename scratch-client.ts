import { createAuthClient } from 'better-auth/client';

const client = createAuthClient({
  baseURL: 'http://localhost:3000',
  fetchOptions: {
    onRequest: (context) => {
      console.log('Method:', context.method);
      console.log('Body:', context.body);
      console.log('Headers:', context.headers);
      throw new Error('STOP');
    }
  }
});

client.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard'
}).catch(err => {
  if (err.message !== 'STOP') {
    console.error(err);
  }
});
