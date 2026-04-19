export function isWebMcpAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'modelContext' in navigator;
}
