'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/net/client-axios'
import type { AxiosError } from 'axios'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

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

type User = {
  id: number
  user_name: string
  nickname: string
  pong_balance: number
  dona_balance: number
}

type ErrorResponse = {
  message?: string
  error?: string
}

const fmt = (v?: number | null) => (typeof v === 'number' && !isNaN(v) ? v.toLocaleString('ko-KR') : '0')

/* ── 컴포넌트 ───────────────────────── */
export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [donation, setDonation] = useState<DonationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [walletType, setWalletType] = useState<WalletType>('PONG')
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // 폼 에러 메시지
  const [formError, setFormError] = useState<string | null>(null)

  // 모달 상태
  const [termsOpen, setTermsOpen] = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)

  // 기부 완료 축하 화면 상태
  const [showCelebration, setShowCelebration] = useState(false)
  
  // 모바일 모드 && 가로 모드
  const { isMobile, isLandscape } = useIsMobile()
  const isMobileLandscape = isMobile && isLandscape
  

  /* ── 데이터 로딩 ───────────────────── */
  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const { data } = await api.get<DonationDetail>(`/api/donation/${id}`)
        setDonation(data)
      } catch (err) {
        const axiosErr = err as AxiosError<ErrorResponse>
        if (axiosErr.response?.status === 404) {
          setError('❌ 기부 정보가 존재하지 않습니다.')
        } else {
          setError(axiosErr.response?.data?.message || '⚠️ 기부 정보를 불러오는 중 오류가 발생했습니다.')
        }
      }
    }

    const fetchUser = async () => {
      try {
        const { data } = await api.get<User>('/api/user/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        setUser(data)
      } catch {
        // 로그인 안 된 경우 무시
      }
    }

    fetchDonation()
    fetchUser()
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
      await api.post(
        '/api/donation',
        {
          donation_info_id: donation.id,
          amount,
          wallet_type: walletType,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      )
      setDonateOpen(false) // 기부 모달 닫기
      setShowCelebration(true) // 축하 화면 열기
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
    <>
      <div className="flex w-full justify-center px-2 py-6 sm:px-4 md:px-6">
        <div className="w-full max-w-4xl space-y-8">
          {/* 이미지 + 제목 */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg shadow">
            <Image src={donation.img || '/placeholder-banner.png'} alt={donation.title} fill className="object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end bg-black/40 p-4 text-white">
              <h1 className="text-2xl font-bold md:text-3xl">{donation.title}</h1>
              {donation.org && <p className="mt-1 text-base opacity-90">{donation.org}</p>}
            </div>
          </div>

          {/* 모금 소개 */}
          <section className="space-y-4 rounded-lg bg-gray-50 p-4 shadow-sm md:p-6">
            <h2 className="text-xl font-semibold">📌 모금 소개</h2>
            <p className="my-4 text-base leading-relaxed text-gray-800 md:my-6 md:text-lg">{donation.content}</p>
          </section>

          {/* 목적 */}
          {donation.purpose && (
            <section className="space-y-4 rounded-lg bg-gray-50 p-4 shadow-sm md:p-6">
              <h2 className="text-xl font-semibold">🎯 목적</h2>
              <p className="my-2 text-base text-gray-700 md:my-4 md:text-lg">{donation.purpose}</p>
            </section>
          )}

          {/* 모집 기간 */}
          <section className="space-y-4 rounded-lg bg-gray-50 p-4 shadow-sm md:p-6">
            <h2 className="text-xl font-semibold">📅 모집 기간</h2>
            <p className="my-2 text-base text-gray-600 md:my-4 md:text-lg">
              {donation.start_date?.slice(0, 10)} ~ {donation.end_date?.slice(0, 10)}
            </p>
          </section>

          <hr className="my-6 border-t border-gray-300" />

          {/* 기부하기 섹션 */}
          <section className="space-y-4 text-center">
            <p className="text-gray-600">여러분의 소중한 기부가 큰 변화를 만듭니다.</p>

            {/* 약관 모달 */}
            <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full bg-sky-500 px-12 py-4 text-lg font-extrabold text-white shadow-md transition-transform hover:scale-105 hover:bg-sky-600"
                >
                  ❤️ 지금 기부하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>기부 약관 동의</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] space-y-4 overflow-y-auto text-sm text-gray-700">
                  <p>기부금 영수증 발급 및 세액공제를 위해 개인정보 제공 동의가 필요합니다.</p>
                  <p>
                    1. 제공 받는 자 : 국세청 <br />
                    2. 제공 항목 : 이름, 주민등록번호(암호화된 값), 기부 내역 <br />
                    3. 이용 목적 : 기부금 영수증 발행 및 세액 공제 <br />
                    4. 보유 및 이용기간 : 관련 법령에 따른 보관 기간
                  </p>
                </div>
                <DialogFooter className="flex justify-end gap-2">
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
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 기부 모달 */}
            <Dialog open={donateOpen} onOpenChange={setDonateOpen}>
              <DialogContent className={cn("max-w-lg max-h-[90dvh]", isMobileLandscape && "h-full")}>
                <DialogHeader>
                  <DialogTitle>기부 퐁 선택 & 입력</DialogTitle>
                  <p className="mt-1 text-sm text-gray-500">어떤 퐁으로 기부할지 선택하고, 기부할 퐁을 입력하세요.</p>
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
                      walletType === 'DONA' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="text-lg font-bold">기부퐁</h3>
                    <p className="text-sm text-gray-600">특별 활동으로 적립된 퐁</p>
                    <p className="mt-2 font-semibold text-sky-600">{user ? fmt(user.dona_balance) : 0} 보유</p>
                  </div>
                </div>

                {/* 금액 입력 */}
                <div className="space-y-2">
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
                  <p className="mb-1 text-sm text-gray-600">이번 기부 후 예상 진행률:</p>
                  <Progress value={Math.min(100, Math.round(((currentPong + amount) / goalPong) * 100))} />
                </div>

                <DialogFooter className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDonateOpen(false)}>
                    취소
                  </Button>
                  <Button disabled={loading} className="bg-sky-500 text-white hover:bg-sky-600" onClick={handleDonate}>
                    {loading ? '기부 중...' : '기부하기'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        </div>
      </div>

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
    </>
  )
}
