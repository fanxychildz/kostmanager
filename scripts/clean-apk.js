import fs from 'fs';
import path from 'path';

const apkPath = path.join('dist', 'client', 'KeKost.apk');

if (process.env.VERCEL === '1' || process.env.VERCEL === 'true') {
  console.log("Running on Vercel, keeping KeKost.apk for download.");
  process.exit(0);
}

if (fs.existsSync(apkPath)) {
  try {
    fs.unlinkSync(apkPath);
    console.log(`Successfully removed ${apkPath} to prevent nested packaging.`);
  } catch (err) {
    console.error(`Error removing ${apkPath}:`, err.message);
  }
} else {
  console.log(`${apkPath} not found, nothing to clean.`);
}
