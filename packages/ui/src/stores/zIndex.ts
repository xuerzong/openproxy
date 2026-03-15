import { create } from 'zustand'

interface ZIndexState {
  current: number
  next: () => number
}

const BASE_Z_INDEX = 1000

export const useZIndexStore = create<ZIndexState>((set, get) => ({
  current: BASE_Z_INDEX,
  next: () => {
    const nextZIndex = get().current + 1
    set({ current: nextZIndex })
    return nextZIndex
  },
}))
