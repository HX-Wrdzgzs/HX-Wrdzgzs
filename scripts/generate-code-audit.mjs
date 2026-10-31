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
  (process.env.PROFILE_AUDIT_EXCLUDE_REPOS || 'Amia-Backup')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);
const excludedCommits = new Set([
  'HX-Wrdzgzs/uv-k5-losehu132-wrdzgzs:ee983a062871e414ee06f7d3b51c72d768b6dd91',
  'HX-Wrdzgzs/Gensokyo-NewQQ:311c0dfae3d00c9cd0295d5e1d834059b4f6216a',
]);

const languageByExtension = {
  py: 'Python', pyi: 'Python',
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript',
  kt: 'Kotlin', kts: 'Kotlin', java: 'Java',
  cs: 'C#', go: 'Go', rs: 'Rust',
  c: 'C', h: 'C', cc: 'C++', cpp: 'C++', cxx: 'C++', hh: 'C++', hpp: 'C++', hxx: 'C++',
  sh: 'Shell', bash: 'Shell', zsh: 'Shell', ps1: 'PowerShell',
  sql: 'SQL', rb: 'Ruby', php: 'PHP', swift: 'Swift', dart: 'Dart',
  lua: 'Lua', vue: 'Vue', svelte: 'Svelte', astro: 'Astro',
  ex: 'Elixir', exs: 'Elixir', scala: 'Scala', groovy: 'Groovy',
  pl: 'Perl', hs: 'Haskell', fs: 'F#', fsx: 'F#', vb: 'Visual Basic',
};

const excludedPathSegments = new Set([
  '.git', 'node_modules', 'vendor', 'third_party', 'third-party',
  'dist', 'build', 'out', 'target', 'coverage', '.next', '.nuxt',
  '.output', '.cache', '__pycache__', '.venv', 'venv', 'site-packages',
  'generated', 'release',
]);

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function githubRequest(url, attempt = 0) {
  if (!token) throw new Error('PROFILE_STATS_TOKEN or GITHUB_TOKEN is required');
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: 'Bearer ' + token,
      'x-github-api-version': '2022-11-28',
      'user-agent': login + '-profile-code-audit',
    },
  });

  if ((response.status === 403 || response.status === 429) && attempt < 4) {
    const retryAfter = Number(response.headers.get('retry-after')) || 3;
    await new Promise((resolve) => setTimeout(resolve, Math.max(3, retryAfter) * 1000));
    return githubRequest(url, attempt + 1);
  }

  if (!response.ok) {
    throw new Error('GitHub request failed: ' + response.status + ' ' + response.statusText + ' (' + url + ')');
  }
  return response.json();
}

async function listPaged(urlFactory) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const batch = await githubRequest(urlFactory(page));
    if (!Array.isArray(batch)) throw new Error('Unexpected paginated GitHub response');
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

async function loadRepositories() {
  let repositories;
  if (profileToken) {
    repositories = await listPaged((page) =>
      'https://api.github.com/user/repos?visibility=all&affiliation=owner,organization_member,collaborator&sort=updated&per_page=100&page=' + page,
    );
  } else {
    const personal = await listPaged((page) =>
      'https://api.github.com/users/' + encodeURIComponent(login) + '/repos?type=owner&sort=updated&per_page=100&page=' + page,
    );
    const orgLists = await Promise.all(organizations.map((org) =>
      listPaged((page) =>
        'https://api.github.com/orgs/' + encodeURIComponent(org) + '/repos?type=all&sort=updated&per_page=100&page=' + page,
      ),
    ));
    repositories = [...personal, ...orgLists.flat()];
  }

  const seen = new Set();
  return repositories.filter((repository) => {
    const owner = repository?.owner?.login;
    const fullName = repository?.full_name;
    const name = repository?.name;
    if (
      !owner ||
      !fullName ||
      !name ||
      !trackedOwners.has(owner) ||
      excludedRepos.has(name) ||
      excludedRepos.has(fullName) ||
      seen.has(fullName)
    ) return false;
    seen.add(fullName);
    return true;
  });
}

