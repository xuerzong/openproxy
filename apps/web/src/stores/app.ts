import { create } from 'zustand'

const store = create(() => ({
  collapsed: false,
}))

export const useAppStore = store

export const changeCollapsed = (collapsed: boolean) => {
  store.setState({ collapsed })
}

export const toggleCollapsed = () => {
  store.setState((state) => ({ collapsed: !state.collapsed }))
}
