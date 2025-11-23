import { create } from "zustand"
import { STORAGE_KEYS, createPersistMiddleware } from "./persistence"

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

interface WidgetStore {
  todos: TodoItem[]
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  clearCompleted: () => void
  weatherData: { temp: number; condition: string } | null
  setWeatherData: (data: { temp: number; condition: string }) => void
  loadPersistedState: () => void
  saveState: () => void
}

const persistMiddleware = createPersistMiddleware({
  key: STORAGE_KEYS.WIDGET_STATE,
  version: 1,
})

export const useWidgetStore = create<WidgetStore>((set, get) => {
  const persistApi = persistMiddleware(set, get)
  const initialState = persistApi.loadPersistedState()

  return {
    todos: initialState?.todos ?? [],
    weatherData: initialState?.weatherData ?? null,

    addTodo: (text) =>
      set((state) => {
        const newState = {
          todos: [
            ...state.todos,
            {
              id: `todo-${Date.now()}`,
              text,
              completed: false,
              createdAt: new Date(),
            },
          ],
        }
        persistApi.persistState(newState)
        return newState
      }),

    toggleTodo: (id) =>
      set((state) => {
        const newState = {
          todos: state.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
        }
        persistApi.persistState(newState)
        return newState
      }),

    removeTodo: (id) =>
      set((state) => {
        const newState = {
          todos: state.todos.filter((todo) => todo.id !== id),
        }
        persistApi.persistState(newState)
        return newState
      }),

    clearCompleted: () =>
      set((state) => {
        const newState = {
          todos: state.todos.filter((todo) => !todo.completed),
        }
        persistApi.persistState(newState)
        return newState
      }),

    setWeatherData: (data) =>
      set((state) => {
        const newState = { weatherData: data }
        persistApi.persistState(newState)
        return newState
      }),

    loadPersistedState: () => {
      const persisted = persistApi.loadPersistedState()
      if (persisted) {
        set(persisted)
      }
    },

    saveState: () => {
      const state = get()
      persistApi.persistState(state)
    },
  }
})
