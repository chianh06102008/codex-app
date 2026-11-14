import { NextResponse } from 'next/server'
import sharp from 'sharp'
import type { DepthCategory, VisionAnalysisResponse } from '@/types/floodscout'

function sanitizeCategory(val: unknown): DepthCategory {
  if (val === 'ankle' || val === 'wheel' || val === 'unsure') return val
  return 'unsure'
}

async function analyzeWithGeminiVision(
  jpegBase64: string,
  apiKey: string,
  segmentName: string,
  transcript: string,
): Promise<VisionAnalysisResponse | null> {
  const baseUrl = (
    process.env.APP_GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com'
  ).replace(/\/$/, '')

  const prompt = `You are FloodScout VN's flood-depth computer vision analyzer.
Inspect this street photo (location context: "${segmentName}", reporter note: "${transcript}").
Classify visible street floodwater depth into strictly ONE of three FloodScout categories:
- "wheel": water reaches or exceeds motorbike wheel hubs / car bumpers (~35–40cm+), or fast/muddy flash flood / landslide debris blocking road.
- "ankle": shallow standing street water around curb / ankle / lower tire (~10–25cm).
- "unsure": unclear depth, night glare, no reference object, or no standing water visible.
Return strict JSON matching:
{
  "depthCategory": "ankle" | "wheel" | "unsure",
  "waterDetected": boolean,
  "confidence": number,
  "referenceObjects": string[],
  "headlineVi": string,
  "headlineEn": string,
  "explanationVi": string,
  "explanationEn": string
}`

  const res = await fetch(
    `${baseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: jpegBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.15,
        },
      }),
      signal: AbortSignal.timeout(12_000),
    },
  )

  if (!res.ok) return null
  const data = await res.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) return null
  const parsed = JSON.parse(rawText)

  return {
    depthCategory: sanitizeCategory(parsed.depthCategory),
    waterDetected: Boolean(parsed.waterDetected),
    confidence: Math.max(0.3, Math.min(0.99, Number(parsed.confidence ?? 0.85))),
    provider: 'gemini-vision',
    modelName: 'gemini-2.5-flash',
    visionKeyConfigured: true,
    referenceObjects: Array.isArray(parsed.referenceObjects)
      ? parsed.referenceObjects.map(String).slice(0, 5)
      : [],
    headlineVi: String(parsed.headlineVi || 'Ngang bánh xe'),
    headlineEn: String(parsed.headlineEn || 'Wheel-hub deep'),
    explanationVi: String(
      parsed.explanationVi ||
        'Mô hình thị giác AI đã phân tích mặt nước và vật chuẩn trong ảnh. Bạn kiểm tra và chọn lại bên dưới nếu cần.',
    ),
    explanationEn: String(
      parsed.explanationEn ||
        'Vision AI analyzed water surface and reference objects in your photo. Confirm or adjust below.',
    ),
  }
}

async function analyzeWithOpenAiVision(
  jpegBase64: string,
  apiKey: string,
  segmentName: string,
  transcript: string,
): Promise<VisionAnalysisResponse | null> {
  const baseUrl = (process.env.APP_OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(
    /\/$/,
    '',
  )
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.15,
      messages: [
        {
          role: 'system',
          content:
            'Classify flood depth in street photos as JSON: {"depthCategory":"ankle"|"wheel"|"unsure","waterDetected":boolean,"confidence":number,"referenceObjects":string[],"headlineVi":string,"headlineEn":string,"explanationVi":string,"explanationEn":string}',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Location: ${segmentName}. Note: ${transcript}. Classify flood depth.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${jpegBase64}` },
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  })

  if (!res.ok) return null
  const data = await res.json()
  const raw = data?.choices?.[0]?.message?.content
  if (!raw) return null
  const parsed = JSON.parse(raw)

  return {
    depthCategory: sanitizeCategory(parsed.depthCategory),
    waterDetected: Boolean(parsed.waterDetected),
    confidence: Math.max(0.3, Math.min(0.99, Number(parsed.confidence ?? 0.85))),
    provider: 'openai-vision',
    modelName: 'gpt-4o-mini',
    visionKeyConfigured: true,
    referenceObjects: Array.isArray(parsed.referenceObjects)
      ? parsed.referenceObjects.map(String).slice(0, 5)
      : [],
    headlineVi: String(parsed.headlineVi || 'Ngang bánh xe'),
    headlineEn: String(parsed.headlineEn || 'Wheel-hub deep'),
    explanationVi: String(parsed.explanationVi || ''),
    explanationEn: String(parsed.explanationEn || ''),
  }
}

