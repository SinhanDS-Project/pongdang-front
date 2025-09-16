import type { ReactNode } from 'react'

import ProfilePage from './page'

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
      <div className="flex min-h-screen">
        <div className="flex-1">{children}</div>
      </div>
  );
}
