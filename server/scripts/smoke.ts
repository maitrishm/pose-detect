async function main() {
  const base = process.env.SMOKE_BASE_URL || 'http://localhost:3001/api';
  const url = base.replace(/\/$/, '') + '/health';
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 5000);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(to);
  if (!res.ok) {
    console.error('Smoke health non-200', res.status);
    process.exit(1);
  }
  const json = await res.json();
  if (!json.ok) {
    console.error('Smoke JSON missing ok flag');
    process.exit(1);
  }
  console.log('Smoke OK', json);
}

main().catch((e) => {
  console.error('Smoke failed', e);
  process.exit(1);
});
