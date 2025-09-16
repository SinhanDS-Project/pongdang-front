import type { ReactNode } from 'react'

import DonationDetailPage from './page'

export default function DonationDetailPageLayout({ children }: { children: ReactNode }) {
  return (
      <div className="flex min-h-screen">
        <div className="flex-1">{children}</div>
      </div>
  );
}
