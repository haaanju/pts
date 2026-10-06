// Changelog lines without commit hashes or dependency notes (ADR 0035): every changeset names
// @pts/web, whose CHANGELOG.md is the project's changelog, and internal dependencies are "*".
export default {
  getReleaseLine: async (changeset) => {
    const [first, ...rest] = changeset.summary.trim().split("\n");
    return [`- ${first}`, ...rest.map((line) => (line ? `  ${line}` : line))].join("\n");
  },
  getDependencyReleaseLine: async () => "",
};
