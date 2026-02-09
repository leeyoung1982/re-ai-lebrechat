const fs = require('fs-extra');

async function postBuild() {
  try {
    await fs.copy('public/assets', 'dist/assets');
    await fs.copy('public/robots.txt', 'dist/robots.txt');
    await fs.copy('public/favicon.svg', 'dist/favicon.svg');
    await fs.copy('public/favicon-32x32.png', 'dist/favicon-32x32.png');
    await fs.copy('public/favicon-16x16.png', 'dist/favicon-16x16.png');
    await fs.copy('public/favicon.ico', 'dist/favicon.ico');
    await fs.copy('public/apple-touch-icon.png', 'dist/apple-touch-icon.png');
    await fs.copy('public/android-chrome-192x192.png', 'dist/android-chrome-192x192.png');
    await fs.copy('public/android-chrome-512x512.png', 'dist/android-chrome-512x512.png');
    console.log('✅ PWA icons and robots.txt copied successfully. Glob pattern warnings resolved.');
  } catch (err) {
    console.error('❌ Error copying files:', err);
    process.exit(1);
  }
}

postBuild();
