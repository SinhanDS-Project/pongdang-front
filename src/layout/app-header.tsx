'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { useAuthStore } from '@/stores/auth-store'

import { useAuth } from '@/components/providers/auth-provider'

import { ThemeToggle } from '@/components/theme-toggle'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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

const NAVIGATIONMENU = [
  { href: '/', label: '서비스 소개' },
  {
    label: '게임하기',
    children: [
      { href: '#', label: '퐁! 던지기', description: '오늘의 운세는? 동전 한 번에 퐁 GET!!' },
      { href: '#', label: '터진다..퐁!', description: '지뢰를 피해 생존하라! 끝까지 버티면 퐁 보상!' },
      { href: '#', label: '도전! 금융 골든벨', description: '오늘의 금융 퀴즈! 정답 맞히고 퐁을 모아보세요' },
      { href: '#', label: '단체게임', description: '오늘의 금융 퀴즈! 정답 맞히고 퐁을 모아보세요' },
    ],
  },
  { href: '#', label: '기부하기' },
  { href: '#', label: '퐁 스토어' },
  {
    label: '게시판',
    children: [
      { href: '#', label: '공지사항' },
      { href: '#', label: '자유게시판' },
      { href: '#', label: '이벤트' },
    ],
  },
  {
    label: '고객지원',
    children: [
      { href: '#', label: 'FAQ' },
      { href: '#', label: '문의하기' },
    ],
  },
] as const

export function AppHeader() {
  const { logout } = useAuth()
  const user = useAuthStore((state) => state.user)

  const pathname = usePathname()

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
                // 단일 링크
                if ('href' in item) {
                  const isActive = pathname === item.href
                  return (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link
                          href={item.href}
                          className={cn(
                            'text-foreground/90 hover:text-foreground relative bg-transparent text-sm font-medium transition-colors hover:bg-transparent',
                            isActive && 'text-foreground font-semibold',
                          )}
                        >
                          <span
                            className={cn(
                              'bg-primary-shinhan pointer-events-none absolute -bottom-1.5 left-0 h-[2px] w-0 rounded-full transition-all',
                              isActive && 'w-full',
                            )}
                          />
                          {item.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                }

                // 드롭다운(하위 메뉴) — shadcn 예제 스타일
                return (
                  <NavigationMenuItem key={item.label} className="text-sm">
                    <NavigationMenuTrigger className="gap-1 bg-transparent hover:bg-transparent">
                      <span className="text-foreground/90 hover:text-foreground font-medium">{item.label}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-60 gap-0.5 p-1">
                        {item.children.map((child) => (
                          <ListItem key={child.href} href={child.href} title={child.label}>
                            {'description' in child ? child.description : null}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            {!user ? (
              // 로그인: 비로그인 시
              <Link href="/signin" className="hidden md:block" aria-label="로그인 페이지로 이동">
                <Button variant="outline">로그인</Button>
              </Link>
            ) : (
              // 아바타(데스크톱): 로그인 시
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
            {/* FIXME: 모바일 버전 수정 필요 */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-primary-shinhan">퐁당퐁당</SheetTitle>
                </SheetHeader>

                {/* 모바일 메뉴 (아코디언으로 2뎁스 노출) */}
                <div className="mt-4 space-y-1">
                  {NAVIGATIONMENU.map((item) =>
                    'href' in item ? (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'hover:bg-muted block rounded-md px-3 py-2 text-sm',
                          pathname === item.href && 'bg-muted',
                        )}
                      >
                        {item.label}
                      </Link>
                    ) : (
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
                                  <Link
                                    key={c.href}
                                    href={c.href}
                                    className={cn(
                                      'hover:bg-muted block rounded-md px-3 py-2 text-sm',
                                      active && 'bg-muted',
                                    )}
                                  >
                                    {c.label}
                                  </Link>
                                )
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ),
                  )}
                </div>

                {/* 프로필/테마 (모바일 시트 하단에) */}
                <div className="mt-6 border-t pt-4">
                  {!user ? (
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
    </header>
  )
}

/** shadcn 예제 스타일의 블록형 아이템 */
function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { href: string; title: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="hover:bg-muted block rounded-md p-3 no-underline outline-hidden transition-colors focus:shadow-md"
        >
          <div className="text-sm leading-none font-medium">{title}</div>
          {children && <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">{children}</p>}
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
