const fs = require("fs");

const login = "Soumyajitttt";
const query = `query($login: String!) {
  user(login: $login) {
    issueComments { totalCount }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestReviewContributions
      totalPullRequestContributions
      totalIssueContributions
      contributionCalendar { totalContributions }
    }
  }
}`;

const GITHUB_LOGO =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

(async () => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GH_STATS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const json = await res.json();
  if (!json.data) throw new Error(JSON.stringify(json));

  const u = json.data.user;
  const c = u.contributionsCollection;
  const total = c.contributionCalendar.totalContributions;
  const rows = [
    ["Commits", c.totalCommitContributions],
    ["Pull requests reviewed", c.totalPullRequestReviewContributions],
    ["Pull requests opened", c.totalPullRequestContributions],
    ["Issues opened", c.totalIssueContributions],
    ["Issue comments", u.issueComments.totalCount],
  ];

  const lines = rows
    .map(
      ([label, val], i) =>
        `<text x="140" y="${72 + i * 21}" fill="#54dfc4" font-size="14">${label}</text>` +
        `<text x="400" y="${72 + i * 21}" fill="#f6d34e" font-size="14" text-anchor="end" font-weight="600">${val}</text>`
    )
    .join("\n  ");

  // ring: commits' share of total shown as the highlighted arc
  const r = 34;
  const circ = 2 * Math.PI * r;
  const share = total ? Math.min(c.totalCommitContributions / total, 1) : 0;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="170" viewBox="0 0 420 170" font-family="Segoe UI, Ubuntu, sans-serif">
  <rect width="420" height="170" rx="6" fill="#0D1117"/>
  <path transform="translate(20,14) scale(1.5)" fill="#ffffff" d="${GITHUB_LOGO}"/>
  <text x="54" y="32" fill="#ffffff" font-size="18" font-weight="600">${login}</text>
  <circle cx="64" cy="116" r="${r}" fill="none" stroke="#2a2f38" stroke-width="5"/>
  <circle cx="64" cy="116" r="${r}" fill="none" stroke="#54dfc4" stroke-width="5" stroke-linecap="round"
    stroke-dasharray="${(circ * share).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 64 116)"/>
  <text x="64" y="118" fill="#ffffff" font-size="${String(total).length > 3 ? 20 : 24}" font-weight="600" text-anchor="middle">${total}</text>
  <text x="64" y="132" fill="#8b949e" font-size="9" text-anchor="middle">contributions</text>
  ${lines}
</svg>`;

  fs.writeFileSync("activity.svg", svg);
})();
