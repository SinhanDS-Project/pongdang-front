import type { ReactNode } from 'react'

import DonationPage from './page'

export default function DonationLayout({ children }: { children: ReactNode }) {
  return (
      <div className="flex min-h-screen">
        <div className="flex-1">{children}</div>
      </div>
  );
}