function languageForFile(filename) {
  const lower = filename.toLowerCase();
  const segments = lower.split('/');
  if (segments.some((segment) => excludedPathSegments.has(segment))) return null;
  if (
    lower.endsWith('.min.js') ||
    lower.endsWith('.bundle.js') ||
    lower.endsWith('.map') ||
    lower.endsWith('.snap') ||
    lower.includes('.generated.') ||
    /(^|\/)[^/]*_pb2(_grpc)?\.py$/.test(lower)
  ) return null;
  const extension = lower.includes('.') ? lower.split('.').pop() : '';
  return languageByExtension[extension] || null;
}

function shouldSkipCommit(repository, commit) {
  const key = repository.full_name + ':' + commit.sha;
  if (excludedCommits.has(key)) return true;
  const message = commit.commit?.message || '';
  if (/\b(sync|merge)\s+upstream\b/i.test(message)) return true;
  return false;
}

async function loadAuthoredCommits(repositories) {
  const tasks = [];
  let excludedCommitCount = 0;
  let emptyRepositoryCount = 0;

  for (const repository of repositories) {
    let commits;
    try {
      commits = await listPaged((page) =>
        'https://api.github.com/repos/' + repository.full_name +
        '/commits?author=' + encodeURIComponent(login) + '&per_page=100&page=' + page,
      );
    } catch (error) {
      if (String(error).includes('409 Conflict')) {
        emptyRepositoryCount += 1;
        continue;
      }
      throw error;
    }

    for (const commit of commits) {
      const authorLogin = commit.author?.login;
      const authorName = commit.commit?.author?.name;
      if (authorLogin !== login && authorName !== login) continue;
      if (shouldSkipCommit(repository, commit)) {
        excludedCommitCount += 1;
        continue;
      }
      tasks.push({ repository, sha: commit.sha });
    }
  }

  return { tasks, excludedCommitCount, emptyRepositoryCount };
}

async function mapBatches(items, batchSize, mapper) {
  const results = [];
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    results.push(...await Promise.all(batch.map(mapper)));
  }
  return results;
}

async function inspectCommit(task) {
  const url = 'https://api.github.com/repos/' + task.repository.full_name + '/commits/' + task.sha;
  const detail = await githubRequest(url);
  if ((detail.parents || []).length > 1) {
    return { skippedMerge: true, files: [] };
  }

  const files = [];
  for (const file of detail.files || []) {
    if (
      task.repository.full_name === 'HX-Wrdzgzs/HX-Wrdzgzs' &&
      file.filename === 'scripts/generate-code-audit.mjs'
    ) continue;
    const language = languageForFile(file.filename || '');
    if (!language) continue;
    files.push({
      language,
      filename: file.filename,
      additions: Number(file.additions) || 0,
      deletions: Number(file.deletions) || 0,
    });
  }

  return { skippedMerge: false, files };
}

function renderSvg(report) {
  const width = 760;
  const height = 330;
  const top = report.languages.slice(0, 8);
  const max = Math.max(1, ...top.map((item) => item.additions));
  const rows = top.map((item, index) => {
    const y = 112 + index * 25;
    const bar = Math.max(2, Math.round((item.additions / max) * 300));
    return [
      '<text x="32" y="' + y + '" class="label">' + escapeXml(item.language) + '</text>',
      '<rect x="150" y="' + (y - 11) + '" width="300" height="9" rx="4" fill="#21262d"/>',
      '<rect x="150" y="' + (y - 11) + '" width="' + bar + '" height="9" rx="4" fill="#58a6ff"/>',
      '<text x="470" y="' + y + '" class="value">' + item.additions.toLocaleString('en-US') + '</text>',
    ].join('');
  }).join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-labelledby="title desc">',
    '<title id="title">Author-attributed code changes</title>',
    '<desc id="desc">Cumulative source-code line additions in commits authored by ' + escapeXml(login) + '.</desc>',
    '<rect x="0.5" y="0.5" width="' + (width - 1) + '" height="' + (height - 1) + '" rx="12" fill="#0d1117" stroke="#30363d"/>',
    '<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}.title{font-size:17px;font-weight:600;fill:#e6edf3}.sub{font-size:11px;fill:#8b949e}.label{font-size:12px;fill:#c9d1d9}.value{font-size:12px;font-weight:600;fill:#e6edf3}</style>',
    '<text x="32" y="35" class="title">Code authored through Git commits</text>',
    '<text x="32" y="56" class="sub">' + escapeXml(report.scope) + ' · Updated ' + escapeXml(report.generatedAt.slice(0, 10)) + '</text>',
    '<text x="32" y="84" class="value">' + report.additions.toLocaleString('en-US') + ' lines added</text>',
    '<text x="260" y="84" class="sub">' + report.deletions.toLocaleString('en-US') + ' removed · ' + report.net.toLocaleString('en-US') + ' net</text>',
    rows || '<text x="32" y="120" class="label">No authored source-code changes found.</text>',
    '<text x="32" y="310" class="sub">' + report.commitCount + ' commits · ' + report.repositoryCount + ' repositories · ' + report.fileCount + ' distinct files</text>',
    '</svg>',
  ].join('\n');
}

