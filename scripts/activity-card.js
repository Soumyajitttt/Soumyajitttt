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

// palette
const BG = "#161b22";
const BORDER = "#30363d";
const DIVIDER = "#21262d";
const TEXT = "#c9d1d9";
const TITLE = "#f0f6fc";
const MUTED = "#8b949e";
const BLUE = "#58a6ff";

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

  // layout
  const W = 420;
  const H = 170;
  const LABEL_X = 120;
  const VALUE_X = 400;
  const ROW_START = 72;
  const ROW_GAP = 21;

  const rowSvg = rows
    .map(([label, val], i) => {
      const y = ROW_START + i * ROW_GAP;
      const divider =
        i < rows.length - 1
          ? `<line x1="${LABEL_X}" y1="${y + ROW_GAP / 2}" x2="${VALUE_X}" y2="${y + ROW_GAP / 2}" stroke="${DIVIDER}" stroke-width="1"/>`
          : "";
      return (
        `<text x="${LABEL_X}" y="${y}" dy="0.35em" fill="${TEXT}" font-size="13">${label}</text>` +
        `<text x="${VALUE_X}" y="${y}" dy="0.35em" fill="${BLUE}" font-size="13" font-weight="600" text-anchor="end">${val}</text>` +
        divider
      );
    })
    .join("\n  ");

  // ring: commits' share of total contributions
  const cx = 57;
  const cy = 114;
  const r = 34;
  const circ = 2 * Math.PI * r;
  const share = total ? Math.min(c.totalCommitContributions / total, 1) : 0;
  const totalSize = String(total).length > 3 ? 20 : 24;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6" fill="${BG}" stroke="${BORDER}"/>

  <path transform="translate(20,16) scale(1.5)" fill="${TITLE}" d="${GITHUB_LOGO}"/>
  <text x="54" y="28" dy="0.35em" fill="${TITLE}" font-size="17" font-weight="600">${login}</text>
  <text x="${VALUE_X}" y="28" dy="0.35em" fill="${MUTED}" font-size="11" text-anchor="end">Last 12 months</text>
  <line x1="0" y1="52" x2="${W}" y2="52" stroke="${BORDER}" stroke-width="1"/>

  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BORDER}" stroke-width="5"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BLUE}" stroke-width="5" stroke-linecap="round"
    stroke-dasharray="${(circ * share).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy - 5}" dy="0.35em" fill="${TITLE}" font-size="${totalSize}" font-weight="600" text-anchor="middle">${total}</text>
  <text x="${cx}" y="${cy + 12}" dy="0.35em" fill="${MUTED}" font-size="8.5" text-anchor="middle">contributions</text>

  ${rowSvg}
</svg>`;

  fs.writeFileSync("activity.svg", svg);
})();
