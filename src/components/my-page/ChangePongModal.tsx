'use client'
import { CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'


import { useMe } from '@/hooks/use-me'
import { api } from '@/lib/net/client-axios'


type Panel = 'change' | 'success'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ChangePongModal({ open, onOpenChange }: Props) {
  const { mutate } = useMe()
  const [panel, setPanel] = useState<Panel>('change')
  const [loading, setLoading] = useState(false)
  const [bettingPoint, setBettingPoint] = useState<number | null>(null)
  const [amount, setAmount] = useState<string>('') // 입력값
  const [error, setError] = useState<string>('') // 에러 메시지

  // 닫힐 때 초기화
  const handleOpenChange = async (v: boolean) => {
    setPanel('change')
    onOpenChange(v)
    if (!v) {
      mutate()
      setBettingPoint(null)
      setAmount('')
      setError('')
    }
  }

  // 보유 포인트 조회
  useEffect(() => {
    if (open) {
      api
        .get('/api/user/find-betting')
        .then((res) => setBettingPoint(res.data?.point_balance ?? 0))
        .catch((err) => {
          console.error('마이신한포인트 조회 실패:', err)
          setBettingPoint(0)
        })
    }
  }, [open])

  // 포인트 전환
  const handleChangePong = async () => {
    const amt = Number(amount)

    // 유효성 검사
    if (!amt || amt <= 0) {
      setError('전환할 포인트를 입력해주세요.')
      return
    }
    if (amt % 100 !== 0) {
      setError('100P 단위로만 전환할 수 있습니다.')
      return
    }
    if (bettingPoint !== null && amt > bettingPoint) {
      setError(`보유한 마이신한포인트(${bettingPoint}P)보다 많이 전환할 수 없습니다.`)
      return
    }

    setError('') // 에러 초기화

    try {
      setLoading(true)
      await api.post('/api/user/betting/convert', { amount: amt })
      setPanel('success')
    } catch (err) {
      console.error('포인트 전환 실패:', err)
      setError('포인트 전환에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 환산된 퐁 계산
  const convertedPong = Math.floor(Number(amount || 0) / 100)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-0 shadow-xl">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              {panel === 'change' ? '포인트 전환하기' : '알림'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-y-8">
            {/* 성공 화면 */}
            {panel === 'success' && <Success onClose={() => handleOpenChange(false)} />}

            {/* 입력 및 전환 */}
            {panel === 'change' && (
              <div className="flex flex-col gap-6">
                {/* 보유 포인트 */}
                <div className="rounded-lg bg-gray-100 p-4 text-center">
                  <p className="text-lg font-semibold">
                    보유 마이신한포인트:{' '}
                    <span className="text-secondary-royal">
                      {bettingPoint !== null ? bettingPoint.toLocaleString() : '-'}
                    </span>{' '}
                    P
                    {bettingPoint !== null && (
                      <span className="text-muted-foreground ml-2 text-sm">
                        (≈ {Math.floor(bettingPoint / 100).toLocaleString()} 퐁)
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">※ 100P = 1퐁</p>
                </div>

                {/* 입력창 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">전환할 마이신한포인트 입력 (100P 단위)</label>
                  <Input
                    type="text"
                    value={amount ? Number(amount).toLocaleString() : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      setAmount(raw)
                    }}
                    placeholder="전환할 마이신한포인트를 입력하세요"
                  />

                  {/*  에러 메시지 */}
                  {error && <p className="text-sm font-medium text-red-500">{error}</p>}

                  <p className="text-muted-foreground text-sm">
                    전환 후 퐁:{' '}
                    <span className="text-secondary-red font-semibold">{convertedPong.toLocaleString()}</span> 퐁
                  </p>
                </div>

                {/* 버튼 */}
                <Button
                  type="button"
                  variant="default"
                  disabled={loading}
                  onClick={handleChangePong}
                  className="bg-secondary-sky hover:bg-secondary-royal rounded text-lg font-bold"
                >
                  {loading ? '전환 중...' : '포인트 전환하기'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Success({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <CheckCircle className="text-secondary-sky h-12 w-12" />
      <h3 className="text-2xl font-bold">포인트가 전환되었습니다!</h3>
      <p className="text-muted-foreground">이제 전환된 퐁으로 서비스를 이용해보세요.</p>

      <Button
        type="button"
        variant="default"
        onClick={onClose}
        className="bg-secondary-sky hover:bg-secondary-royal w-full rounded text-lg font-bold"
      >
        확인
      </Button>
    </div>
  )
}

export default ChangePongModal
