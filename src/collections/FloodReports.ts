import { revalidateTag } from 'next/cache'
import type { CollectionConfig } from 'payload'

export const FloodReports: CollectionConfig = {
  slug: 'flood-reports',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'segmentName', 'depthCategory', 'moderationStatus', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [
      ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) {
          revalidateTag('flood-reports', 'max')
          revalidateTag('hazard-segments', 'max')
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req: { context } }) => {
        if (!context.disableRevalidate) {
          revalidateTag('flood-reports', 'max')
          revalidateTag('hazard-segments', 'max')
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'segment',
      type: 'relationship',
      relationTo: 'hazard-segments',
    },
    {
      name: 'segmentName',
      type: 'text',
      required: true,
    },
    {
      name: 'address',
      type: 'text',
      required: true,
    },
    {
      name: 'longitude',
      type: 'number',
      required: true,
    },
    {
      name: 'latitude',
      type: 'number',
      required: true,
    },
    {
      name: 'snappedGeometry',
      type: 'json',
    },
    {
      name: 'depthCategory',
      type: 'select',
      required: true,
      options: [
        { label: 'Mắt cá (Ankle)', value: 'ankle' },
        { label: 'Bánh xe (Wheel)', value: 'wheel' },
        { label: 'Chưa rõ (Unsure)', value: 'unsure' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'aiProposedCategory',
      type: 'select',
      options: [
        { label: 'Mắt cá (Ankle)', value: 'ankle' },
        { label: 'Bánh xe (Wheel)', value: 'wheel' },
        { label: 'Chưa rõ (Unsure)', value: 'unsure' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'aiConfidence',
      type: 'number',
      min: 0,
      max: 1,
    },
    {
      name: 'aiSummary',
      type: 'textarea',
    },
    {
      name: 'aiProvider',
      type: 'text',
    },
    {
      name: 'transcript',
      type: 'text',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'dryGroundConfirmed',
      type: 'checkbox',
      required: true,
      defaultValue: true,
    },
    {
      name: 'moderationStatus',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Đang tính (Active)', value: 'active' },
        { label: 'Đang giảm trọng số (Decaying)', value: 'decaying' },
        { label: 'Hết hạn >12h (Expired)', value: 'expired' },
      ],
      access: {
        create: () => false,
        update: ({ req }) => Boolean(req.user),
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'clientDeviceToken',
      type: 'text',
      index: true,
      access: {
        read: () => false,
        update: () => false,
      },
    },
  ],
  timestamps: true,
}
