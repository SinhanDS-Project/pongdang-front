'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useMe } from '@/hooks/use-me'

export default function InfoPage() {
  const router = useRouter()
  const { status } = useMe()

  const handleClick = () => {
    if (status === 'authenticated') {
      router.push('/mypage')
    } else {
      router.push('/signup')
    }
  }

  return (
    <main className="flex flex-col items-center">
      {/* Hero 섹션 */}
      <section className="relative min-h-[90vh] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          {/* 텍스트 영역 */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-left"
          >
            <h1 className="mb-6 text-5xl font-extrabold text-gray-900 sm:text-6xl">
              <span className="text-blue-600">금융</span>의 새로운 기준
            </h1>
            <p className="mb-8 text-lg text-gray-700 sm:text-xl">
              게이미피케이션을 주도하는 퐁당퐁당과 함께, 새로운 금융 문화를 시작해보세요.
            </p>
            <Button
              onClick={handleClick}
              className="rounded-full bg-blue-600 px-8 py-4 text-lg text-white shadow-lg hover:scale-105"
            >
              회원가입하기
            </Button>
          </motion.div>

          {/* 이미지 영역 */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center"
          >
            <Image
              src="/service.png"
              alt="금융 아이콘"
              width={360}
              height={360}
              className="rounded-2xl drop-shadow-xl"
            />
          </motion.div>
        </div>

        {/* Hero 구름 장식 */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [0, -25, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
          className="absolute -bottom-28 left-1/2 -translate-x-1/2"
        >
          <div className="relative flex flex-wrap justify-center gap-6">
            <span className="absolute left-0 h-40 w-40 rounded-full bg-gradient-to-br from-white to-sky-100 opacity-90 blur-[6px]" />
            <span className="absolute top-4 left-16 h-36 w-36 rounded-full bg-gradient-to-br from-blue-50 to-blue-200 opacity-80 blur-[8px]" />
            <span className="absolute top-2 left-32 h-32 w-32 rounded-full bg-gradient-to-br from-sky-50 to-cyan-100 opacity-70 blur-[10px]" />
            <span className="absolute top-6 left-52 h-28 w-28 rounded-full bg-gradient-to-br from-white to-indigo-50 opacity-60 blur-[6px]" />
            <span className="absolute top-2 left-72 h-24 w-24 rounded-full bg-gradient-to-br from-white to-pink-50 opacity-55 blur-[5px]" />
          </div>
        </motion.div>
      </section>

      {/* 서비스 소개 섹션 */}
      <section className="w-full bg-white pt-80 pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative mb-20 flex justify-center">
            {/* 위쪽 장식 */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
              className="absolute -top-24 left-1/2 flex -translate-x-1/2 items-center gap-8"
            >
              <span className="h-16 w-16 rounded-full bg-gradient-to-br from-white to-sky-200 shadow-md" />
              <span className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-200 shadow-lg" />
              <span className="h-32 w-32 rounded-full bg-gradient-to-br from-pink-100 to-rose-200 shadow-xl" />
              <span className="h-20 w-20 rounded-full bg-gradient-to-tr from-cyan-100 to-teal-200 shadow-md" />
            </motion.div>
          </div>

          {/* 서비스 카드 */}
          <div className="flex flex-col gap-32">
            {[
              {
                src: '/service_fun.png',
                title: '금융을 재미있게!',
                desc: '단체게임, 미니게임, 퀴즈 등 게이미피케이션 기반 금융 서비스를 제공하여 즐거운 금융 활동을 경험할 수 있습니다.',
              },
              {
                src: '/service_donation.png',
                title: '기부를 부담없이!',
                desc: (
                  <>
                    보상과 기부를 연결하여 즐겁게 나눔에 참여할 수 있는 <br />
                    새로운 기부 문화를 제공합니다.
                  </>
                ),
              },
              {
                src: '/service_shop.png',
                title: '다양한 상품까지!',
                desc: '기프티콘, 금융상품 쿠폰, 쇼핑 쿠폰 등 다양한 상품 교환 서비스를 통해 보상과 혜택을 누릴 수 있습니다.',
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`flex flex-col items-center gap-12 md:flex-row ${
                  s.title === '기부를 부담없이!' ? 'ml-16' : ''
                }`}
              >
                {s.title === '기부를 부담없이!' ? (
                  <>
                    <div className="max-w-xl flex-1 text-center">
                      <h3 className="mb-4 text-3xl font-bold text-gray-900">{s.title}</h3>
                      <p className="text-lg text-gray-700">{s.desc}</p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <Image
                        src={s.src}
                        alt={s.title}
                        width={320}
                        height={320}
                        className="rounded-2xl drop-shadow-xl"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      <Image
                        src={s.src}
                        alt={s.title}
                        width={320}
                        height={320}
                        className="animate-float-delayed rounded-2xl drop-shadow-xl"
                      />
                    </div>
                    <div className="max-w-xl text-center md:text-left">
                      <h3 className="mb-4 text-3xl font-bold text-gray-900">{s.title}</h3>
                      <p className="text-lg text-gray-700">{s.desc}</p>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mt-20 flex flex-col items-center justify-center overflow-hidden py-32">
        {/* 구름 */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [0, -25, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
          className="mb- flex flex-wrap justify-center gap-6"
        >
          <span className="h-40 w-40 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 opacity-70" />
          <span className="h-36 w-36 rounded-full bg-gradient-to-tr from-purple-300 to-indigo-500 opacity-65 blur-[25px]" />
          <span className="h-32 w-32 rounded-full bg-gradient-to-br from-pink-300 to-rose-500 opacity-60 blur-[30px]" />
          <span className="h-28 w-28 rounded-full bg-gradient-to-tr from-teal-300 to-cyan-500 opacity-60 blur-[20px]" />
          <span className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 opacity-55 blur-[25px]" />
        </motion.div>

        {/* QR 코드 , 텍스트 (구름 밑에) */}
        <div className="flex flex-col items-center rounded-xl bg-gray-400 p-10">
          <Image
            src="/qrcode.png"
            alt="모바일 QR 코드"
            width={220}
            height={220}
            className="mb-8 rounded-xl shadow-lg"
          />
          <h2 className="mb-4 text-2xl font-bold text-gray-900">퐁당퐁당 모바일 접속</h2>
          <p className="text-gray-700">QR 코드를 스캔하여 모바일로 접속하세요!</p>
        </div>
      </section>
    </main>
  )
}
