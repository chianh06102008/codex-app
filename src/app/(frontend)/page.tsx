import React from 'react'
import { FloodScoutClientApp } from '@/components/floodscout/FloodScoutClientApp'
import { getCachedFloodReports, getCachedHazardSegments } from '@/lib/floodscout-queries'

export default async function HomePage() {
  const [segments, reports] = await Promise.all([
    getCachedHazardSegments(),
    getCachedFloodReports(),
  ])

  return (
    <main className="min-h-dvh w-full">
      <FloodScoutClientApp initialSegments={segments} initialReports={reports} />
    </main>
  )
}