const repositories = await loadRepositories();
const { tasks, excludedCommitCount, emptyRepositoryCount } = await loadAuthoredCommits(repositories);
const seenCommits = new Set();
const uniqueTasks = tasks.filter((task) => {
  if (seenCommits.has(task.sha)) return false;
  seenCommits.add(task.sha);
  return true;
});

const inspected = await mapBatches(uniqueTasks, 6, async (task) => {
  try {
    return { task, result: await inspectCommit(task) };
  } catch (error) {
    return { task, error: String(error) };
  }
});

const totals = new Map();
const repoSet = new Set();
const commitSet = new Set();
const fileSet = new Set();
let additions = 0;
let deletions = 0;
let mergeCommitCount = 0;
let failedCommitCount = 0;

for (const item of inspected) {
  if (item.error) {
    failedCommitCount += 1;
    continue;
  }
  if (item.result.skippedMerge) {
    mergeCommitCount += 1;
    continue;
  }

  let hasCode = false;
  for (const file of item.result.files) {
    hasCode = true;
    additions += file.additions;
    deletions += file.deletions;
    fileSet.add(item.task.repository.full_name + ':' + file.filename);

    const current = totals.get(file.language) || { language: file.language, additions: 0, deletions: 0 };
    current.additions += file.additions;
    current.deletions += file.deletions;
    totals.set(file.language, current);
  }

  if (hasCode) {
    repoSet.add(item.task.repository.full_name);
    commitSet.add(item.task.sha);
  }
}

const languages = [...totals.values()]
  .map((item) => ({ ...item, net: item.additions - item.deletions }))
  .sort((a, b) => b.additions - a.additions || a.language.localeCompare(b.language));

const report = {
  generatedAt: new Date().toISOString(),
  account: login,
  scope: profileToken ? 'Personal + accessible organization repositories' : 'Public personal + organization repositories',
  trackedRepositoryCount: repositories.length,
  repositoryCount: repoSet.size,
  commitCount: commitSet.size,
  fileCount: fileSet.size,
  additions,
  deletions,
  net: additions - deletions,
  excludedRepositoryCount: excludedRepos.size,
  excludedCommitCount,
  emptyRepositoryCount,
  skippedMergeCommitCount: mergeCommitCount,
  failedCommitFetchCount: failedCommitCount,
  languages,
  notes: [
    'Counts additions and deletions in source-code files from commits attributed by GitHub to this account.',
    'This is cumulative commit activity, not the number of lines currently present in repositories.',
    'Backup snapshots, generated/dependency directories, upstream-sync commits, merge commits, and the imported UV-K5 baseline are excluded.',
    'Forked repositories are included only for commits authored by this account; upstream code is not attributed to this account.',
    'The audit generator itself is excluded from the totals.',
  ],
};

await mkdir('dist', { recursive: true });
await Promise.all([
  writeFile('dist/code-audit.json', JSON.stringify(report, null, 2) + '\n', 'utf8'),
  writeFile('dist/code-audit.svg', renderSvg(report), 'utf8'),
]);

console.log(JSON.stringify({
  account: report.account,
  scope: report.scope,
  trackedRepositories: report.trackedRepositoryCount,
  repositoriesWithCodeChanges: report.repositoryCount,
  authoredCodeCommits: report.commitCount,
  distinctSourceFiles: report.fileCount,
  additions: report.additions,
  deletions: report.deletions,
  net: report.net,
  languages: report.languages,
  excludedRepositoryCount: report.excludedRepositoryCount,
  excludedCommitCount: report.excludedCommitCount,
  emptyRepositoryCount: report.emptyRepositoryCount,
  skippedMergeCommitCount: report.skippedMergeCommitCount,
  failedCommitFetchCount: report.failedCommitFetchCount,
}, null, 2));
