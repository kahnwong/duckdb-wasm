import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import mkdir from 'make-dir';
import { fileURLToPath } from 'url';

// Bundling node is a bit problematic right now.
// The web worker ponyfill is commonjs (dynamic require) and prevents us from releasing an async node module.

function printErr(err) {
    if (err) return console.log(err);
}

// -------------------------------
// Clear directory

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, 'dist');
mkdir.sync(dist);
rimraf.sync(dist + '/*.wasm');
rimraf.sync(dist + '/*.js');
rimraf.sync(dist + '/*.js.map');

// -------------------------------
// Copy WASM files

const src = path.resolve(__dirname, 'src');
fs.copyFile(path.resolve(src, 'bindings', 'duckdb_wasm.wasm'), path.resolve(dist, 'duckdb.wasm'), printErr);

// -------------------------------
// ESM

const TARGET = 'es2020';
const EXTERNALS = ['apache-arrow', 'crypto', 'os', 'fs', 'path', 'fast-glob', 'wasm-check'];

console.log('[ ESBUILD ] duckdb.module.js');
esbuild.build({
    entryPoints: [
        './src/targets/duckdb.module.ts',
        './src/targets/duckdb-browser.module.ts',
        './src/targets/duckdb-node.module.ts',
    ],
    entryNames: '[name]',
    outdir: './dist',
    platform: 'neutral',
    format: 'esm',
    target: TARGET,
    splitting: true,
    bundle: true,
    minify: true,
    sourcemap: 'external',
    external: EXTERNALS,
});

// -------------------------------
// Browser

console.log('[ ESBUILD ] duckdb-browser.js');
esbuild.build({
    entryPoints: ['./src/targets/duckdb-browser-serial.ts'],
    outfile: 'dist/duckdb-browser.js',
    platform: 'browser',
    format: 'iife',
    globalName: 'duckdb',
    target: TARGET,
    bundle: true,
    minify: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    sourcemap: 'external',
});

console.log('[ ESBUILD ] duckdb-browser-parallel.js');
esbuild.build({
    entryPoints: ['./src/targets/duckdb-browser-parallel.ts'],
    outfile: 'dist/duckdb-browser-parallel.js',
    platform: 'browser',
    format: 'iife',
    globalName: 'duckdb',
    target: TARGET,
    bundle: true,
    minify: true,
    sourcemap: 'external',
});

console.log('[ ESBUILD ] duckdb-browser-parallel.worker.js');
esbuild.build({
    entryPoints: ['./src/targets/duckdb-browser-parallel.worker.ts'],
    outfile: 'dist/duckdb-browser-parallel.worker.js',
    platform: 'browser',
    format: 'iife',
    globalName: 'duckdb',
    target: TARGET,
    bundle: true,
    minify: true,
    sourcemap: 'external',
});

// -------------------------------
// NODE

console.log('[ ESBUILD ] duckdb-node.js');
esbuild.build({
    entryPoints: ['./src/targets/duckdb-node-serial.ts'],
    outfile: 'dist/duckdb-node.js',
    platform: 'node',
    format: 'cjs',
    target: TARGET,
    bundle: true,
    minify: true,
    sourcemap: 'external',
    external: EXTERNALS,
});

console.log('[ ESBUILD ] duckdb-node-parallel.js');
esbuild.build({
    entryPoints: ['./src/targets/duckdb-node-parallel.ts'],
    outfile: 'dist/duckdb-node-parallel.js',
    platform: 'node',
    format: 'cjs',
    target: TARGET,
    bundle: true,
    minify: true,
    sourcemap: 'external',
    external: EXTERNALS,
});

console.log('[ ESBUILD ] duckdb-node-parallel.worker.js');
esbuild.build({
    entryPoints: ['./src/targets/duckdb-node-parallel.worker.ts'],
    outfile: 'dist/duckdb-node-parallel.worker.js',
    platform: 'node',
    format: 'cjs',
    target: TARGET,
    bundle: true,
    minify: true,
    sourcemap: 'external',
    external: EXTERNALS,
});

// -------------------------------
// Tests

console.log('[ ESBUILD ] tests-browser.js');
esbuild.build({
    entryPoints: ['./test/index_browser.ts'],
    outfile: 'dist/tests-browser.js',
    platform: 'browser',
    format: 'iife',
    globalName: 'duckdb',
    target: TARGET,
    bundle: true,
    minify: true,
    sourcemap: 'both',
});

console.log('[ ESBUILD ] tests-node.js');
esbuild.build({
    entryPoints: ['./test/index_node.ts'],
    outfile: 'dist/tests-node.js',
    platform: 'node',
    format: 'cjs',
    target: TARGET,
    bundle: true,
    minify: true,
    sourcemap: 'external',
    // web-worker polyfill needs to be excluded from bundling due to their dynamic require messing with bundled modules
    external: [...EXTERNALS, 'web-worker'],
});

// -------------------------------
// Write declaration files

// ESM declarations
fs.writeFile(path.join(dist, 'duckdb.module.d.ts'), "export * from './types/src/';", printErr);
fs.writeFile(
    path.join(dist, 'duckdb-browser.module.d.ts'),
    "export * from './types/src/targets/duckdb-browser.module';",
    printErr,
);
fs.writeFile(
    path.join(dist, 'duckdb-node.module.d.ts'),
    "export * from './types/src/targets/duckdb-node.module';",
    printErr,
);

// Browser declarations
fs.writeFile(
    path.join(dist, 'duckdb-browser.d.ts'),
    "export * from './types/src/targets/duckdb-browser-serial';",
    printErr,
);
fs.writeFile(
    path.join(dist, 'duckdb-browser-parallel.d.ts'),
    "export * from './types/src/targets/duckdb-browser-parallel';",
    printErr,
);

// Node declarations
fs.writeFile(path.join(dist, 'duckdb-node.d.ts'), "export * from './types/src/targets/duckdb-node-serial';", printErr);
fs.writeFile(
    path.join(dist, 'duckdb-node-parallel.d.ts'),
    "export * from './types/src/targets/duckdb-node-parallel';",
    printErr,
);
