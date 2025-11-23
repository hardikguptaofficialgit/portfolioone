"use client"

import type React from "react"

import { useState } from "react"
import { useWidgetStore } from "@/lib/widgets"
import { Trash2, Plus, Check } from "lucide-react"

export function TodoWidget() {
  const { todos, addTodo, toggleTodo, removeTodo } = useWidgetStore()
  const [input, setInput] = useState("")

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      addTodo(input)
      setInput("")
    }
  }

  const completedCount = todos.filter((t) => t.completed).length

  return (
    <div className="space-y-3 max-h-64 flex flex-col">
      <div className="space-y-1">
        <div className="text-sm font-medium text-white">
          My Tasks ({completedCount}/{todos.length})
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {todos.length === 0 ? (
          <div className="text-white/40 text-sm text-center py-4">No tasks yet</div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded transition-colors group">
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border transition-all ${
                  todo.completed ? "bg-green-500/30 border-green-500" : "border-white/30 hover:border-white/50"
                }`}
              >
                {todo.completed && <Check className="w-4 h-4 text-green-400" />}
              </button>
              <span className={`text-sm flex-1 ${todo.completed ? "text-white/40 line-through" : "text-white/80"}`}>
                {todo.text}
              </span>
              <button
                onClick={() => removeTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddTodo} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <button type="submit" className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded transition-colors">
          <Plus className="w-4 h-4 text-blue-400" />
        </button>
      </form>
    </div>
  )
}
