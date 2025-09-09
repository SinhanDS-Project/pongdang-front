'use client'
import { RegisterForm } from '@/components/auth-page/RegisterForm'
import { useSignupStore } from '@/stores/signup-store'
import { useEffect } from 'react'

export default function RegisterClient() {
  const reset = useSignupStore((s) => s.reset)

  useEffect(() => {
    return () => reset() // 페이지 떠날 때 초기화
  }, [reset])

  return <RegisterForm />
}
