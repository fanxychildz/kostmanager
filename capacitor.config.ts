import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kekost.app',
  appName: 'KeKost',
  webDir: 'dist/client',
  server: {
    url: 'https://kekost.my.id',
    cleartext: true
  }
};

export default config;
