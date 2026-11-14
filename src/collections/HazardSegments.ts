import { revalidateTag } from 'next/cache'
import type { CollectionConfig } from 'payload'

export const HazardSegments: CollectionConfig = {
  slug: 'hazard-segments',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'district', 'hazardType', 'riskStatus', 'waterDepth'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      ({ doc, previousDoc, req: { context } }) => {
        if (!context.disableRevalidate) {
          revalidateTag('hazard-segments', 'max')
          if (doc?.slug) {
            revalidateTag(`segment-${doc.slug}`, 'max')
          }
          if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
            revalidateTag(`segment-${previousDoc.slug}`, 'max')
          }
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) {
          revalidateTag('hazard-segments', 'max')
          if (doc?.slug) {
            revalidateTag(`segment-${doc.slug}`, 'max')
          }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'slug',
      useAsSlug: 'name',
    },
    {
      name: 'address',
      type: 'text',
      required: true,
    },
    {
      name: 'district',
      type: 'text',
      required: true,
    },
    {
      name: 'hazardType',
      type: 'select',
      required: true,
      defaultValue: 'urban-flood',
      options: [
        { label: 'Ngập đô thị (Urban Flood)', value: 'urban-flood' },
        { label: 'Lũ quét (Flash Flood)', value: 'flash-flood' },
        { label: 'Sạt lở đất (Landslide)', value: 'landslide' },
        { label: 'Nước sông dâng (River Overflow)', value: 'river-overflow' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'riskStatus',
      type: 'select',
      required: true,
      defaultValue: 'avoid',
      options: [
        { label: 'Tránh (Avoid)', value: 'avoid' },
        { label: 'Không nên đi (Caution)', value: 'caution' },
        { label: 'Chưa rõ (Unknown)', value: 'unknown' },
        { label: 'Bình thường (Normal)', value: 'normal' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'waterDepth',
      type: 'select',
      required: true,
      defaultValue: 'wheel',
      options: [
        { label: 'Ngang bánh xe (~40 cm+)', value: 'wheel' },
        { label: 'Ngang mắt cá (~15–25 cm)', value: 'ankle' },
        { label: 'Chưa rõ / bùn đất', value: 'unsure' },
        { label: 'Không ngập', value: 'none' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'freshness',
      type: 'select',
      required: true,
      defaultValue: 'fresh',
      options: [
        { label: 'Mới (Fresh blue solid)', value: 'fresh' },
        { label: 'Đang giảm trọng số (Ageing dashed)', value: 'ageing' },
        { label: 'Cảnh báo chính thức (Official)', value: 'official' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'centerLon',
      type: 'number',
      required: true,
    },
    {
      name: 'centerLat',
      type: 'number',
      required: true,
    },
    {
      name: 'coordinatesJson',
      type: 'json',
      required: true,
    },
    {
      name: 'officialSourceNote',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
