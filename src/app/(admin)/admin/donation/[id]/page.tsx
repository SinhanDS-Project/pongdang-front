// src/app/admin/donation/[id]/page.tsx
import { DonationForm } from "@components/admin-page/donation/DonationForm"
import type { Donation } from "@/types/admin"

export default function Page({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { data?: string }
}) {
  const { id } = params

  let initialData: Donation | undefined
  if (searchParams?.data) {
    try {
      initialData = JSON.parse(decodeURIComponent(searchParams.data)) as Donation
    } catch {}
  }

  return <DonationForm donationId={id} initialData={initialData} />
}
