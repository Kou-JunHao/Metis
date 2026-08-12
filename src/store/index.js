import { reactive, watch, ref } from 'vue';
import { DEFAULT_SETTINGS, DEFAULT_ENGINES, GENERIC_SEARCH_ICON } from '../constants';

// Load settings from localStorage
function loadSettings() {
  try {
    const stored = localStorage.getItem('metis-settings') || localStorage.getItem('tabby-settings') || localStorage.getItem('newTabSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export const userSettings = reactive(loadSettings());

// Save settings to localStorage automatically when changed
watch(userSettings, (newVal) => {
  localStorage.setItem('metis-settings', JSON.stringify(newVal))
}, { deep: true })

export const quickLinksActions = {
  addQuickLink(title, url) {
    userSettings.quickLinks.push({
      id: Date.now().toString(),
      title,
      url
    })
  },
  updateQuickLink(id, title, url) {
    const link = userSettings.quickLinks.find(l => l.id === id)
    if (link) {
      link.title = title
      link.url = url
    }
  },
  deleteQuickLink(id) {
    userSettings.quickLinks = userSettings.quickLinks.filter(l => l.id !== id)
  },
  reorderQuickLinks(newOrderIds) {
    const newLinks = []
    newOrderIds.forEach(id => {
      const link = userSettings.quickLinks.find(l => l.id === id)
      if (link) {
        newLinks.push(link)
      }
    })
    userSettings.quickLinks = newLinks
  }
};

export const todoActions = {
  addTodo(text) {
    userSettings.todos.push({
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now()
    })
  },
  toggleTodo(id) {
    const todo = userSettings.todos.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  },
  deleteTodo(id) {
    userSettings.todos = userSettings.todos.filter(t => t.id !== id)
  },
  clearCompleted() {
    userSettings.todos = userSettings.todos.filter(t => !t.completed)
  }
}

export const searchActions = {
  addCustomEngine(name, url) {
    const id = 'custom-' + Date.now().toString()
    userSettings.customEnginesDict[id] = { id, name, url, icon: GENERIC_SEARCH_ICON }
    userSettings.activeEngineIds.push(id)
    buildCurrentCycle()
  },
  deleteCustomEngine(id) {
    delete userSettings.customEnginesDict[id]
    userSettings.activeEngineIds = userSettings.activeEngineIds.filter(e => e !== id)
    if (userSettings.defaultEngineId === id) {
      userSettings.defaultEngineId = userSettings.activeEngineIds.length ? userSettings.activeEngineIds[0] : DEFAULT_ENGINES[0].id
    }
    buildCurrentCycle()
  },
  updateActiveEngines(newOrderIds) {
    userSettings.activeEngineIds = newOrderIds
    buildCurrentCycle()
  },
  updateInactiveOrder(newOrderIds) {
    userSettings.inactiveEngineOrder = newOrderIds
  }
}

export const getEngineDictionary = () => {
  const dict = {};
  DEFAULT_ENGINES.forEach(engine => { dict[engine.id] = engine; });
  return { ...dict, ...userSettings.customEnginesDict };
};

export const currentCycle = ref([]);

export const buildCurrentCycle = () => {
  const dictionary = getEngineDictionary();
  const cycle = userSettings.activeEngineIds.map(id => dictionary[id]).filter(Boolean);
  if (!cycle.length) {
    currentCycle.value = [DEFAULT_ENGINES[0]];
    userSettings.activeEngineIds = [DEFAULT_ENGINES[0].id];
    userSettings.defaultEngineId = DEFAULT_ENGINES[0].id;
  } else {
    currentCycle.value = cycle;
  }
  if (!currentCycle.value.some(engine => engine.id === userSettings.defaultEngineId)) {
    userSettings.defaultEngineId = currentCycle.value[0].id;
  }
};

// initialize currentCycle
buildCurrentCycle();

export { DEFAULT_SETTINGS, DEFAULT_ENGINES, GENERIC_SEARCH_ICON };
