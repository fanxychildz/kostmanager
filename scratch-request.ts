import { auth } from './src/server/auth';

async function run() {
  const req = new Request('http://localhost:3000/api/auth/sign-in/social', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider: 'google', callbackURL: '/dashboard' }),
  });

  try {
    const res = await auth.handler(req);
    console.log('POST Status:', res.status);
    console.log('POST Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('POST Body:', text);
  } catch (err) {
    console.error('Error running auth.handler:', err);
  }
}

run();
