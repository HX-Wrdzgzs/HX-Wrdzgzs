import { mkdir, writeFile } from 'node:fs/promises';

const login = process.env.GITHUB_REPOSITORY_OWNER || 'HX-Wrdzgzs';
const token = process.env.GITHUB_TOKEN;

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function loadStats() {
  if (process.env.PROFILE_STATS_JSON) {
    return JSON.parse(process.env.PROFILE_STATS_JSON);
  }

  if (!token) {
    throw new Error('GITHUB_TOKEN is required');
  }

  const to = new Date();
  const from = new Date(to.getTime() - 364 * 24 * 60 * 60 * 1000);
  const query = `
    query ProfileStats($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        followers {
          totalCount
        }
        repositories(
          first: 100
          ownerAffiliations: OWNER
          privacy: PUBLIC
          isFork: false
          orderBy: { field: UPDATED_AT, direction: DESC }
        ) {
          totalCount
          nodes {
            stargazerCount
          }
        }
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
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
      variables: {
        login,
        from: from.toISOString(),
        to: to.toISOString(),
      },
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
    throw new Error(`No public profile data returned for ${login}`);
  }

  return {
    stars: user.repositories.nodes.reduce(
      (sum, repository) => sum + (Number(repository.stargazerCount) || 0),
      0,
    ),
    repositories: Number(user.repositories.totalCount) || 0,
    followers: Number(user.followers.totalCount) || 0,
    commits: Number(contributions.totalCommitContributions) || 0,
    pullRequests: Number(contributions.totalPullRequestContributions) || 0,
    issues: Number(contributions.totalIssueContributions) || 0,
    reviews: Number(contributions.totalPullRequestReviewContributions) || 0,
  };
}

function formatNumber(value) {
  return Math.max(0, Number(value) || 0).toLocaleString('en-US');
}

function renderStatsSvg(stats, theme) {
  const dark = theme === 'dark';
  const width = 495;
  const height = 195;
  const background = dark ? '#0d1117' : '#ffffff';
  const border = dark ? '#30363d' : '#d0d7de';
  const title = dark ? '#58a6ff' : '#0969da';
  const text = dark ? '#e6edf3' : '#1f2328';
  const muted = dark ? '#8b949e' : '#656d76';
  const accent = dark ? '#3fb950' : '#1a7f37';
  const updated = new Date().toISOString().slice(0, 10);

  const items = [
    ['Total Stars', stats.stars],
    ['Commits', stats.commits],
    ['Pull Requests', stats.pullRequests],
    ['Issues', stats.issues],
    ['Code Reviews', stats.reviews],
    ['Public Repos', stats.repositories],
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
  <desc id="desc">Public GitHub statistics and contributions from the last 12 months.</desc>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${background}" stroke="${border}"/>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    .heading { font-size: 17px; font-weight: 600; fill: ${title}; }
    .subtitle { font-size: 11px; fill: ${muted}; }
    .label { font-size: 13px; fill: ${muted}; }
    .value { font-size: 14px; font-weight: 600; fill: ${text}; }
  </style>
  <text x="25" y="32" class="heading">${escapeXml(login)} GitHub Stats</text>
  <text x="25" y="53" class="subtitle">Public activity · Last 12 months · Updated ${updated}</text>
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
