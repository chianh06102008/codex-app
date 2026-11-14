export function isFigmaRuntime(): boolean {
  return process.env.FIGMA === '1' || Boolean(process.env.FIGMA_EID)
}

export function hasManagedFloodData(): boolean {
  return isFigmaRuntime() || Boolean(process.env.PAYLOAD_SECRET?.trim())
}
