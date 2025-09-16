'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@/components/providers/auth-provider'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { ThemeToggle } from '@/components/theme-toggle'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// ===================== 메뉴 스키마 (description 제거, requireAuth 추가) =====================
const NAVIGATIONMENU = [
  { href: '/info', label: '서비스 소개', requireAuth: false },
  {
    label: '게임하기',
    href: '/play',
    requireAuth: true,
    children: [
      { href: '/play/throw', label: '퐁! 던지기' },
      { href: '/play/bomb', label: '터진다..퐁!' },
      { href: '/play/quiz', label: '도전! 금융 골든벨' },
      { href: '/play/rooms', label: '단체게임' },
    ],
  },
  { href: '/donate', label: '기부하기', requireAuth: false },
  { href: '/store', label: '퐁 스토어', requireAuth: true },
  {
    label: '게시판',
    href: '/board',
    requireAuth: false,
    children: [
      { href: '/board/notice', label: '공지사항' },
      { href: '/board/free', label: '자유게시판' },
      { href: '/board/event', label: '이벤트' },
    ],
  },
  {
    label: '고객지원',
    href: '/support',
    requireAuth: false,
    children: [
      { href: '/support/faq', label: 'FAQ' },
      { href: '/support/contact', label: '문의하기' },
    ],
  },
] as const

