export function hasManagedFloodData(): boolean {
  return process.env.FIGMA === '1' || Boolean(process.env.FIGMA_EID)
}
