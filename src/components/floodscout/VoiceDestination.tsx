'use client'

import { useEffect, useRef, useState } from 'react'
import type { Language } from '@/types/floodscout'

export function VoiceDestination({ lang, onDestination }: {
  lang: Language
  onDestination: (destination: string) => void
}) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'recording' | 'loading' | 'error'>('idle')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const controller = useRef<AbortController | null>(null)
  const active = useRef(true)
  const vi = lang === 'vi'

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      controller.current?.abort()
      if (timer.current) clearTimeout(timer.current)
      stream.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function toggle() {
    if (recorder.current?.state === 'recording') {
      recorder.current.stop()
      return
    }
    setStatus('starting')
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!active.current) {
        input.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current = input
      const recording = new MediaRecorder(input)
      recorder.current = recording
      const chunks: Blob[] = []
      recording.ondataavailable = ({ data }) => { if (data.size) chunks.push(data) }
      recording.onstop = async () => {
        if (timer.current) clearTimeout(timer.current)
        input.getTracks().forEach((track) => track.stop())
        if (!active.current) return
        setStatus('loading')
        const type = recording.mimeType
        const extension = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm'
        const form = new FormData()
        form.set('audio', new Blob(chunks, { type }), `destination.${extension}`)
        form.set('lang', lang)
        const request = new AbortController()
        controller.current = request
        try {
          const response = await fetch('/runtime/voice', { method: 'POST', body: form, signal: request.signal })
          const result = await response.json()
          if (!response.ok || !result.destination) throw new Error('Destination unavailable')
          if (active.current) {
            onDestination(result.destination)
            setStatus('idle')
          }
        } catch {
          if (active.current) setStatus('error')
        }
      }
      recording.start()
      setStatus('recording')
      timer.current = setTimeout(() => {
        if (recording.state === 'recording') recording.stop()
      }, 12_000)
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop())
      if (active.current) setStatus('error')
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={toggle} disabled={status === 'starting' || status === 'loading'}
        className="min-h-11 rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold disabled:opacity-60">
        {status === 'recording' ? (vi ? 'Dừng ghi âm' : 'Stop recording')
          : status === 'loading' ? (vi ? 'Đang xử lý giọng nói…' : 'Processing voice…')
            : vi ? 'Nói điểm đến' : 'Speak destination'}
      </button>
      {status === 'error' ? <p role="status" className="text-sm text-stone-700">
        {vi ? 'Không nhận được điểm đến. Bạn có thể nhập địa chỉ.' : 'Voice destination unavailable. You can type the address.'}
      </p> : null}
    </div>
  )
}
