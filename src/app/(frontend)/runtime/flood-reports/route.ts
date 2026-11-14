import { hasManagedFloodData } from '@/lib/floodscout-runtime'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { getCachedHazardSegments, snapPointToOsmStreetPolyline } from '@/lib/floodscout-queries'
import { getPayloadClient } from '@/lib/payload'
import type { DepthCategory, FloodReportDTO } from '@/types/floodscout'

function isValidDepth(val: unknown): val is DepthCategory {
  return val === 'ankle' || val === 'wheel' || val === 'unsure'
}

export async function POST(request: Request) {
  if (!hasManagedFloodData()) {
    return NextResponse.json({ error: 'Shared flood reports require the managed backend.' }, { status: 503 })
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data;')) {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 415 })
  }

  try {
    const form = await request.formData()
    const dryGroundConfirmed = form.get('dryGroundConfirmed') === 'true'
    const depthCategoryRaw = String(form.get('depthCategory') || '')
    const segmentNameInput = String(form.get('segmentName') || '').trim()
    const addressInput = String(form.get('address') || '').trim()
    const transcript = String(form.get('transcript') || '').trim()
    const aiProposedRaw = String(form.get('aiProposedCategory') || '')
    const aiConfidenceRaw = Number(form.get('aiConfidence') || '0')
    const aiSummary = String(form.get('aiSummary') || '').trim()
    const aiProvider = String(form.get('aiProvider') || '').trim()
    const clientDeviceToken = String(form.get('clientDeviceToken') || '').trim()
    const lon = Number(form.get('longitude') || '105.8079')
    const lat = Number(form.get('latitude') || '20.995')
    const fileEntry = form.get('photo')

    if (!dryGroundConfirmed) {
      return NextResponse.json(
        { error: 'Bạn cần xác nhận chỉ chụp từ chỗ khô ráo trước khi gửi báo cáo.' },
        { status: 400 },
      )
    }
    if (!isValidDepth(depthCategoryRaw)) {
      return NextResponse.json(
        { error: 'Vui lòng chọn mức nước (Mắt cá / Bánh xe / Chưa rõ).' },
        { status: 400 },
      )
    }
    if (Number.isNaN(lon) || Number.isNaN(lat) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return NextResponse.json({ error: 'Toạ độ vị trí không hợp lệ.' }, { status: 400 })
    }

    const payload = await getPayloadClient()
    const segments = await getCachedHazardSegments()

    const matchedSegment = segments.find(
      (s) =>
        s.name.toLowerCase() === segmentNameInput.toLowerCase() ||
        Math.hypot(s.centerLon - lon, s.centerLat - lat) < 0.0025,
    )

    const snapped =
      matchedSegment && matchedSegment.coordinates.length >= 2
        ? { coordinates: matchedSegment.coordinates, streetName: matchedSegment.name }
        : await snapPointToOsmStreetPolyline(lon, lat)

    const finalSegmentName =
      segmentNameInput || matchedSegment?.name || snapped.streetName || 'Đoạn đường báo cáo'
    const finalAddress =
      addressInput ||
      matchedSegment?.address ||
      `${finalSegmentName}, Hà Nội (${lat.toFixed(4)}, ${lon.toFixed(4)})`

    let uploadedMediaId: string | number | undefined
    let uploadedPhotoUrl: string | null = null

    if (fileEntry && typeof (fileEntry as Blob).arrayBuffer === 'function') {
      const rawBuf = Buffer.from(await (fileEntry as Blob).arrayBuffer())
      if (rawBuf.length > 64) {
        const cleanJpeg = await sharp(rawBuf)
          .rotate()
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toBuffer()

        const mediaDoc = await payload.create({
          collection: 'media',
          overrideAccess: false,
          data: {
            alt: `Ảnh báo cáo ngập tại ${finalSegmentName}`,
          },
          file: {
            data: cleanJpeg,
            mimetype: 'image/jpeg',
            name: `flood-report-${Date.now()}.jpg`,
            size: cleanJpeg.length,
          },
        })
        uploadedMediaId = mediaDoc.id
        uploadedPhotoUrl = (mediaDoc as any).url ? String((mediaDoc as any).url) : null
      }
    }

    const depthTitleMap: Record<DepthCategory, string> = {
      wheel: 'Ngang bánh xe',
      ankle: 'Ngang mắt cá',
      unsure: 'Chưa rõ, có thấy nước',
    }

    const created = await payload.create({
      collection: 'flood-reports',
      overrideAccess: false,
      data: {
        title: `${depthTitleMap[depthCategoryRaw]} · ${finalSegmentName}`,
        segment: matchedSegment ? (matchedSegment.id as any) : undefined,
        segmentName: finalSegmentName,
        address: finalAddress,
        longitude: lon,
        latitude: lat,
        snappedGeometry: snapped.coordinates,
        depthCategory: depthCategoryRaw,
        aiProposedCategory: isValidDepth(aiProposedRaw) ? aiProposedRaw : undefined,
        aiConfidence: aiConfidenceRaw > 0 ? aiConfidenceRaw : undefined,
        aiSummary: aiSummary || undefined,
        aiProvider: aiProvider || undefined,
        transcript: transcript || undefined,
        photo: uploadedMediaId as any,
        dryGroundConfirmed: true,
        clientDeviceToken: clientDeviceToken || undefined,
      },
    })

    revalidateTag('flood-reports', 'max')
    revalidateTag('hazard-segments', 'max')

    const dto: FloodReportDTO = {
      id: String(created.id),
      title: String(created.title),
      segmentId: matchedSegment ? matchedSegment.id : null,
      segmentName: finalSegmentName,
      address: finalAddress,
      longitude: lon,
      latitude: lat,
      snappedGeometry: snapped.coordinates,
      depthCategory: depthCategoryRaw,
      aiProposedCategory: isValidDepth(aiProposedRaw) ? aiProposedRaw : null,
      aiConfidence: aiConfidenceRaw > 0 ? aiConfidenceRaw : null,
      aiSummary: aiSummary || null,
      aiProvider: aiProvider || null,
      transcript: transcript || null,
      photoUrl: uploadedPhotoUrl,
      photoAlt: `Ảnh báo cáo ngập tại ${finalSegmentName}`,
      moderationStatus: 'active',
      ageMinutes: 1,
      weightFactor: 1,
      createdAt: String(created.createdAt || new Date().toISOString()),
      isOwn: true,
    }

    return NextResponse.json({ report: dto })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Không thể lưu báo cáo ngập.' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  if (!hasManagedFloodData()) {
    return NextResponse.json({ error: 'Shared flood reports require the managed backend.' }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const token = (searchParams.get('deviceToken') || '').trim()
    if (!token || token.length < 8) {
      return NextResponse.json({ deletedCount: 0 })
    }

    const payload = await getPayloadClient()
    const res = await payload.delete({
      collection: 'flood-reports',
      overrideAccess: true,
      where: {
        clientDeviceToken: { equals: token },
      },
    })

    revalidateTag('flood-reports', 'max')
    revalidateTag('hazard-segments', 'max')

    return NextResponse.json({ deletedCount: res.docs?.length ?? 0 })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Không thể xoá báo cáo.' },
      { status: 500 },
    )
  }
}
