import fs from "node:fs";

const token = process.env.GH_TOKEN;
const user = process.env.GH_USER;

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestReviewContributions
    }
    pullRequests { totalCount }
    issues { totalCount }
    issueComments { totalCount }
  }
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: { login: user } }),
});
const json = await res.json();
if (!json.data || !json.data.user) throw new Error(JSON.stringify(json));

const u = json.data.user;
const c = u.contributionsCollection;

const tile = (x, y, w, label, value, color, delay) => `
  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="0.6s" begin="${delay}s" fill="freeze"/>
    <rect x="${x}" y="${y}" width="${w}" height="64" rx="10" fill="#161B22" stroke="#30363d"/>
    <rect x="${x}" y="${y + 14}" width="4" height="36" rx="2" fill="${color}"/>
    <text x="${x + 20}" y="${y + 34}" font-size="24" font-weight="700" fill="${color}">${value}</text>
    <text x="${x + 20}" y="${y + 53}" font-size="12" fill="#8b949e">${label}</text>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220" font-family="Segoe UI, Ubuntu, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0D1117"/>
      <stop offset="1" stop-color="#111a24"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#54dfc4"/>
      <stop offset="1" stop-color="#f6d34e"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="479" height="219" rx="14" fill="url(#bg)" stroke="#30363d"/>
  <text x="24" y="36" font-size="18" font-weight="700" fill="url(#title)">Activity</text>
  <rect x="24" y="44" width="432" height="1" fill="#30363d"/>
  ${tile(24, 56, 136, "Commits", c.totalCommitContributions, "#54dfc4", 0.1)}
  ${tile(172, 56, 136, "PRs opened", u.pullRequests.totalCount, "#f6d34e", 0.25)}
  ${tile(320, 56, 136, "PRs reviewed", c.totalPullRequestReviewContributions, "#a78bfa", 0.4)}
  ${tile(24, 132, 210, "Issues opened", u.issues.totalCount, "#fb7185", 0.55)}
  ${tile(246, 132, 210, "Issue comments", u.issueComments.totalCount, "#60a5fa", 0.7)}
</svg>`;

fs.writeFileSync("github-activity.svg", svg);
console.log("github-activity.svg written");
