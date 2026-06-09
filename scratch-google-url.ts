process.env.GOOGLE_CLIENT_ID = '92294713014-7la7u3aipmtj11il7n951dm30n0b1633.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'GOCSPX-dummy';
process.env.BETTER_AUTH_URL = 'https://kostmanager-ten.vercel.app';
process.env.BETTER_AUTH_SECRET = 'kostmanager-dev-secret-change-me-in-production';

console.log('ENV GOOGLE_CLIENT_ID before import:', process.env.GOOGLE_CLIENT_ID);

async function run() {
  const { auth } = await import('./src/server/auth');
  console.log('auth.options.socialProviders.google:', auth.options.socialProviders?.google);

  const req = new Request('https://kostmanager-ten.vercel.app/api/auth/sign-in/social', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider: 'google', callbackURL: '/dashboard' }),
  });

  try {
    const res = await auth.handler(req);
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('JSON Body:', json);
  } catch (err) {
    console.error(err);
  }
}

run();
