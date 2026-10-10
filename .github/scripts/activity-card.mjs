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

const rows = [
  ["Commits", c.totalCommitContributions, "#2dd4bf"],
  ["PRs opened", u.pullRequests.totalCount, "#818cf8"],
  ["PRs reviewed", c.totalPullRequestReviewContributions, "#c084fc"],
  ["Issues opened", u.issues.totalCount, "#f472b6"],
  ["Issue comments", u.issueComments.totalCount, "#38bdf8"],
];

const total = rows.reduce((s, r) => s + r[1], 0);
const max = Math.max(...rows.map((r) => r[1]), 1);

// ring
const cx = 82, cy = 134, r = 42;
const C = 2 * Math.PI * r;
const gap = 4;
let acc = 0;
const arcs = rows
  .map(([, v, color]) => {
    if (!v || !total) return "";
    const len = Math.max((v / total) * C - gap, 1.5);
    const out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 ${cx} ${cy})"/>`;
    acc += (v / total) * C;
    return out;
  })
  .join("\n    ");

// rows
const x0 = 170, w = 326;
const bars = rows
  .map(([label, v, color], i) => {
    const y = 82 + i * 27;
    const fw = v > 0 ? Math.max(4, Math.sqrt(v / max) * w) : 0;
    return `
  <text x="${x0}" y="${y}" font-size="12" fill="#e5e5e5">${label}</text>
  <text x="${x0 + w}" y="${y}" font-size="12" fill="${color}" text-anchor="end" font-weight="600">${v}</text>
  <rect x="${x0}" y="${y + 6}" width="${w}" height="4" rx="2" fill="#262626"/>
  <rect x="${x0}" y="${y + 6}" width="0" height="4" rx="2" fill="${color}">
    <animate attributeName="width" from="0" to="${fw.toFixed(1)}" dur="0.8s" begin="${(0.1 + i * 0.12).toFixed(2)}s" fill="freeze"/>
  </rect>`;
  })
  .join("");

const safeUser = String(user).replace(/[<>&"]/g, "");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="216" viewBox="0 0 520 216" font-family="Recursive, 'Fira Code', Consolas, 'DejaVu Sans Mono', monospace">
  <rect x="0.5" y="0.5" width="519" height="215" rx="12" fill="#0f0f0f" stroke="#2a2a2a"/>
  <g transform="translate(24 20) scale(1.5)" fill="#2dd4bf">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </g>
  <text x="56" y="38" font-size="20" font-weight="700" fill="#f5f5f5">${safeUser}</text>
  <text x="496" y="38" font-size="13" fill="#737373" text-anchor="end">public activity</text>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#262626" stroke-width="8"/>
  <g opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0s" fill="freeze"/>
    ${arcs}
  </g>
  <text x="${cx}" y="${cy + 8}" font-size="24" font-weight="700" fill="#f5f5f5" text-anchor="middle">${total}</text>
  ${bars}
</svg>`;

fs.writeFileSync("github-activity.svg", svg);
console.log("github-activity.svg written");
