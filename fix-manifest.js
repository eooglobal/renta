const fs = require('fs');
const manifestPath = '/home/krwgocrr/userenta.com/.next/routes-manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Fix rewrites — must be array
if (typeof manifest.rewrites === 'object' && !Array.isArray(manifest.rewrites)) {
  const before = manifest.rewrites.beforeFiles || [];
  const after = manifest.rewrites.afterFiles || [];
  const fallback = manifest.rewrites.fallback || [];
  manifest.rewrites = before.concat(after).concat(fallback);
  console.log('Fixed rewrites -> array:', manifest.rewrites.length, 'items');
}

// Fix redirects — must be array
if (!Array.isArray(manifest.redirects)) {
  manifest.redirects = [];
  console.log('Fixed redirects -> empty array');
} else {
  console.log('redirects OK:', manifest.redirects.length, 'items');
}

// Fix headers — must be array
if (!Array.isArray(manifest.headers)) {
  manifest.headers = [];
  console.log('Fixed headers -> empty array');
} else {
  console.log('headers OK:', manifest.headers.length, 'items');
}

// Fix dataRoutes — must be array
if (!Array.isArray(manifest.dataRoutes)) {
  manifest.dataRoutes = [];
  console.log('Fixed dataRoutes -> empty array');
} else {
  console.log('dataRoutes OK:', manifest.dataRoutes.length, 'items');
}

// Fix staticRoutes — must be array
if (!Array.isArray(manifest.staticRoutes)) {
  manifest.staticRoutes = [];
  console.log('Fixed staticRoutes -> empty array');
} else {
  console.log('staticRoutes OK:', manifest.staticRoutes.length, 'items');
}

// Fix dynamicRoutes — must be array
if (!Array.isArray(manifest.dynamicRoutes)) {
  manifest.dynamicRoutes = [];
  console.log('Fixed dynamicRoutes -> empty array');
} else {
  console.log('dynamicRoutes OK:', manifest.dynamicRoutes.length, 'items');
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Manifest saved.');

// Also check build-manifest
const buildPath = '/home/krwgocrr/userenta.com/.next/build-manifest.json';
const build = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
console.log('\nbuild-manifest pages keys:', Object.keys(build.pages || {}));
console.log('build-manifest rootMainFiles:', (build.rootMainFiles || []).length, 'files');
