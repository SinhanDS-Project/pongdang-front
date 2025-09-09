import { create } from 'zustand'

import { SignupPayload } from '@lib/auth/signup-schemas'

export type Step = 1 | 2 | 3 | 4

type State = Partial<SignupPayload> & { step: Step }
type Actions = {
  setStep: (s: Step) => void
  patch: (p: Partial<SignupPayload>) => void
  reset: () => void
}

export const useSignupStore = create<State & Actions>((set, get) => ({
  step: 1,
  patch: (p) => set((s) => ({ ...s, ...p })),
  setStep: (s) => set({ step: s }),
  reset: () => set({ step: 1 }),
}))
