export function transform(input) {
  const rows = input.sourceData.map((issue) => ({
    project: issue.fields.project.key,
    platform: issue.fields.platform ?? 'unknown',
    owner: issue.fields.assignee?.displayName ?? 'unassigned',
    total: Number(issue.fields.total_cases ?? 0),
    passed: Number(issue.fields.passed_cases ?? 0),
    failed: Number(issue.fields.failed_cases ?? 0),
    passRate:
      issue.fields.total_cases > 0
        ? (issue.fields.passed_cases / issue.fields.total_cases) * 100
        : 0,
    status: issue.fields.status.name,
    updatedAt: issue.fields.updated,
  }));

  return {
    schemaVersion: '1.0',
    rows,
    metadata: {
      source: 'jira_test_cases',
      transformedAt: input.context.now,
    },
  };
}
