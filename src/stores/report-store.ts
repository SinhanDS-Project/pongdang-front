import { create } from 'zustand'

import { ReportPayload } from '@/lib/report/report-schemas'

import { FinanceReport } from '@/types/report'

export type Step = 1 | 2 | 3 | 4

type State = Partial<ReportPayload> & { step: Step; report: FinanceReport | null }

type Actions = {
  setStep: (s: Step) => void
  patch: (p: Partial<ReportPayload>) => void
  reset: () => void
  setReport: (r: FinanceReport | null) => void
}

export const useReportStore = create<State & Actions>((set, get) => ({
  step: 1,
  report: null,
  patch: (p) => set((s) => ({ ...s, ...p })),
  setStep: (s) => set({ step: s }),
  reset: () => set({ step: 1 }),
  setReport: (r) => set({ report: r }),
}))
