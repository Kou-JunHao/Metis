<script setup>
import { ref, computed } from 'vue'
import { userSettings, todoActions } from '../store/index.js'

const dialogRef = ref(null)
const filter = ref('all') // 'all', 'active', 'completed'
const newTodoText = ref('')

const openDialog = () => {
  dialogRef.value?.showModal()
}

const closeDialog = () => {
  dialogRef.value?.close()
}

const addTodo = () => {
  if (newTodoText.value.trim()) {
    todoActions.addTodo(newTodoText.value.trim())
    newTodoText.value = ''
  }
}

const toggleTodo = (id) => {
  todoActions.toggleTodo(id)
}

const deleteTodo = (id) => {
  todoActions.deleteTodo(id)
}

const clearCompleted = () => {
  todoActions.clearCompleted()
}

const filteredTodos = computed(() => {
  if (filter.value === 'active') {
    return userSettings.todos.filter(t => !t.completed)
  }
  if (filter.value === 'completed') {
    return userSettings.todos.filter(t => t.completed)
  }
  return userSettings.todos
})

const remainingCount = computed(() => {
  return userSettings.todos.filter(t => !t.completed).length
})

defineExpose({
  openDialog,
  closeDialog
})
</script>

<template>
  <dialog id="todo-dialog" class="todo-dialog" ref="dialogRef" aria-labelledby="todo-title">
    <div class="todo-panel">
      <header class="drawer-header">
        <div>
          <p class="section-kicker">TODAY</p>
          <h2 id="todo-title">待办事项</h2>
        </div>
        <button id="todo-close" @click="closeDialog" class="icon-button close-button" type="button" aria-label="关闭待办事项">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg>
        </button>
      </header>

      <form id="todo-form" class="todo-form" @submit.prevent="addTodo">
        <input id="todo-input" class="premium-input" type="text" maxlength="120" placeholder="添加待办事项..." autocomplete="off" v-model="newTodoText">
        <button type="submit" class="primary-button add-todo-button">添加</button>
      </form>

      <div class="todo-filters" role="group" aria-label="筛选待办">
        <button type="button" class="filter-pill" :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button>
        <button type="button" class="filter-pill" :class="{ active: filter === 'active' }" @click="filter = 'active'">未完成</button>
        <button type="button" class="filter-pill" :class="{ active: filter === 'completed' }" @click="filter = 'completed'">已完成</button>
      </div>

      <ul id="todo-list" class="todo-list">
        <li v-for="todo in filteredTodos" :key="todo.id" class="todo-item" :class="{ completed: todo.completed }">
          <label class="todo-label">
            <input type="checkbox" class="todo-check" :checked="todo.completed" @change="toggleTodo(todo.id)">
            <span class="todo-text">{{ todo.text }}</span>
          </label>
          <button class="todo-delete" type="button" aria-label="删除待办" @click="deleteTodo(todo.id)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
          </button>
        </li>
      </ul>
      <p id="todo-empty" class="empty-state" v-if="filteredTodos.length === 0">暂无待办</p>

      <footer class="todo-footer">
        <span id="todo-remaining">{{ remainingCount }} 项未完成</span>
        <button id="clear-completed" type="button" class="text-button" @click="clearCompleted" v-if="userSettings.todos.some(t => t.completed)">清除已完成</button>
      </footer>
    </div>
  </dialog>
</template>


<style>
.todo-dialog {
  width: min(400px, 90vw);
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0 0 0 auto;
  border: none;
  border-left: 1px solid var(--border);
  background: var(--modal-bg);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(35px);
  -webkit-backdrop-filter: blur(35px);
  opacity: 0;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
}

.todo-dialog[open] {
  opacity: 1;
  transform: translateX(0);
}

.todo-dialog::backdrop {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(3px);
}

.todo-panel {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 1.5rem;
}

.todo-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.todo-form .premium-input {
  flex: 1;
  padding: 0.65rem 0.85rem;
}

.add-todo-button {
  padding: 0.65rem 1rem;
  white-space: nowrap;
}

.todo-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.filter-pill {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 8px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-pill:hover {
  background: var(--surface);
  color: var(--text-primary);
}

.filter-pill.active {
  background: var(--text-primary);
  color: var(--bg-color);
}

.todo-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.4rem;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  background: var(--surface-soft);
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.todo-item:hover {
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--border);
}

.todo-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.todo-check {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  box-shadow: inset 0 0 0 1.5px var(--text-tertiary);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.todo-check:checked {
  background: var(--text-primary);
  box-shadow: inset 0 0 0 1.5px var(--text-primary);
}

.todo-check:checked::after {
  content: '';
  width: 4px;
  height: 8px;
  border: solid var(--bg-color);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-0.5px, -0.5px);
}

.todo-text {
  overflow-wrap: anywhere;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
}

.todo-item.completed .todo-text {
  color: var(--text-tertiary);
  text-decoration: line-through;
}

.todo-delete {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.todo-delete:hover {
  background: rgba(255, 71, 87, 0.15);
  color: #ff4757;
}

.empty-state {
  flex: 1;
  padding-top: 4rem;
  color: var(--text-tertiary);
  font-size: 0.88rem;
  text-align: center;
}

.todo-footer {
  display: flex;
  min-height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.text-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}
.text-button:hover {
  color: #ff4757;
}

@media (max-width: 480px) {
  .todo-dialog {
    width: 100vw;
  }
}
</style>
