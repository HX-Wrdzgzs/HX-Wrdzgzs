import { mkdir, writeFile } from 'node:fs/promises';

const login = process.env.GITHUB_REPOSITORY_OWNER || 'HX-Wrdzgzs';
const profileToken = process.env.PROFILE_STATS_TOKEN || '';
const token = profileToken || process.env.GITHUB_TOKEN;
const organizations = (process.env.PROFILE_ORGANIZATIONS || 'Amia-Mizuki-Dev-Team')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const trackedOwners = new Set([login, ...organizations]);
const excludedRepos = new Set(
  (process.env.PROFILE_EXCLUDE_REPOS || 'Gensokyo-NewQQ')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

const languageColors = {
  Python: '#3572A5',
  TypeScript: '#3178C6',
  JavaScript: '#f1e05a',
  Kotlin: '#A97BFF',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  PowerShell: '#012456',
  Vue: '#41b883',
  Rust: '#dea584',
  Go: '#00ADD8',
  Swift: '#F05138',
  Dart: '#00B4AB',
  Ruby: '#701516',
};

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function githubRequest(url, authToken = token) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      'x-github-api-version': '2022-11-28',
      'user-agent': `${login}-profile-assets`,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${response.statusText} (${url})`);
  }

  return response.json();
}

async function listPaged(urlFactory, authToken = token) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const batch = await githubRequest(urlFactory(page), authToken);
    if (!Array.isArray(batch)) throw new Error('Unexpected repository list payload');
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

async function loadRepositories() {
  let repositories;

  if (profileToken) {
    repositories = await listPaged(
      (page) =>
        `https://api.github.com/user/repos?visibility=all&affiliation=owner,organization_member,collaborator&sort=updated&per_page=100&page=${page}`,
      profileToken,
    );
  } else {
    const personal = await listPaged(
      (page) => `https://api.github.com/users/${encodeURIComponent(login)}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
    );
    const orgLists = await Promise.all(
      organizations.map((org) =>
        listPaged(
          (page) => `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?type=all&sort=updated&per_page=100&page=${page}`,
        ),
      ),
    );
    repositories = [...personal, ...orgLists.flat()];
  }

  const seen = new Set();
  return repositories.filter((repository) => {
    const owner = repository?.owner?.login;
    const name = repository?.name;
    const fullName = repository?.full_name;
    if (
      !owner ||
      !name ||
      !fullName ||
      repository.fork ||
      !trackedOwners.has(owner) ||
      excludedRepos.has(name) ||
      excludedRepos.has(fullName) ||
      seen.has(fullName)
    ) {
      return false;
    }
    seen.add(fullName);
    return true;
  });
}

async function loadLanguageTotals(repositories) {
  const totals = new Map();
  const repoCounts = new Map();
  const batchSize = 6;

  for (let index = 0; index < repositories.length; index += batchSize) {
    const batch = repositories.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map(async (repository) => {
        const owner = encodeURIComponent(repository.owner.login);
        const name = encodeURIComponent(repository.name);
        const languages = await githubRequest(`https://api.github.com/repos/${owner}/${name}/languages`);
        return { languages };
      }),
    );

    for (const { languages } of results) {
      for (const [language, bytes] of Object.entries(languages || {})) {
        const size = Math.max(0, Number(bytes) || 0);
        if (!size) continue;
        totals.set(language, (totals.get(language) || 0) + size);
        repoCounts.set(language, (repoCounts.get(language) || 0) + 1);
      }
    }
  }

  const totalBytes = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([language, bytes]) => ({
      language,
      bytes,
      repositories: repoCounts.get(language) || 0,
      percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes || b.repositories - a.repositories || a.language.localeCompare(b.language))
    .slice(0, 8);
}

function fallbackColor(index, dark) {
  const light = ['#0969da', '#1a7f37', '#8250df', '#bf8700', '#cf222e', '#0550ae', '#116329', '#953800'];
  const darkPalette = ['#58a6ff', '#3fb950', '#a371f7', '#d29922', '#f85149', '#79c0ff', '#56d364', '#ffa657'];
  const palette = dark ? darkPalette : light;
  return palette[index % palette.length];
}

function renderSvg(languages, repositoryCount, privateCount, theme) {
  const dark = theme === 'dark';
  const width = 495;
  const height = 229;
  const background = dark ? '#0d1117' : '#ffffff';
  const border = dark ? '#30363d' : '#d0d7de';
  const title = dark ? '#58a6ff' : '#0969da';
  const text = dark ? '#e6edf3' : '#1f2328';
  const muted = dark ? '#8b949e' : '#656d76';
  const track = dark ? '#21262d' : '#eaeef2';
  const updated = new Date().toISOString().slice(0, 10);
  const scope = profileToken
    ? `${repositoryCount} tracked repos · ${privateCount} private`
    : `${repositoryCount} public tracked repos`;

  const entries = languages.length
    ? languages
        .map((item, index) => {
          const column = index % 2;
          const row = Math.floor(index / 2);
          const x = column === 0 ? 26 : 270;
          const barWidth = 190;
          const y = 88 + row * 34;
          const fill = languageColors[item.language] || fallbackColor(index, dark);
          const filled = Math.max(item.percentage > 0 ? 3 : 0, Math.min(barWidth, (item.percentage / 100) * barWidth));
          return `
    <text x="${x}" y="${y}" class="label">${escapeXml(item.language)}</text>
    <text x="${x + barWidth}" y="${y}" text-anchor="end" class="value">${item.percentage.toFixed(1)}%</text>
    <rect x="${x}" y="${y + 8}" width="${barWidth}" height="5" rx="2.5" fill="${track}"/>
    <rect x="${x}" y="${y + 8}" width="${filled.toFixed(1)}" height="5" rx="2.5" fill="${fill}"/>`;
        })
        .join('')
    : `<text x="25" y="110" class="label">No language data available.</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Tracked repository languages</title>
  <desc id="desc">Language byte distribution across tracked personal and organization repositories. This is repository composition, not authorship attribution.</desc>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${background}" stroke="${border}"/>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    .heading { font-size: 17px; font-weight: 600; fill: ${title}; }
    .subtitle { font-size: 11px; fill: ${muted}; }
    .label { font-size: 12px; fill: ${muted}; }
    .value { font-size: 12px; font-weight: 600; fill: ${text}; }
  </style>
  <text x="25" y="32" class="heading">Repository Languages</text>
  <text x="25" y="53" class="subtitle">${escapeXml(scope)} · Updated ${updated}</text>
  ${entries}
</svg>
`;
}

const repositories = await loadRepositories();
const languages = await loadLanguageTotals(repositories);
const privateCount = repositories.filter((repository) => repository.private).length;

await mkdir('dist', { recursive: true });
await Promise.all([
  writeFile('dist/top-langs.svg', renderSvg(languages, repositories.length, privateCount, 'light'), 'utf8'),
  writeFile('dist/top-langs-dark.svg', renderSvg(languages, repositories.length, privateCount, 'dark'), 'utf8'),
]);

console.log(JSON.stringify({
  login,
  repositories: repositories.length,
  privateRepositories: privateCount,
  languages: languages.map(({ language, percentage }) => ({ language, percentage: Number(percentage.toFixed(2)) })),
}, null, 2));
