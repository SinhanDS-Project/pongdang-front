'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { revalidateMe, useMe } from '@/hooks/use-me'
import { useIsMobile } from '@/hooks/use-mobile'
import { api } from '@/lib/net/client-axios'
import { cn } from '@/lib/utils'
import { Button } from '@components/ui/button'
import { DialogDescription } from '@radix-ui/react-dialog'
import type { AxiosError } from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardList, Heart, Pin } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/* ── 타입 정의 ───────────────────────── */
type DonationDetail = {
  id: number
  title: string
  content: string
  goal: number
  current: number | null
  img?: string | null
  purpose?: string
  org?: string
  start_date?: string
  end_date?: string
  type?: string
}

type WalletType = 'PONG' | 'DONA'
type ErrorResponse = { message?: string; error?: string }

/* ── 숫자 포맷 ───────────────────────── */
const fmt = (v?: number | null) => (typeof v === 'number' && !isNaN(v) ? v.toLocaleString('ko-KR') : '0')

/* ── 컴포넌트 ───────────────────────── */
export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useMe() // ✅ 유저 정보 불러오기
  const [donation, setDonation] = useState<DonationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [walletType, setWalletType] = useState<WalletType>('PONG')
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [termsOpen, setTermsOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // 모바일 모드 && 가로 모드
  const { isMobile, isLandscape } = useIsMobile()
  const isMobileLandscape = isMobile && isLandscape

  /* ── 기부 상세 불러오기 ───────────────────── */
  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const { data } = await api.get<DonationDetail>(`/api/donation/${id}`)
        setDonation(data)
      } catch (err) {
        const axiosErr = err as AxiosError<ErrorResponse>
        setError(
          axiosErr.response?.status === 404
            ? '❌ 기부 정보가 존재하지 않습니다.'
            : axiosErr.response?.data?.message || '⚠️ 기부 정보를 불러오는 중 오류가 발생했습니다.',
        )
      }
    }

    fetchDonation()
  }, [id])

  if (error) return <p className="p-6 text-center text-red-500">{error}</p>
  if (!donation) return <p className="p-6 text-center">로딩 중…</p>

  const goalPong = Math.floor(donation.goal / 100)
  const currentPong = donation.current ?? 0

  /* ── 기부 API 호출 ───────────────────── */
  const handleDonate = async () => {
    if (!amount || amount <= 0) {
      setFormError('⚠️ 기부 퐁을 입력해주세요.')
      return
    }
    setFormError(null)

    try {
      setLoading(true)
      await api.post('/api/donation', {
        donation_info_id: donation.id,
        amount,
        wallet_type: walletType,
      })

      await revalidateMe() //  기부 성공 후 최신 유저 정보 새로고침

      setDonateOpen(false)
      setShowCelebration(true)
      setAmount(0)
      setWalletType('PONG')
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>
      setFormError(axiosErr.response?.data?.message || '❌ 기부 실패')
    } finally {
      setLoading(false)
    }
  }

  /* ── UI ────────────────────────────── */
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="relative mb-8 aspect-[8/3] w-full overflow-hidden rounded-lg shadow">
        <Image src={donation.img || '/placeholder-banner.png'} alt={donation.title} fill className="object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end bg-black/30 p-4 text-white">
          <div className="text-2xl font-bold md:text-3xl">{donation.title}</div>
          {donation.org && <p className="mt-1 text-base opacity-90">{donation.org}</p>}
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-foreground/70 flex items-end gap-2">
            <span className="text-secondary-royal text-3xl font-extrabold">모집기간: </span>
            <span className="text-2xl font-bold">
              {donation.start_date?.slice(0, 10)} ~ {donation.end_date?.slice(0, 10)}
            </span>
          </div>
        </div>
        <Button
          size={'lg'}
          onClick={() => setTermsOpen(true)}
          className="bg-secondary-royal hover:bg-secondary-sky text-base font-bold"
        >
          <Heart />
          기부하기
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-x-2">
          <Pin className="text-red-500" />
          <span className="text-2xl font-extrabold">소개</span>
        </div>
        <Card className="shadow-lg">
          <CardContent className="text-accent-foreground px-4 leading-relaxed font-semibold whitespace-pre-wrap">
            {donation.content}
          </CardContent>
        </Card>
      </div>
      <Separator className="my-8" />
      <div className="space-y-4">
        <div className="flex items-center gap-x-2">
          <ClipboardList />
          <span className="text-2xl font-extrabold">목적</span>
        </div>
        <Card className="shadow-lg">
          <CardContent className="text-accent-foreground px-4 leading-relaxed font-semibold whitespace-pre-wrap">
            {donation.purpose}
          </CardContent>
        </Card>
      </div>
      <Separator className="my-8" />
      <p className="text-center text-gray-600">여러분의 소중한 기부가 큰 변화를 만듭니다.</p>

      {/* 약관 모달 */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>기부 약관 동의</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-8">
            <div className="text-foreground space-y-4">
              <p className="text-base font-semibold">
                기부금 영수증 발급 및 세액공제를 위해 개인정보 제공 동의가 필요합니다.
              </p>
              <div className="flex flex-col">
                <p className="mb-1 text-base font-medium">탈퇴 시 아래 내용이 적용됩니다:</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>제공 받는 자 : 국세청</li>
                  <li>제공 항목 : 이름, 주민등록번호(암호화된 값), 기부 내역</li>
                  <li>이용 목적 : 기부금 영수증 발행 및 세액 공제</li>
                  <li>보유 및 이용기간 : 관련 법령에 따른 보관 기간</li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setTermsOpen(false)}>
                동의하지 않음
              </Button>
              <Button
                className="bg-sky-500 text-white hover:bg-sky-600"
                onClick={() => {
                  setTermsOpen(false)
                  setDonateOpen(true)
                }}
              >
                동의하고 계속
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 기부 모달 */}
      <Dialog open={donateOpen} onOpenChange={setDonateOpen}>
        <DialogContent className={cn('max-h-[90dvh] max-w-lg', isMobileLandscape && 'h-full')}>
          <DialogHeader>
            <DialogTitle>기부 퐁 선택 & 입력</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              어떤 퐁으로 기부할지 선택하고, 기부할 퐁을 입력하세요.
            </DialogDescription>
          </DialogHeader>

          {/* 잔액 카드 */}
          <div className="my-4 grid grid-cols-2 gap-4">
            <div
              onClick={() => setWalletType('PONG')}
              className={`cursor-pointer rounded-lg border p-4 text-center shadow-sm transition ${
                walletType === 'PONG' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <h3 className="text-lg font-bold">일반퐁</h3>
              <p className="text-sm text-gray-600">일반 활동으로 적립된 퐁</p>
              <p className="mt-2 font-semibold text-sky-600">{user ? fmt(user.pong_balance) : 0} 보유</p>
            </div>

            <div
              onClick={() => setWalletType('DONA')}
              className={`cursor-pointer rounded-lg border p-4 text-center shadow-sm transition ${
                walletType === 'DONA' ? 'border-rose-400 bg-rose-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <h3 className="text-lg font-bold">기부퐁</h3>
              <p className="text-sm text-gray-600">특별 활동으로 적립된 퐁</p>
              <p className="mt-2 font-semibold text-rose-400">{user ? fmt(user.dona_balance) : 0} 보유</p>
            </div>
          </div>

          {/* 금액 입력 */}
          <div className="space-y-2">
            <p className="text-sm">기부할 퐁:</p>
            <Input
              type="number"
              placeholder="기부 퐁을 입력하세요"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            {amount > 0 && user && (
              <p className="text-sm text-gray-500">
                예상 잔액 퐁:{' '}
                {walletType === 'PONG' ? fmt(user.pong_balance - amount) : fmt(user.dona_balance - amount)}
              </p>
            )}
          </div>

          {/* 진행 퍼센트 */}
          <div className="mt-4">
            <p className="mb-2 text-sm">이번 기부 후 예상 진행률:</p>
            <Progress value={Math.min(100, Math.round(((currentPong + amount) / goalPong) * 100))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setDonateOpen(false)}>
              취소
            </Button>
            <Button disabled={loading} className="bg-sky-500 text-white hover:bg-sky-600" onClick={handleDonate}>
              {loading ? '기부 중...' : '기부하기'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🎉 기부 감사 애니메이션 */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.8 }}
              className="flex h-40 w-40 items-center justify-center rounded-full bg-yellow-400 shadow-2xl"
            >
              <span className="text-5xl">💙</span>
            </motion.div>

            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="mt-6 text-center text-3xl font-extrabold text-white drop-shadow-lg"
            >
              기부 완료!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-3 text-center text-lg text-gray-200"
            >
              소중한 퐁이 전달되었습니다 🙏 <br />
              <span className="mt-1 block text-xl font-semibold text-white">감사합니다</span>
            </motion.p>

            <motion.button
              onClick={() => setShowCelebration(false)}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 rounded-full bg-sky-500 px-8 py-3 font-semibold text-white shadow-lg hover:bg-sky-600"
            >
              확인
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
