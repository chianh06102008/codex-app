'use client'

import { HeaderBack } from '@/components/floodscout/SharedPrimitives'
import { useCameraSafeTopInset } from '@/hooks/useGsap'
import type { HazardSegmentDTO, Language, LiveHazardSnapshot } from '@/types/floodscout'

interface WarningScreenProps {
  lang: Language
  hazards: LiveHazardSnapshot | null
  segments: HazardSegmentDTO[]
  onSelectSegment: (seg: HazardSegmentDTO) => void
  onBack: () => void
}

export function WarningScreen({ lang, hazards, onBack }: WarningScreenProps) {
  const topInset = useCameraSafeTopInset()
  const vi = lang === 'vi'
  const bulletin = hazards?.bulletin
  const status = hazards?.officialStatus
  const message = status === 'dry'
    ? vi ? 'Dữ liệu hiện tại chưa ghi nhận mưa tại vị trí của bạn.' : 'The latest weather data shows no rain at your location.'
    : status === 'unmatched'
      ? vi ? 'Chưa tìm thấy bản tin còn hiệu lực cho địa phương của bạn.' : 'No current bulletin could be matched to your locality.'
      : vi ? 'Cần vị trí và dữ liệu cập nhật để kiểm tra cảnh báo địa phương.' : 'Local alerts require your location and current source data.'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-4 px-4 pb-28" style={{ paddingTop: topInset }}>
      <HeaderBack
        title={vi ? 'Cảnh báo chính thức' : 'Official warnings'}
        subtitle={vi ? 'Trung tâm Dự báo KTTV Quốc gia' : 'National Center for Hydro-Meteorological Forecasting'}
        onBack={onBack}
        lang={lang}
      />
      {bulletin ? (
        <article className="min-w-0 rounded-2xl border border-orange-700 bg-orange-50 p-4 text-stone-900">
          <h2 lang="vi" className="break-words text-lg font-bold">{bulletin.headlineVi}</h2>
          <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-3 gap-y-2 text-sm">
            {[
              [vi ? 'Phát hành' : 'Issued', bulletin.issuedAtFormatted],
              [vi ? 'Hiệu lực đến' : 'Valid until', bulletin.validUntilFormatted],
              [vi ? 'Địa phương' : 'Locality', bulletin.affectedAreasVi],
              [vi ? 'Đã kiểm tra' : 'Checked', bulletin.fetchedAtFormatted],
            ].map(([label, value]) => (
              <div className="contents" key={label}>
                <dt className="text-stone-600">{label}</dt>
                <dd className="break-words font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <a className="mt-4 inline-flex min-h-11 items-center font-semibold underline" href={bulletin.sourceUrl} target="_blank" rel="noreferrer">
            {vi ? 'Xem bản tin gốc' : 'Read original bulletin'}
          </a>
        </article>
      ) : (
        <p role="status" className="rounded-2xl bg-white p-4 text-stone-700">{message}</p>
      )}
      <a className="inline-flex min-h-11 items-center self-start underline" href="https://nchmf.gov.vn/Kttv/" target="_blank" rel="noreferrer">
        {vi ? 'Mở cổng thông tin KTTV Quốc gia' : 'Open the NCHMF portal'}
      </a>
    </main>
  )
}
