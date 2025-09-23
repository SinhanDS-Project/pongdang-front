// src/app/admin/donation/[id]/page.tsx
import { DonationForm } from "@components/admin-page/donation/DonationForm"

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DonationForm donationId={id} />
}
