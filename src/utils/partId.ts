export function stripPartIdSuffix(partId: string): string {
  // Remove non-numeric characters from the end
  const match = partId.match(/^(\d+)/);
  return match ? match[1] : partId;
}
