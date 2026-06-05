'use client'
import { useRowLabel } from '@payloadcms/ui'

export const ProvinceRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ provinceName?: string }>()
  return <>{data?.provinceName || `Tỉnh ${(rowNumber ?? 0) + 1}`}</>
}
