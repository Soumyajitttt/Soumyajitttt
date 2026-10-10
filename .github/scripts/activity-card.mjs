import fs from "node:fs";

const token = process.env.GH_TOKEN;
const user = process.env.GH_USER;

const ACCENT = "#3ecf8e";

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        weeks { contributionDays { contributionCount } }
      }
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

// weekly contributions, last 52 weeks
const weekly = c.contributionCalendar.weeks
  .slice(-52)
  .map((w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0));
const maxW = Math.max(...weekly, 1);

const chartX = 220, chartW = 272, chartTop = 56, chartH = 54;
const step = chartW / weekly.length;
const bw = Math.max(step - 2, 2);

const bars = weekly
  .map((v, i) => {
    const h = v ? Math.max(3, (v / maxW) * chartH) : 2;
    const x = chartX + i * step;
    const y = chartTop + chartH - h;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${v ? ACCENT : "#262626"}"/>`;
  })
  .join("\n  ");

const stats = [
  ["PRs opened", u.pullRequests.totalCount],
  ["PRs reviewed", c.totalPullRequestReviewContributions],
  ["Issues opened", u.issues.totalCount],
  ["Issue comments", u.issueComments.totalCount],
];

const cells = stats
  .map(([label, value], i) => {
    const div = 28 + i * 116;
    const tx = i === 0 ? 28 : div + 14;
    return `${
      i > 0 ? `<rect x="${div}" y="150" width="1" height="54" fill="#1f1f1f"/>` : ""
    }
  <text x="${tx}" y="162" font-size="12" fill="#737373">${label}</text>
  <text x="${tx}" y="194" font-size="26" font-weight="600" fill="#fafafa">${value}</text>`;
  })
  .join("\n  ");

const safeUser = String(user).replace(/[<>&"]/g, "");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="224" viewBox="0 0 520 224" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif">
  <rect x="0.5" y="0.5" width="519" height="223" rx="10" fill="#0a0a0a" stroke="#262626"/>

  <circle cx="31" cy="26" r="3.5" fill="${ACCENT}"/>
  <text x="42" y="30" font-size="13" font-weight="500" fill="#e5e5e5">Activity</text>
  <text x="492" y="30" font-size="12" fill="#737373" text-anchor="end" font-family="'SF Mono', Menlo, Consolas, monospace">@${safeUser}</text>
  <rect x="0" y="44" width="520" height="1" fill="#1f1f1f"/>

  <text x="28" y="92" font-size="38" font-weight="600" fill="#fafafa">${c.totalCommitContributions}</text>
  <text x="28" y="112" font-size="12" fill="#737373">Commits, last 12 months</text>

  ${bars}
  <text x="492" y="126" font-size="10" fill="#525252" text-anchor="end">contributions per week</text>

  <rect x="0" y="134" width="520" height="1" fill="#1f1f1f"/>
  ${cells}
</svg>`;

fs.writeFileSync("github-activity.svg", svg);
console.log("github-activity.svg written");
