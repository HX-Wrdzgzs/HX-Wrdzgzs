import { mkdir, writeFile } from 'node:fs/promises';

const login = process.env.GITHUB_REPOSITORY_OWNER || 'HX-Wrdzgzs';
const profileToken = process.env.PROFILE_STATS_TOKEN || '';
const token = profileToken || process.env.GITHUB_TOKEN;
const organizations = (process.env.PROFILE_ORGANIZATIONS || 'Amia-Mizuki-Dev-Team')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const trackedOwners = new Set([login, ...organizations]);

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
    if (!Array.isArray(batch)) {
      throw new Error('GitHub repository list returned an unexpected payload');
    }
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

async function loadTrackedRepositories() {
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
    const fullName = repository?.full_name;
    if (!owner || !fullName || repository.fork || !trackedOwners.has(owner) || seen.has(fullName)) {
      return false;
    }
    seen.add(fullName);
    return true;
  });
}

async function loadContributionCounts() {
  if (!token) {
    throw new Error('PROFILE_STATS_TOKEN or GITHUB_TOKEN is required');
  }

  const to = new Date();
  const from = new Date(to.getTime() - 364 * 24 * 60 * 60 * 1000);
  const query = `
    query ProfileStats($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        followers { totalCount }
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          restrictedContributionsCount
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': `${login}-profile-assets`,
    },
    body: JSON.stringify({
      query,
      variables: { login, from: from.toISOString(), to: to.toISOString() },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((item) => item.message).join('; '));
  }

  const user = payload.data?.user;
  const contributions = user?.contributionsCollection;
  if (!user || !contributions) {
    throw new Error(`No contribution data returned for ${login}`);
  }

  return {
    followers: Number(user.followers.totalCount) || 0,
    commits: Number(contributions.totalCommitContributions) || 0,
    pullRequests: Number(contributions.totalPullRequestContributions) || 0,
    issues: Number(contributions.totalIssueContributions) || 0,
    reviews: Number(contributions.totalPullRequestReviewContributions) || 0,
    restricted: Number(contributions.restrictedContributionsCount) || 0,
  };
}

async function loadStats() {
  if (process.env.PROFILE_STATS_JSON) {
    return JSON.parse(process.env.PROFILE_STATS_JSON);
  }

  const [repositories, contributions] = await Promise.all([
    loadTrackedRepositories(),
    loadContributionCounts(),
  ]);

  const publicRepositories = repositories.filter((repository) => !repository.private);
  const privateRepositories = repositories.filter((repository) => repository.private);

  return {
    stars: publicRepositories.reduce(
      (sum, repository) => sum + (Number(repository.stargazers_count) || 0),
      0,
    ),
    repositories: repositories.length,
    publicRepositories: publicRepositories.length,
    privateRepositories: privateRepositories.length,
    privateAccess: Boolean(profileToken),
    ...contributions,
  };
}

function formatNumber(value) {
  return Math.max(0, Number(value) || 0).toLocaleString('en-US');
}

function renderStatsSvg(stats, theme) {
  const dark = theme === 'dark';
  const width = 495;
  const height = 229;
  const background = dark ? '#0d1117' : '#ffffff';
  const border = dark ? '#30363d' : '#d0d7de';
  const title = dark ? '#58a6ff' : '#0969da';
  const text = dark ? '#e6edf3' : '#1f2328';
  const muted = dark ? '#8b949e' : '#656d76';
  const accent = dark ? '#3fb950' : '#1a7f37';
  const updated = new Date().toISOString().slice(0, 10);
  const scope = stats.privateAccess ? 'Public + accessible private' : 'Public fallback';

  const items = [
    ['Total Stars', stats.stars],
    ['Commits', stats.commits],
    ['Pull Requests', stats.pullRequests],
    ['Issues', stats.issues],
    ['Code Reviews', stats.reviews],
    ['Tracked Repos', stats.repositories],
    ['Public Repos', stats.publicRepositories],
    ['Private Repos', stats.privateRepositories],
  ];

  const rows = items
    .map(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column === 0 ? 32 : 270;
      const y = 90 + row * 34;
      return `
        <circle cx="${x}" cy="${y - 5}" r="4" fill="${accent}"/>
        <text x="${x + 13}" y="${y}" class="label">${escapeXml(label)}:</text>
        <text x="${column === 0 ? 224 : 463}" y="${y}" text-anchor="end" class="value">${escapeXml(formatNumber(value))}</text>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(login)} GitHub stats</title>
  <desc id="desc">GitHub contribution statistics and tracked repository totals. Private repository names are never rendered.</desc>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${background}" stroke="${border}"/>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    .heading { font-size: 17px; font-weight: 600; fill: ${title}; }
    .subtitle { font-size: 11px; fill: ${muted}; }
    .label { font-size: 13px; fill: ${muted}; }
    .value { font-size: 14px; font-weight: 600; fill: ${text}; }
  </style>
  <text x="25" y="32" class="heading">${escapeXml(login)} GitHub Stats</text>
  <text x="25" y="53" class="subtitle">${escapeXml(scope)} · Last 12 months · Updated ${updated}</text>
  ${rows}
</svg>
`;
}

const stats = await loadStats();
await mkdir('dist', { recursive: true });
await Promise.all([
  writeFile('dist/github-stats.svg', renderStatsSvg(stats, 'light'), 'utf8'),
  writeFile('dist/github-stats-dark.svg', renderStatsSvg(stats, 'dark'), 'utf8'),
]);

console.log(JSON.stringify({ login, ...stats }, null, 2));
