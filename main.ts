// Leonida Trophy Guide — gta6-trophy-guide-02 entry (Node 22, standard library only).
//
// The guide itself is plain static files under app/: index.html opens in a browser,
// app.js renders the 55 trophies from app/data/trophies.json, and nothing is fetched
// over the network, so it works fully offline. This program hands the entry in: it
// copies app/ and screenshots/ from beside this file into the output directory and
// writes /output/dossier.json with buildDossier from the vendored make.fun library.
// vendor/makefun-frontend.ts is the kit's copy and must stay unchanged — the scorer
// rebuilds the dossier with its own copy and compares the two byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps from the gate: at most 4 screenshots of 256 KiB each, app/ at most 993 files
// and directories and 48 MiB, and the dossier text at most 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
