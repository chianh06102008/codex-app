type RouteOption = { distanceKm: number; durationMin: number }
type Language = 'vi' | 'en'

export function openAIConfig() {
  return {
    key: process.env.APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    baseUrl: (process.env.APP_OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: process.env.APP_OPENAI_MODEL || 'gpt-5-mini',
    transcriptionModel: process.env.APP_OPENAI_TRANSCRIPTION_MODEL || 'gpt-transcribe',
  }
}

export async function chat(system: string, input: unknown): Promise<string | null> {
  const { key, baseUrl, model } = openAIConfig()
  if (!key) return null
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(input) }],
        max_completion_tokens: 512,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    return typeof content === 'string' ? content.trim() : null
  } catch {
    return null
  }
}

export async function chooseEquivalentRoute(routes: RouteOption[], lang: Language) {
  if (routes.length < 2) return 0
  const selection = await chat(
    lang === 'vi'
      ? 'Các tuyến có cùng độ an toàn và chiều dài. Chọn tuyến có thời gian ngắn nhất. Chỉ trả về chỉ số bắt đầu từ 0.'
      : 'These routes have equal risk and distance. Pick the shortest duration. Return only its zero-based index.',
    routes,
  )
  if (!selection || !/^\d+$/.test(selection)) return 0
  const index = Number(selection)
  return routes[index]?.durationMin === routes[0].durationMin ? index : 0
}
