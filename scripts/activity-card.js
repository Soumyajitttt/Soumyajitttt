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
    }
  }
}`;

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
        `<text x="20" y="${62 + i * 22}" fill="#54dfc4" font-size="14">${label}</text>` +
        `<text x="310" y="${62 + i * 22}" fill="#f6d34e" font-size="14" text-anchor="end" font-weight="600">${val}</text>`
    )
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="170" viewBox="0 0 330 170" font-family="Segoe UI, Ubuntu, sans-serif">
  <rect width="330" height="170" rx="6" fill="#0D1117"/>
  <text x="20" y="30" fill="#54dfc4" font-size="18" font-weight="600">Activity</text>
  ${lines}
</svg>`;

  fs.writeFileSync("activity.svg", svg);
})();
