import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const srcAssets = join(root, 'src', 'assets');
const publicIcons = join(root, 'public', 'icons');

if (!existsSync(publicIcons)) mkdirSync(publicIcons, { recursive: true });

const candidates = [
  'icon-192x192.png',
  'icon-512x512.png',
  'guardian-ng-logo.png'
];

candidates.forEach((name) => {
  const src = join(srcAssets, name);
  const dest = join(publicIcons, name);
  try {
    if (existsSync(src)) {
      copyFileSync(src, dest);
      console.log(`Copied ${name} to public/icons/`);
    } else {
      console.warn(`Source icon not found: ${src}`);
    }
  } catch (err) {
    console.error('Failed to copy icon', name, err);
  }
});
