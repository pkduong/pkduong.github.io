import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';

const require = createRequire(import.meta.url);
const chromeLauncher = require('chrome-launcher');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4371;
const origin = `http://127.0.0.1:${port}`;
const base = `${(process.env.BASE_PATH || '/ufo-data').replace(/\/+$/, '')}/`;
const urls = [
  `${origin}${base}`,
  `${origin}${base}ai/articles/best-practice-4-spec-driven-development/`,
  `${origin}${base}search/`,
];
const thresholds = {
  accessibility: 0.95,
  'best-practices': 0.9,
  seo: 0.9,
  // Content-heavy article routes sit near 0.83–0.90; keep a stable CI floor.
  performance: 0.8,
};

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}${base}`);
      if (response.ok) return;
    } catch {
      // Preview is still booting.
    }
    await delay(400);
  }
  throw new Error(`LIGHTHOUSE_SERVER_TIMEOUT: ${origin}${base}`);
}

function startPreview() {
  const child = spawn(
    process.execPath,
    [
      '--env-file=.env',
      './node_modules/astro/bin/astro.mjs',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    { cwd: root, stdio: 'pipe' },
  );
  child.stdout?.resume();
  child.stderr?.resume();
  return child;
}

const lighthouseFlags = {
  output: 'json',
  logLevel: 'error',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
};

function lighthouseConfig(cpuSlowdownMultiplier) {
  return {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 823,
        deviceScaleFactor: 1.75,
        disabled: false,
      },
      throttlingMethod: 'simulate',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        requestLatencyMs: 150 * 3.75,
        downloadThroughputKbps: 1638.4 * 0.9,
        uploadThroughputKbps: 675 * 0.9,
        cpuSlowdownMultiplier,
      },
    },
  };
}

async function main() {
  const preview = startPreview();
  let chrome;
  const failures = [];
  try {
    await waitForServer();
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });
    const probe = await lighthouse(
      urls[0],
      { port: chrome.port, ...lighthouseFlags },
      lighthouseConfig(4),
    );
    const benchmarkIndex = probe?.lhr.environment.benchmarkIndex ?? 1500;
    const cpuSlowdownMultiplier =
      benchmarkIndex < 1000
        ? Math.max(1, Number((4 * (benchmarkIndex / 1000)).toFixed(2)))
        : 4;
    console.log(
      `Lighthouse host benchmarkIndex=${benchmarkIndex}; cpuSlowdownMultiplier=${cpuSlowdownMultiplier}`,
    );

    for (const url of urls) {
      const result = await lighthouse(
        url,
        { port: chrome.port, ...lighthouseFlags },
        lighthouseConfig(cpuSlowdownMultiplier),
      );
      const categories = result?.lhr.categories ?? {};
      console.log(`AC-053 ${url}`);
      for (const [category, minimum] of Object.entries(thresholds)) {
        const score = categories[category]?.score;
        const display =
          typeof score === 'number' ? score.toFixed(2) : String(score);
        console.log(`  ${category}: ${display} (min ${minimum})`);
        if (typeof score !== 'number' || score < minimum) {
          failures.push(`${url} ${category}=${display} < ${minimum}`);
        }
      }
    }
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch {
        // Windows chrome-launcher is flaky about process teardown.
      }
    }
    preview.kill('SIGTERM');
  }

  if (failures.length) {
    console.error(`LIGHTHOUSE_THRESHOLD:\n${failures.join('\n')}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    'Lighthouse category thresholds passed for representative routes.',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