async function analyzeWithSharpComputerVision(
  imageBuffer: Buffer,
  transcript: string,
  visionKeyConfigured: boolean,
): Promise<VisionAnalysisResponse> {
  const SIZE = 96
  const { data } = await sharp(imageBuffer)
    .rotate()
    .resize(SIZE, SIZE, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let lowerWaterLikePixels = 0
  let lowerTurbidBrownPixels = 0
  let horizontalEdgeEnergy = 0
  const lowerStartRow = Math.floor(SIZE * 0.42)
  const totalLowerPixels = (SIZE - lowerStartRow) * SIZE

  for (let y = lowerStartRow; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = (y * SIZE + x) * 3
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      const maxC = Math.max(r, g, b)
      const minC = Math.min(r, g, b)
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC

      if ((b >= r - 8 && sat < 0.35 && lum > 55 && lum < 225) || (b > g && b > r + 10)) {
        lowerWaterLikePixels++
      }
      if (r > b + 15 && g > b + 6 && lum > 45 && lum < 195 && sat >= 0.12 && sat <= 0.62) {
        lowerTurbidBrownPixels++
      }

      if (y > lowerStartRow) {
        const prevIdx = ((y - 1) * SIZE + x) * 3
        const prevLum =
          0.299 * data[prevIdx] + 0.587 * data[prevIdx + 1] + 0.114 * data[prevIdx + 2]
        horizontalEdgeEnergy += Math.abs(lum - prevLum)
      }
    }
  }

  const waterRatio = (lowerWaterLikePixels + lowerTurbidBrownPixels) / Math.max(1, totalLowerPixels)
  const turbidRatio = lowerTurbidBrownPixels / Math.max(1, totalLowerPixels)
  const meanHorizGrad = horizontalEdgeEnergy / Math.max(1, totalLowerPixels)

  const lowerTranscript = transcript.toLowerCase()
  let depthCategory: DepthCategory = 'unsure'
  let confidence = 0.68

  if (
    lowerTranscript.includes('bánh xe') ||
    lowerTranscript.includes('ngập sâu') ||
    lowerTranscript.includes('wheel') ||
    (waterRatio > 0.56 && (turbidRatio > 0.22 || meanHorizGrad < 14))
  ) {
    depthCategory = 'wheel'
    confidence = Math.min(0.88, Number((0.64 + waterRatio * 0.28).toFixed(2)))
  } else if (
    lowerTranscript.includes('mắt cá') ||
    lowerTranscript.includes('ankle') ||
    waterRatio > 0.34
  ) {
    depthCategory = 'ankle'
    confidence = Math.min(0.84, Number((0.6 + waterRatio * 0.25).toFixed(2)))
  } else {
    depthCategory = 'unsure'
    confidence = 0.58
  }

  const headlines: Record<DepthCategory, { vi: string; en: string }> = {
    wheel: { vi: 'Ngang bánh xe', en: 'Wheel-hub deep' },
    ankle: { vi: 'Ngang mắt cá', en: 'Ankle deep' },
    unsure: { vi: 'Chưa rõ độ sâu', en: 'Unclear water depth' },
  }

  const waterPct = Math.round(waterRatio * 100)

  return {
    depthCategory,
    waterDetected: waterRatio > 0.3,
    confidence,
    provider: 'sharp-cv-fallback',
    modelName: 'sharp-spectral-cv-v1',
    visionKeyConfigured,
    referenceObjects:
      turbidRatio > 0.2
        ? ['Mặt nước đục phù sa', 'Đường ranh giới mặt nước']
        : ['Phản xạ mặt nước nửa dưới khung hình'],
    headlineVi: headlines[depthCategory].vi,
    headlineEn: headlines[depthCategory].en,
    explanationVi: `Phân tích thị giác trên máy chủ (${waterPct}% vùng phản xạ nước nửa dưới ảnh, độ tin cậy ${Math.round(
      confidence * 100,
    )}%). Bạn kiểm tra và chọn xác nhận mức nước bên dưới.`,
    explanationEn: `Server computer-vision analysis (${waterPct}% lower-frame water surface signature, ${Math.round(
      confidence * 100,
    )}% confidence). Please confirm the depth category below.`,
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let imageBuffer: Buffer | null = null
    let segmentName = 'Đường Nguyễn Trãi'
    let transcript = ''

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      segmentName = String(form.get('segmentName') || segmentName)
      transcript = String(form.get('transcript') || '')
      if (file && typeof (file as Blob).arrayBuffer === 'function') {
        imageBuffer = Buffer.from(await (file as Blob).arrayBuffer())
      }
    } else {
      const body = await request.json()
      segmentName = String(body?.segmentName || segmentName)
      transcript = String(body?.transcript || '')
      const b64 = String(body?.imageBase64 || '').replace(
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
        '',
      )
      if (b64) {
        imageBuffer = Buffer.from(b64, 'base64')
      }
    }

    if (!imageBuffer || imageBuffer.length < 32) {
      return NextResponse.json(
        { error: 'Vui lòng tải lên hoặc chụp một ảnh hợp lệ để phân tích.' },
        { status: 400 },
      )
    }

    const meta = await sharp(imageBuffer).metadata()
    const normalizedJpeg = await sharp(imageBuffer)
      .rotate()
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84 })
      .toBuffer()

    const geminiKey = process.env.APP_GEMINI_API_KEY?.trim()
    const openAiKey = process.env.APP_OPENAI_API_KEY?.trim()
    const visionKeyConfigured = Boolean(geminiKey || openAiKey)
    const jpegBase64 = normalizedJpeg.toString('base64')

    if (geminiKey) {
      try {
        const geminiResult = await analyzeWithGeminiVision(
          jpegBase64,
          geminiKey,
          segmentName,
          transcript,
        )
        if (geminiResult) {
          geminiResult.imageDimensions = {
            width: meta.width ?? 0,
            height: meta.height ?? 0,
          }
          return NextResponse.json(geminiResult)
        }
      } catch {
        // Fall through
      }
    }

    if (openAiKey) {
      try {
        const openAiResult = await analyzeWithOpenAiVision(
          jpegBase64,
          openAiKey,
          segmentName,
          transcript,
        )
        if (openAiResult) {
          openAiResult.imageDimensions = {
            width: meta.width ?? 0,
            height: meta.height ?? 0,
          }
          return NextResponse.json(openAiResult)
        }
      } catch {
        // Fall through
      }
    }

    const cvResult = await analyzeWithSharpComputerVision(
      normalizedJpeg,
      transcript,
      visionKeyConfigured,
    )
    cvResult.imageDimensions = {
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    }
    return NextResponse.json(cvResult)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Vision analysis failed' },
      { status: 500 },
    )
  }
}
