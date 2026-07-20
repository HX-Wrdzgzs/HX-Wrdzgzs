import { mkdir, writeFile } from 'node:fs/promises';

const login = process.env.GITHUB_REPOSITORY_OWNER || 'HX-Wrdzgzs';
const token = process.env.GITHUB_TOKEN;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function loadCounts() {
  if (process.env.ACTIVITY_DATA_JSON) {
    return JSON.parse(process.env.ACTIVITY_DATA_JSON);
  }

  if (!token) {
    throw new Error('GITHUB_TOKEN is required');
  }

  const to = new Date();
  const from = new Date(to.getTime() - 364 * 24 * 60 * 60 * 1000);
  const query = `
    query ActivityOverview($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
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

  const collection = payload.data?.user?.contributionsCollection;
  if (!collection) {
    throw new Error(`No contribution data returned for ${login}`);
  }

  return {
    commits: collection.totalCommitContributions,
    issues: collection.totalIssueContributions,
    pullRequests: collection.totalPullRequestContributions,
    reviews: collection.totalPullRequestReviewContributions,
    restricted: collection.restrictedContributionsCount,
  };
}

function calculateMetrics(counts) {
  const normalized = {
    commits: Math.max(0, Number(counts.commits) || 0),
    issues: Math.max(0, Number(counts.issues) || 0),
    pullRequests: Math.max(0, Number(counts.pullRequests) || 0),
    reviews: Math.max(0, Number(counts.reviews) || 0),
    restricted: Math.max(0, Number(counts.restricted) || 0),
  };

  const total = normalized.commits + normalized.issues + normalized.pullRequests + normalized.reviews;
  const percentage = (value) => (total === 0 ? 0 : Math.round((value / total) * 100));

  return {
    ...normalized,
    total,
    percentages: {
      commits: percentage(normalized.commits),
      issues: percentage(normalized.issues),
      pullRequests: percentage(normalized.pullRequests),
      reviews: percentage(normalized.reviews),
    },
  };
}

function renderSvg(metrics, theme) {
  const dark = theme === 'dark';
  const width = 760;
  const height = 330;
  const centerX = 380;
  const centerY = 180;
  const axisX = 145;
  const axisY = 80;
  const accent = dark ? '#57d17d' : '#1f883d';
  const text = dark ? '#e6edf3' : '#1f2328';
  const muted = dark ? '#8b949e' : '#656d76';
  const background = dark ? '#0d1117' : '#ffffff';
  const border = dark ? '#30363d' : '#d0d7de';
  const centerFill = dark ? '#161b22' : '#ffffff';

  const pointOffset = (percentage, length) => {
    if (percentage <= 0) return 0;
    return clamp((percentage / 100) * length, 5, length);
  };

  const commitX = centerX - pointOffset(metrics.percentages.commits, axisX);
  const issueX = centerX + pointOffset(metrics.percentages.issues, axisX);
  const reviewY = centerY - pointOffset(metrics.percentages.reviews, axisY);
  const prY = centerY + pointOffset(metrics.percentages.pullRequests, axisY);
  const updated = new Date().toISOString().slice(0, 10);

  const marker = (x, y) => `
    <circle cx="${x}" cy="${y}" r="5" fill="${centerFill}" stroke="${accent}" stroke-width="3"/>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(login)} public activity overview</title>
  <desc id="desc">Last 12 months: ${metrics.commits} commits, ${metrics.issues} issues, ${metrics.pullRequests} pull requests and ${metrics.reviews} code reviews.</desc>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${background}" stroke="${border}"/>

  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    .title { font-size: 17px; font-weight: 600; fill: ${text}; }
    .subtitle { font-size: 12px; fill: ${muted}; }
    .percent { font-size: 15px; font-weight: 600; fill: ${text}; }
    .label { font-size: 14px; fill: ${muted}; }
    .count { font-size: 12px; fill: ${muted}; }
  </style>

  <text x="28" y="35" class="title">Activity overview</text>
  <text x="28" y="56" class="subtitle">Public contributions · Last 12 months · Updated ${updated}</text>

  <line x1="${centerX - axisX}" y1="${centerY}" x2="${centerX + axisX}" y2="${centerY}" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
  <line x1="${centerX}" y1="${centerY - axisY}" x2="${centerX}" y2="${centerY + axisY}" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>

  ${marker(commitX, centerY)}
  ${marker(issueX, centerY)}
  ${marker(centerX, reviewY)}
  ${marker(centerX, prY)}
  <circle cx="${centerX}" cy="${centerY}" r="6" fill="${centerFill}" stroke="${accent}" stroke-width="3"/>

  <text x="${centerX - axisX - 20}" y="${centerY - 8}" text-anchor="end" class="percent">${metrics.percentages.commits}%</text>
  <text x="${centerX - axisX - 20}" y="${centerY + 13}" text-anchor="end" class="label">Commits</text>
  <text x="${centerX - axisX - 20}" y="${centerY + 32}" text-anchor="end" class="count">${metrics.commits.toLocaleString('en-US')}</text>

  <text x="${centerX + axisX + 20}" y="${centerY - 8}" class="percent">${metrics.percentages.issues}%</text>
  <text x="${centerX + axisX + 20}" y="${centerY + 13}" class="label">Issues</text>
  <text x="${centerX + axisX + 20}" y="${centerY + 32}" class="count">${metrics.issues.toLocaleString('en-US')}</text>

  <text x="${centerX}" y="${centerY - axisY - 31}" text-anchor="middle" class="percent">${metrics.percentages.reviews}%</text>
  <text x="${centerX}" y="${centerY - axisY - 11}" text-anchor="middle" class="label">Code reviews</text>
  <text x="${centerX}" y="${centerY - axisY + 8}" text-anchor="middle" class="count">${metrics.reviews.toLocaleString('en-US')}</text>

  <text x="${centerX}" y="${centerY + axisY + 25}" text-anchor="middle" class="percent">${metrics.percentages.pullRequests}%</text>
  <text x="${centerX}" y="${centerY + axisY + 45}" text-anchor="middle" class="label">Pull requests</text>
  <text x="${centerX}" y="${centerY + axisY + 64}" text-anchor="middle" class="count">${metrics.pullRequests.toLocaleString('en-US')}</text>

  ${metrics.restricted > 0 ? `<text x="732" y="318" text-anchor="end" class="subtitle">${metrics.restricted.toLocaleString('en-US')} restricted contributions not categorized</text>` : ''}
</svg>
`;
}

const counts = await loadCounts();
const metrics = calculateMetrics(counts);
await mkdir('dist', { recursive: true });
await Promise.all([
  writeFile('dist/activity-overview.svg', renderSvg(metrics, 'light'), 'utf8'),
  writeFile('dist/activity-overview-dark.svg', renderSvg(metrics, 'dark'), 'utf8'),
]);

console.log(JSON.stringify({ login, ...metrics }, null, 2));
