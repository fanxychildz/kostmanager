import fs from 'fs';
import path from 'path';

const apkPath = path.join('dist', 'client', 'KeKost.apk');

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
