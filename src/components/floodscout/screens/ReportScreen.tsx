'use client'

import Image from 'next/image'
import React, { useRef, useState } from 'react'
import {
  ButtonPrimary,
  ButtonSecondary,
  HeaderBack,
  MicButton,
} from '@/components/floodscout/SharedPrimitives'
import { useCameraSafeTopInset, useGsapScreenEntrance, useGsapSheetEntrance } from '@/hooks/useGsap'
import { ASSETS } from '@/lib/assets'
import type {
  DepthCategory,
  FloodReportDTO,
  GeocodePlace,
  HazardSegmentDTO,
  Language,
  VisionAnalysisResponse,
} from '@/types/floodscout'

interface ReportScreenProps {
  lang: Language
  segments: HazardSegmentDTO[]
  photoConsent: boolean
  preciseLocationConsent: boolean
  deviceToken: string
  onBack: () => void
  onReportCreated: (report: FloodReportDTO) => void
}

/**
 * Redacts upper-mid license plate / face bands locally on an HTML5 canvas before uploading
 */
async function redactPhotoOnDeviceCanvas(file: Blob): Promise<{
  blob: Blob
  previewDataUrl: string
}> {
  const bitmapUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = document.createElement('img')
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = bitmapUrl
    })
    const maxDim = 960
    const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1))
    const w = Math.max(120, Math.round(img.width * scale))
    const h = Math.max(120, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)

    // Subtle privacy blur band across typical pedestrian face/vehicle plate horizon (22%..44% Y)
    ctx.save()
    ctx.filter = 'blur(7px)'
    const bandY = Math.round(h * 0.24)
    const bandH = Math.round(h * 0.16)
    ctx.drawImage(canvas, 0, bandY, w, bandH, 0, bandY, w, bandH)
    ctx.restore()

    const previewDataUrl = canvas.toDataURL('image/jpeg', 0.84)
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b || file), 'image/jpeg', 0.84),
    )
    return { blob, previewDataUrl }
  } finally {
    URL.revokeObjectURL(bitmapUrl)
  }
}

/**
 * Generates a realistic street-flood test image (urban building facade + motorbike wheel + turbid floodwater)
 * so desktop testers without a local flood photo can exercise the live /runtime/vision & Payload upload pipeline.
 */
async function buildSampleFloodSceneBlob(): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 480
  const ctx = canvas.getContext('2d')!

  // Overcast rain sky & urban Hanoi buildings
  ctx.fillStyle = '#cfd6dc'
  ctx.fillRect(0, 0, 640, 210)
  ctx.fillStyle = '#9aa19a'
  ctx.fillRect(30, 60, 180, 160)
  ctx.fillRect(240, 40, 210, 180)
  ctx.fillRect(470, 75, 140, 145)

  // Turbid silty urban floodwater covering the lower 56% of the street
  const grad = ctx.createLinearGradient(0, 210, 0, 480)
  grad.addColorStop(0, '#8c775c')
  grad.addColorStop(0.5, '#7a664d')
  grad.addColorStop(1, '#66543e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 210, 640, 270)

  // Water surface ripples
  ctx.strokeStyle = 'rgba(235, 240, 245, 0.45)'
  ctx.lineWidth = 2
  for (let y = 232; y < 465; y += 26) {
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(620, y + 3)
    ctx.stroke()
  }

  // Half-submerged motorbike wheel hub reference
  ctx.strokeStyle = '#191b14'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(320, 295, 58, Math.PI, 0)
  ctx.stroke()

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.88),
  )
}

