type SceneJob = { workflowMode: string; sceneId?: string; createdAt: string };
// Choose the latest attempt, even if it is still pending; never export an older duplicate.
export const latestSceneJobs = <T extends SceneJob>(
  jobs: T[],
  sceneIds: string[],
): T[] => {
  const current = new Set(sceneIds);
  const latest = new Map<string, T>();
  for (const job of jobs) {
    if (
      job.workflowMode !== "storyboard" ||
      !job.sceneId ||
      !current.has(job.sceneId)
    )
      continue;
    const previous = latest.get(job.sceneId);
    if (!previous || Date.parse(job.createdAt) > Date.parse(previous.createdAt))
      latest.set(job.sceneId, job);
  }
  return sceneIds.flatMap((id) => (latest.has(id) ? [latest.get(id)!] : []));
};
