// src/app/admin/donation/[id]/page.tsx
import { DonationForm } from "@components/admin-page/donation/DonationForm"

export default function Page({ params }: { params: { id: string } }) {
  return <DonationForm donationId={params.id} />
}
