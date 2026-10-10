export function calculateIdDifferences (existingIds: number[], newIds: number[]) {
  const idsToAdd = newIds.filter((id) => !existingIds.includes(id))
  const idsToRemove = existingIds.filter((id) => !newIds.includes(id))

  return { idsToAdd, idsToRemove }
}
