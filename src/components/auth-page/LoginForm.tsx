import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex w-full flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <Link href="/" className="text-primary-shinhan text-2xl font-extrabold">
                  퐁당퐁당
                </Link>
                <p className="text-muted-foreground text-balance">건강한 금융 습관, 퐁당퐁당과 시작하세요</p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">아이디 (Email)</Label>
                <Input id="email" type="email" placeholder="pongdang@example.com" required />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link href="#" className="ml-auto text-sm underline-offset-2 hover:underline">
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="bg-secondary-royal w-full">
                로그인
              </Button>
              <div className="text-center text-sm">
                계정이 없으신가요?{' '}
                <Link href="/signup" className="underline underline-offset-4">
                  회원가입
                </Link>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/auth-background.png"
              alt="Image"
              fill
              content='"cover'
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
