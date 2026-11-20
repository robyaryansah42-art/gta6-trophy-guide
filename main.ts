// Leonida Trophy Guide — the program that hands the guide in.
//
// The guide itself is app/: plain static files (app/index.html, its ES
// modules, styles and app/data/trophies.json) that a browser opens offline.
// This program, run by the grader in a sandbox with no network, copies
// app/ and screenshots/ beside this file into the output directory and
// writes dossier.json there with the vendored make.fun library — the
// summary the judge reads (screenshots, first-load bytes, source outline).
//
// vendor/makefun-frontend.ts is the kit's copy and stays untouched: the
// scorer rebuilds the dossier with its own identical copy and the two
// must match byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and try the guide itself with `node serve.ts` (http://localhost:8080).

import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const EXPECTED_TROPHIES = 55;

/** Fail loudly before copying anything when the trophy data is broken. */
async function checkTrophyData(): Promise<void> {
  const raw = await readFile(join(REPO_ROOT, 'app', 'data', 'trophies.json'), 'utf8');
  const doc = JSON.parse(raw) as { trophies?: Array<{ name?: unknown; guide?: unknown }> };
  if (!Array.isArray(doc.trophies) || doc.trophies.length !== EXPECTED_TROPHIES) {
    throw new Error(`trophies.json must hold ${EXPECTED_TROPHIES} trophies`);
  }
  for (const trophy of doc.trophies) {
    if (typeof trophy.name !== 'string' || trophy.name.length === 0) {
      throw new Error('a trophy in trophies.json has no name');
    }
    if (typeof trophy.guide !== 'string' || trophy.guide.trim().length === 0) {
      throw new Error(`trophy "${trophy.name}" has no guide`);
    }
  }
}

async function copyTree(source: string, target: string): Promise<void> {
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true });
}

async function main(): Promise<void> {
  await checkTrophyData();
  await mkdir(OUTPUT_DIR, { recursive: true });
  await copyTree(join(REPO_ROOT, 'app'), join(OUTPUT_DIR, 'app'));
  await mkdir(join(OUTPUT_DIR, 'screenshots'), { recursive: true });
  if (existsSync(join(REPO_ROOT, 'screenshots'))) {
    await copyTree(join(REPO_ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'));
  }
  // The gate's own caps (reference/gate.json): text_max_bytes shapes the
  // dossier's text; the rest refuse an entry the scorer would refuse
  // (more than 4 screenshots or one over 256 KiB; app/ past 993 entries
  // or 48 MiB — app/ shares /output's own 1000-entry cap with the
  // screenshots and dossier.json).
  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  await writeFile(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(
    `Leonida Trophy Guide: wrote app/ (${EXPECTED_TROPHIES} trophies), screenshots/ and dossier.json to ${OUTPUT_DIR}`,
  );
}

await main();