export function ReportScreen({
  lang,
  segments,
  photoConsent,
  preciseLocationConsent,
  deviceToken,
  onBack,
  onReportCreated,
}: ReportScreenProps) {
  const topInset = useCameraSafeTopInset()
  const rootRef = useGsapScreenEntrance([lang])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const defaultSeg = segments[0]
  const [selectedPlace, setSelectedPlace] = useState<GeocodePlace>({
    id: defaultSeg?.id || 'seg-default',
    label: defaultSeg?.name || '275 Đường Nguyễn Trãi',
    address:
      defaultSeg?.address ||
      '275 Đường Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội',
    district: defaultSeg?.district || 'Quận Thanh Xuân, Hà Nội',
    lon: defaultSeg?.centerLon ?? 105.807934,
    lat: defaultSeg?.centerLat ?? 20.994985,
  })

  const [dryGroundChecked, setDryGroundChecked] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<DepthCategory | null>('wheel')
  const [transcript, setTranscript] = useState(
    'Ở đoạn 275 Đường Nguyễn Trãi đang bị ngập ngang bánh xe máy',
  )
  const [recording, setRecording] = useState(false)

  const [redactedBlob, setRedactedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [visionLoading, setVisionLoading] = useState(false)
  const [visionResult, setVisionResult] = useState<VisionAnalysisResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [placeSearch, setPlaceSearch] = useState('')
  const [placeResults, setPlaceResults] = useState<GeocodePlace[]>([])
  const modalRef = useGsapSheetEntrance(locationPickerOpen)

  const runVisionAnalysis = async (blob: Blob, segLabel: string, note: string) => {
    setVisionLoading(true)
    setErrorMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', blob, 'street-flood.jpg')
      fd.append('segmentName', segLabel)
      fd.append('transcript', note)
      const res = await fetch('/runtime/vision', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Vision API error')
      const vr = json as VisionAnalysisResponse
      setVisionResult(vr)
      setSelectedCategory(vr.depthCategory)
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setVisionLoading(false)
    }
  }

  const handleFileChosen = async (file: Blob | null | undefined) => {
    if (!file) return
    const redacted = await redactPhotoOnDeviceCanvas(file)
    setRedactedBlob(redacted.blob)
    setPreviewUrl(redacted.previewDataUrl)
    await runVisionAnalysis(redacted.blob, selectedPlace.label, transcript)
  }

  const handleTestSamplePhoto = async () => {
    const sample = await buildSampleFloodSceneBlob()
    await handleFileChosen(sample)
  }

  const handleVoiceCapture = () => {
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    if (SpeechRec) {
      const rec = new SpeechRec()
      rec.lang = lang === 'vi' ? 'vi-VN' : 'en-US'
      rec.interimResults = false
      setRecording(true)
      rec.onresult = (ev: any) => {
        const text = ev?.results?.[0]?.[0]?.transcript
        if (text) setTranscript(String(text))
        setRecording(false)
      }
      rec.onerror = () => setRecording(false)
      rec.onend = () => setRecording(false)
      rec.start()
      return
    }

    setRecording(true)
    window.setTimeout(() => {
      setRecording(false)
      setTranscript(
        lang === 'vi'
          ? `Mặt đường tại ${selectedPlace.label.split('(')[0].trim()} đang dâng nước sau mưa lớn`
          : `Water rising on street surface at ${selectedPlace.label.split('(')[0].trim()}`,
      )
    }, 650)
  }

  const handleSearchLocation = async (q: string) => {
    setPlaceSearch(q)
    try {
      const r = await fetch(`/runtime/geocode?q=${encodeURIComponent(q)}`)
      if (r.ok) {
        const j = await r.json()
        setPlaceResults(j.results ?? [])
      }
    } catch {
      // Ignore
    }
  }

  const handleUseGpsLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const r = await fetch(
        `/runtime/geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
      )
      if (r.ok) {
        const j = await r.json()
        if (j.place) {
          setSelectedPlace(j.place)
          setLocationPickerOpen(false)
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!dryGroundChecked || !selectedCategory || submitting) return
    setSubmitting(true)
    setErrorMsg(null)
    try {
      const fd = new FormData()
      fd.append('dryGroundConfirmed', String(dryGroundChecked))
      fd.append('depthCategory', selectedCategory)
      fd.append('segmentName', selectedPlace.label)
      fd.append('address', selectedPlace.address)
      fd.append('longitude', String(selectedPlace.lon))
      fd.append('latitude', String(selectedPlace.lat))
      fd.append('transcript', transcript)
      fd.append('clientDeviceToken', deviceToken)
      if (visionResult) {
        fd.append('aiProposedCategory', visionResult.depthCategory)
        fd.append('aiConfidence', String(visionResult.confidence))
        fd.append(
          'aiSummary',
          lang === 'vi' ? visionResult.explanationVi : visionResult.explanationEn,
        )
        fd.append('aiProvider', visionResult.modelName)
      }
      if (photoConsent && redactedBlob) {
        fd.append('photo', redactedBlob, 'redacted-flood-report.jpg')
      }

      const res = await fetch('/runtime/flood-reports', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to submit report')
      onReportCreated(json.report as FloodReportDTO)
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const categories: Array<{ id: DepthCategory; labelVi: string; labelEn: string }> = [
    { id: 'ankle', labelVi: 'Mắt cá', labelEn: 'Ankle' },
    { id: 'wheel', labelVi: 'Bánh xe', labelEn: 'Wheel' },
    { id: 'unsure', labelVi: 'Chưa rõ', labelEn: 'Unsure' },
  ]

  return (
    <div
      ref={rootRef}
      className="bg-[#f3f4ef] flex flex-col min-h-dvh w-full justify-between pb-[88px]"
    >
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        <div
          className="flex flex-col items-start pb-[4px] px-[16px] md:px-6 w-full"
          style={{ paddingTop: topInset }}
        >
          <HeaderBack
            title={lang === 'vi' ? 'Báo cáo ngập hiện trường' : 'Submit field flood report'}
            subtitle={
              lang === 'vi'
                ? 'Phân tích ảnh bằng AI thị giác & ghim vệt ngập xanh lên đường thật'
                : 'Vision AI photo analysis & live OpenStreetMap blue road-line snapping'
            }
            onBack={onBack}
            lang={lang}
          />
        </div>

        <div className="flex flex-1 flex-col gap-[14px] items-start pb-[16px] pt-[12px] px-[16px] md:px-6 w-full">
          {/* Dry-ground required acknowledgement */}
          <button
            data-gsap="stagger"
            type="button"
            role="checkbox"
            aria-checked={dryGroundChecked}
            onClick={() => setDryGroundChecked((p) => !p)}
            className="bg-[#fff3e6] border-2 border-[#c2410c] flex gap-[14px] items-start px-[16px] py-[14px] rounded-[20px] text-left w-full"
          >
            <span
              className={`flex items-center justify-center rounded-[7px] shrink-0 size-[26px] ${
                dryGroundChecked ? 'bg-[#191b14]' : 'bg-white border-2 border-[#191b14]'
              }`}
            >
              {dryGroundChecked ? (
                <Image src={ASSETS.iconCheck} alt="" width={18} height={18} />
              ) : null}
            </span>
            <span className="flex-1 font-['Plus_Jakarta_Sans:Regular'] leading-[23px] text-[#191b14] text-[15px]">
              <strong className="font-['Plus_Jakarta_Sans:Bold'] font-bold">
                {lang === 'vi' ? 'Chỉ chụp từ chỗ khô ráo.' : 'Only take photos from dry ground.'}
              </strong>
              {lang === 'vi'
                ? ' Đừng đi vào nước chảy hoặc hầm ngập để chụp ảnh.'
                : ' Never step into moving floodwater or underpasses to take a photo.'}
            </span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px] w-full items-start">
            <div className="flex flex-col gap-[14px] w-full">
              {/* Voice + Editable Transcript */}
              <div
                data-gsap="stagger"
                className="bg-white flex gap-[14px] items-center p-[15px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full"
              >
                <MicButton
                  size={64}
                  lang={lang}
                  isRecording={recording}
                  onClick={handleVoiceCapture}
                />
                <div className="flex flex-1 flex-col gap-[4px] min-w-0">
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                    {lang === 'vi' ? 'MÔ TẢ / GIỌNG NÓI' : 'VOICE OR TEXT NOTE'}
                  </span>
                  <input
                    type="text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[#191b14] text-[16px] leading-[23px] bg-transparent border-b border-[#eceee6] focus:border-[#191b14] outline-none pb-[2px] w-full"
                  />
                </div>
              </div>

              {/* Photo Upload + Compiled Vision Model Card */}
              <div
                data-gsap="stagger"
                className="bg-white rounded-[20px] p-[15px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] flex flex-col gap-[12px] w-full"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChosen(e.target.files?.[0])}
                  className="hidden"
                />

                <div className="flex gap-[14px] items-start w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative bg-[#d9dcd2] hover:bg-[#cfd3c7] flex items-center justify-center overflow-hidden rounded-[18px] shrink-0 size-[116px] transition"
                  >
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Ảnh đường ngập đã làm mờ"
                        fill
                        sizes="116px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[#5d6157] text-[13px] leading-[19px] text-center px-[10px]">
                        {!photoConsent
                          ? lang === 'vi'
                            ? '[Quyền ảnh tắt]'
                            : '[Photos off]'
                          : lang === 'vi'
                            ? 'Chạm để tải / chụp ảnh ngập'
                            : 'Tap to upload flood photo'}
                      </span>
                    )}
                  </button>

                  <div className="flex flex-1 flex-col gap-[3px] min-w-0">
                    <div className="flex flex-wrap items-center gap-[6px]">
                      <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                        {lang === 'vi' ? 'AI THỊ GIÁC ĐỀ XUẤT' : 'VISION AI PROPOSAL'}
                      </span>
                      {visionResult ? (
                        <span className="rounded-full bg-[#eceee6] px-[8px] py-[1px] font-['Plus_Jakarta_Sans:SemiBold'] text-[11px] text-[#191b14]">
                          {visionResult.modelName} · {Math.round(visionResult.confidence * 100)}%
                        </span>
                      ) : null}
                    </div>

                    <p className="font-['Plus_Jakarta_Sans:Bold'] font-bold leading-[26px] text-[#191b14] text-[19px]">
                      {visionLoading
                        ? lang === 'vi'
                          ? 'Đang phân tích ảnh...'
                          : 'Analyzing photo...'
                        : visionResult
                          ? lang === 'vi'
                            ? visionResult.headlineVi
                            : visionResult.headlineEn
                          : lang === 'vi'
                            ? 'Chưa tải ảnh lên'
                            : 'Upload a photo to analyze'}
                    </p>

                    <p className="font-['Plus_Jakarta_Sans:Regular'] leading-[20px] text-[#5d6157] text-[14px]">
                      {visionResult
                        ? lang === 'vi'
                          ? visionResult.explanationVi
                          : visionResult.explanationEn
                        : lang === 'vi'
                          ? 'Tải ảnh thật hoặc tạo ảnh mẫu để chạy API thị giác (/runtime/vision).'
                          : 'Upload a street photo or test a sample frame via /runtime/vision.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-[8px]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-[#191b14] px-[14px] py-[7px] font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-white"
                  >
                    {lang === 'vi' ? 'Chọn / Chụp ảnh từ máy' : 'Choose / Capture photo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSamplePhoto}
                    className="rounded-full bg-[#eceee6] hover:bg-[#dfe1d8] px-[14px] py-[7px] font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-[#191b14]"
                  >
                    {lang === 'vi' ? 'Thử ảnh ngập mẫu với Vision AI' : 'Test Vision AI sample'}
                  </button>
                </div>
              </div>
            </div>

            {/* Location & Required Depth Category */}
            <div
              data-gsap="stagger"
              className="bg-white flex flex-col gap-[12px] items-start p-[16px] rounded-[20px] shadow-[0px_4px_16px_rgba(26,28,20,0.06)] w-full"
            >
              <div className="flex gap-[12px] items-start w-full">
                <div className="flex flex-1 flex-col gap-[2px] min-w-0">
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                    {lang === 'vi' ? 'VỊ TRÍ ĐƯỜNG THỰC TẾ' : 'STREET LOCATION'}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#191b14] text-[15px]">
                    {selectedPlace.label}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[13px]">
                    {selectedPlace.address}
                  </span>
                  {!preciseLocationConsent ? (
                    <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#9a3412]">
                      {lang === 'vi'
                        ? 'Đang chọn thủ công (quyền vị trí chính xác đang tắt)'
                        : 'Manual selection (precise location off)'}
                    </span>
                  ) : null}
                </div>
                <ButtonSecondary
                  label={lang === 'vi' ? 'Đổi vị trí' : 'Change'}
                  onClick={() => {
                    setLocationPickerOpen(true)
                    handleSearchLocation('')
                  }}
                />
              </div>

              <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[#5d6157] text-[12px] tracking-[0.78px] uppercase">
                {lang === 'vi'
                  ? 'MỨC NƯỚC XÁC NHẬN (BẮT BUỘC CHỌN)'
                  : 'CONFIRMED WATER DEPTH (REQUIRED)'}
              </span>

              <div
                role="radiogroup"
                aria-label={lang === 'vi' ? 'Mức nước' : 'Water depth category'}
                className="flex gap-[10px] w-full"
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-1 h-[54px] items-center justify-center rounded-[999px] transition ${
                        isSelected
                          ? 'bg-[#191b14] text-white'
                          : 'bg-white border-[#dfe1d8] border-[1.5px] text-[#191b14] hover:border-[#191b14]'
                      }`}
                    >
                      <span className="font-['Plus_Jakarta_Sans:SemiBold'] font-semibold text-[15px]">
                        {lang === 'vi' ? cat.labelVi : cat.labelEn}
                      </span>
                    </button>
                  )
                })}
              </div>

              {errorMsg ? (
                <p className="font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] text-[#b91c1c]">
                  {errorMsg}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-[#dfe1d8] flex flex-col gap-[8px] items-center py-[14px] px-[16px] w-full">
        <div className="w-full max-w-md flex flex-col gap-[8px]">
          <ButtonPrimary
            label={
              submitting
                ? lang === 'vi'
                  ? 'Đang lưu báo cáo & ghim lên bản đồ...'
                  : 'Saving report & snapping road line...'
                : lang === 'vi'
                  ? 'Gửi báo cáo ngập'
                  : 'Submit flood report'
            }
            disabled={!dryGroundChecked || !selectedCategory || submitting}
            onClick={handleSubmit}
          />
          <p className="font-['Plus_Jakarta_Sans:Regular'] text-[#5d6157] text-[13px] text-center">
            {lang === 'vi'
              ? 'Báo cáo lưu vào cơ sở dữ liệu Payload và vẽ vệt xanh bám sát mặt đường thực tế trong 12 giờ.'
              : 'Saved to Payload CMS and snapped onto real OpenStreetMap street geometry for 12 hours.'}
          </p>
        </div>
      </div>

      {/* Real Street Location Picker Sheet */}
      {locationPickerOpen ? (
        <div
          onClick={() => setLocationPickerOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 flex items-end md:items-center justify-center p-0 md:p-6"
          style={{ paddingTop: topInset }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-tl-[28px] rounded-tr-[28px] md:rounded-[28px] w-full max-w-[460px] p-[20px] pb-[96px] md:pb-[20px] flex flex-col gap-[12px] max-h-[85dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans:Bold'] font-bold text-[19px] text-[#191b14]">
                {lang === 'vi' ? 'Chọn địa chỉ / đoạn đường thật' : 'Select real street location'}
              </h3>
              <button
                type="button"
                onClick={() => setLocationPickerOpen(false)}
                className="bg-[#eceee6] px-[12px] py-[5px] rounded-full font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14]"
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>

            <div className="flex gap-[8px]">
              <input
                type="text"
                value={placeSearch}
                onChange={(e) => handleSearchLocation(e.target.value)}
                placeholder={
                  lang === 'vi'
                    ? 'Tìm tên đường, phường, quận tại Việt Nam...'
                    : 'Search street, ward, or city in Vietnam...'
                }
                className="flex-1 bg-[#f3f4ef] border border-[#dfe1d8] rounded-full px-[14px] py-[10px] font-['Plus_Jakarta_Sans:Regular'] text-[14px] text-[#191b14] outline-none"
              />
              {preciseLocationConsent ? (
                <button
                  type="button"
                  onClick={handleUseGpsLocation}
                  className="bg-[#191b14] text-white rounded-full px-[14px] font-['Plus_Jakarta_Sans:SemiBold'] text-[13px] shrink-0"
                >
                  GPS
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-[8px]">
              {segments.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlace({
                      id: seg.id,
                      label: seg.name,
                      address: seg.address,
                      district: seg.district,
                      lon: seg.centerLon,
                      lat: seg.centerLat,
                    })
                    setLocationPickerOpen(false)
                  }}
                  className="rounded-[15px] bg-[#f3f4ef] hover:bg-[#eceee6] px-[14px] py-[11px] text-left flex flex-col gap-[2px]"
                >
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14]">
                    {seg.name}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157]">
                    {seg.address}
                  </span>
                </button>
              ))}
              {placeResults.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlace(pl)
                    setLocationPickerOpen(false)
                  }}
                  className="rounded-[15px] border border-[#dfe1d8] bg-white hover:bg-[#f3f4ef] px-[14px] py-[11px] text-left flex flex-col gap-[2px]"
                >
                  <span className="font-['Plus_Jakarta_Sans:SemiBold'] text-[14px] text-[#191b14]">
                    {pl.label}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans:Regular'] text-[12px] text-[#5d6157]">
                    {pl.address}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