// ===================== 보호 링크 =====================
function GuardedLink({
  href,
  requireAuth,
  isAuthed,
  onBlocked,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & {
  requireAuth?: boolean
  isAuthed: boolean
  onBlocked: (href: string) => void
}) {
  // 로그인 필요 & 비로그인 → 버튼 렌더
  if (requireAuth && !isAuthed) {
    return (
      <button
        type="button"
        onClick={() => onBlocked(href as string)}
        className={cn(className, 'w-full cursor-pointer text-start')}
        aria-haspopup="dialog"
      >
        {children}
      </button>
    )
  }

  // 접근 허용 → Link
  return (
    <Link href={href} className={className} prefetch={false} {...rest}>
      {children}
    </Link>
  )
}

// ===================== 헤더 =====================
export function AppHeader() {
  const { logout } = useAuth()
  const user = useAuthStore((state) => state.user)
  const isAuthed = !!user
  const pathname = usePathname()
  const router = useRouter()

  // 로그인 안내 모달 상태
  const [loginNoticeOpen, setLoginNoticeOpen] = useState(false)
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  const openLoginNotice = (href?: string) => {
    if (href) setPendingPath(href)
    setLoginNoticeOpen(true)
  }

  const goSignin = () => {
    const redirect = pendingPath ?? pathname
    setLoginNoticeOpen(false)
    setPendingPath(null)
    router.push(`/signin?redirect=${encodeURIComponent(redirect)}`)
  }

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* 로고 */}
          <Link href="/" className="text-primary-shinhan text-2xl font-extrabold">
            퐁당퐁당
          </Link>

          {/* 데스크톱 내비 */}
          <NavigationMenu viewport={false} className="relative hidden md:block">
            <NavigationMenuList className="gap-8">
              {NAVIGATIONMENU.map((item) => {
                const isActive = pathname === item.href

                if ('children' in item) {
                  // ✅ 부모는 Trigger, 자식은 Content 안에서 GuardedLink
                  const groupNeedsAuth = !!item.requireAuth
                  return (
                    <NavigationMenuItem key={item.label} className="text-sm">
                      <NavigationMenuTrigger
                        className={cn(
                          navigationMenuTriggerStyle(),
                          'text-foreground/90 hover:text-foreground bg-transparent text-sm font-medium',
                          isActive && 'text-foreground font-semibold',
                        )}
                        aria-label={`${item.label} 메뉴 열기`}
                      >
                        <span
                          className={cn(
                            'bg-primary-shinhan pointer-events-none absolute -bottom-1.5 left-0 h-[2px] w-0 rounded-full transition-all',
                            isActive && 'w-full',
                          )}
                        />
                        <Link href={item.href}>{item.label}</Link>
                      </NavigationMenuTrigger>

                      <NavigationMenuContent>
                        <ul className="grid w-60 gap-0.5 p-1">
                          {/* (선택) 전체 보기 링크를 맨 위에 두고 싶다면 여기에 GuardedLink 추가 가능 */}
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <NavigationMenuLink asChild>
                                <GuardedLink
                                  href={child.href}
                                  requireAuth={groupNeedsAuth}
                                  isAuthed={isAuthed}
                                  onBlocked={openLoginNotice}
                                  className="hover:bg-muted block rounded-md p-3 no-underline outline-hidden transition-colors focus:shadow-md"
                                >
                                  <div className="text-sm leading-none font-medium">{child.label}</div>
                                </GuardedLink>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  )
                }

                // ✅ 자식 없는 단일 항목은 기존처럼 Link 사용
                return (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <GuardedLink
                        href={item.href}
                        requireAuth={item.requireAuth}
                        isAuthed={isAuthed}
                        onBlocked={openLoginNotice}
                        className={cn(
                          'text-foreground/90 hover:text-foreground relative bg-transparent text-sm font-medium transition-colors hover:bg-transparent',
                          isActive && 'text-foreground font-semibold',
                        )}
                        aria-label={`${item.label}로 이동`}
                      >
                        <span
                          className={cn(
                            'bg-primary-shinhan pointer-events-none absolute -bottom-1.5 left-0 h-[2px] w-0 rounded-full transition-all',
                            isActive && 'w-full',
                          )}
                        />
                        {item.label}
                      </GuardedLink>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            {!isAuthed ? (
              <Link href="/signin" className="hidden md:block" aria-label="로그인 페이지로 이동">
                <Button variant="outline">로그인</Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden rounded-full ring-0 outline-none md:block">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">마이페이지</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>로그아웃</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ThemeToggle />

            {/* 모바일 햄버거 */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="모바일 메뉴 열기">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-primary-shinhan">퐁당퐁당</SheetTitle>
                </SheetHeader>

                {/* 모바일 메뉴 */}
                <div className="mt-4 space-y-1">
                  {NAVIGATIONMENU.map((item) =>
                    'children' in item ? (
                      <Accordion type="single" collapsible key={item.label} className="rounded-md">
                        <AccordionItem value={item.label}>
                          <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                            {item.label}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-1">
                              {item.children.map((c) => {
                                const active = pathname === c.href
                                return (
                                  <GuardedLink
                                    key={c.href}
                                    href={c.href}
                                    requireAuth={item.requireAuth}
                                    isAuthed={isAuthed}
                                    onBlocked={openLoginNotice}
                                    className={cn(
                                      'hover:bg-muted block rounded-md px-3 py-2 text-sm',
                                      active && 'bg-muted',
                                    )}
                                  >
                                    {c.label}
                                  </GuardedLink>
                                )
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <GuardedLink
                        key={item.href}
                        href={item.href}
                        requireAuth={item.requireAuth}
                        isAuthed={isAuthed}
                        onBlocked={openLoginNotice}
                        className={cn(
                          'hover:bg-muted block rounded-md px-3 py-2 text-sm',
                          pathname === item.href && 'bg-muted',
                        )}
                      >
                        {item.label}
                      </GuardedLink>
                    ),
                  )}
                </div>

                {/* 프로필/테마 (모바일 시트 하단) */}
                <div className="mt-6 border-t pt-4">
                  {!isAuthed ? (
                    <Link href="/signin" className="hover:bg-muted block rounded-md px-3 py-2 text-sm">
                      로그인
                    </Link>
                  ) : (
                    <div className="mt-3">
                      <Link href="/profile" className="hover:bg-muted block rounded-md px-3 py-2 text-sm">
                        프로필
                      </Link>
                      <button
                        onClick={logout}
                        className="hover:bg-muted mt-1 w-full rounded-md px-3 py-2 text-left text-sm"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* 로그인 안내 모달 */}
      <Dialog open={loginNoticeOpen} onOpenChange={setLoginNoticeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>로그인이 필요합니다</DialogTitle>
            <DialogDescription>해당 메뉴는 로그인 후 이용할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setLoginNoticeOpen(false)}>
              닫기
            </Button>
            <Button onClick={goSignin} className="bg-secondary-royal hover:bg-secondary-navy">
              로그인하러 가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
