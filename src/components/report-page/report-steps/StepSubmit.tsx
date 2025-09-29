import Lottie from 'lottie-react'

import { Button } from '@/components/ui/button'

import AI_LOADING from '@public/AI_Loading.json'

export function StepSubmit({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-y-4">
      <Lottie animationData={AI_LOADING} className="w-52" />

      <Button size={'lg'} onClick={onOpen} className="bg-secondary-royal hover:bg-secondary-sky">
        생성된 리포트 보기
      </Button>
    </div>
  )
}
