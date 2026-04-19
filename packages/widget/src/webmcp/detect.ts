export function isWebMCPSupported(): boolean {
  return typeof navigator !== 'undefined' && 'modelContext' in navigator;
}

export function getModelContext(): any | null {
  if (!isWebMCPSupported()) return null;
  return (navigator as any).modelContext;
}
