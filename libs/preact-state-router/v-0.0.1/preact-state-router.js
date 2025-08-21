/*
 * v-0.0.1
 * */

import { signal, computed, effect } from "@preact/signals"
import { h } from "preact"
import { useState, useEffect } from "preact/hooks"

// Section 2: Utilities (30 lines)

// Route pattern compilation
function compileRoute(pattern) {
  const keys = []
  const regex = pattern
    .replace(/:[^/]+/g, match => {
      keys.push(match.slice(1))
      return "([^/]+)"
    })
    .replace(/\//g, "\\/")

  return {
    regex: new RegExp(`^${regex}$`),
    keys,
  }
}

function matchRoute(compiled, path) {
  const match = compiled.regex.exec(path)
  if (!match) return null

  const params = {}
  compiled.keys.forEach((key, index) => {
    params[key] = match[index + 1]
  })
  return params
}

// URL utilities
function parseHash() {
  const hash = window.location.hash.slice(1)
  const [path, search] = hash.split("?")
  const query = {}

  if (search) {
    search.split("&").forEach(param => {
      const [key, value] = param.split("=")
      if (key) query[decodeURIComponent(key)] = decodeURIComponent(value || "")
    })
  }

  return { path: path || "/", query }
}

function buildHash(path, query = {}) {
  const queryString = Object.entries(query)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&")
  return `#${path}${queryString ? "?" + queryString : ""}`
}

// Storage utilities
function safeGetStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.warn("Storage access failed:", error)
    return null
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.warn("Storage write failed:", error)
  }
}

// Debouncing
function debounce(fn, ms) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }
}

// Section 3: Core State Management (50 lines)

// Global router state
const routerState = signal({
  route: { path: "/", params: {}, query: {} },
  data: {},
  isLoading: false,
  error: null,
})

// Route compilation cache
const compiledRoutes = new Map()

// Reference to current router for hash change handler
let currentRouter = null

// Core navigation function
function navigate(path, replace = false) {
  const hash = buildHash(path)
  if (replace) {
    window.location.replace(hash)
  } else {
    window.location.hash = hash
  }
}

// Route matching logic
function findRoute(path, routes) {
  for (const [pattern, config] of Object.entries(routes)) {
    if (!compiledRoutes.has(pattern)) {
      compiledRoutes.set(pattern, compileRoute(pattern))
    }

    const compiled = compiledRoutes.get(pattern)
    const params = matchRoute(compiled, path)

    if (params !== null) {
      return { config, params, pattern }
    }
  }
  return null
}

// Hash change handler
function handleHashChange() {
  const { path, query } = parseHash()
  const currentState = routerState.value

  // Find matching route
  const match = findRoute(path, currentRouter?.routes || {})

  if (match) {
    const { config: routeConfig, params } = match

    // Update route with params
    routerState.value = {
      ...currentState,
      route: { path, params, query },
      data: { ...currentState.data, ...routeConfig.state },
    }

    // Load async data if needed
    if (routeConfig.load) {
      loadRoute(routeConfig, params).then(loadedData => {
        routerState.value = {
          ...routerState.value,
          data: { ...routerState.value.data, ...loadedData },
        }
      })
    }
  } else {
    // Route not found
    routerState.value = {
      ...currentState,
      route: { path, params: {}, query },
      error: {
        type: "route_not_found",
        message: `Route not found: ${path}`,
        recoverable: true,
      },
    }
  }
}

// Route loading logic
async function loadRoute(routeConfig, params) {
  if (!routeConfig.load) return {}

  try {
    routerState.value = { ...routerState.value, isLoading: true, error: null }
    const data = await routeConfig.load(params)
    return data || {}
  } catch (error) {
    routerState.value = {
      ...routerState.value,
      error: {
        type: "load_failed",
        message: error.message,
        originalError: error,
        recoverable: true,
      },
    }
    return {}
  } finally {
    routerState.value = { ...routerState.value, isLoading: false }
  }
}

// Section 4: State Persistence (25 lines)

// Persistence configuration
let persistKeys = []

// Load persisted state
function loadPersistedState() {
  const state = {}
  persistKeys.forEach(key => {
    const saved = safeGetStorage(key)
    if (saved) {
      try {
        state[key] = JSON.parse(saved)
      } catch (error) {
        console.warn(`Failed to parse stored state for key ${key}:`, error)
      }
    }
  })
  return state
}

// Save state changes
const saveState = debounce(state => {
  persistKeys.forEach(key => {
    if (state.data[key] !== undefined) {
      safeSetStorage(key, JSON.stringify(state.data[key]))
    }
  })
}, 300)

// Export/import functions
function exportState() {
  return JSON.stringify(routerState.value.data)
}

function importState(data) {
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data
    routerState.value = {
      ...routerState.value,
      data: { ...routerState.value.data, ...parsed },
    }
  } catch (error) {
    console.error("Failed to import state:", error)
  }
}

// Effect for auto-save
effect(() => saveState(routerState.value))

// Section 5: Route Resolution (35 lines)

// Initialize router with config
function createStateRouter(config) {
  const { routes, persist = [], fallback } = config

  // Compile all routes
  Object.keys(routes).forEach(pattern => {
    compiledRoutes.set(pattern, compileRoute(pattern))
  })

  // Set persistence keys
  persistKeys = persist

  // Create router instance
  const router = {
    navigate,
    getState: () => routerState.value,
    setState: newData => {
      routerState.value = {
        ...routerState.value,
        data: { ...routerState.value.data, ...newData },
      }
    },
    exportState,
    importState,
    routes,
    fallback,
  }

  // Set current router reference
  currentRouter = router

  // Load initial state
  const persistedState = loadPersistedState()

  // Setup hash listener
  window.addEventListener("hashchange", handleHashChange)

  // Initial route resolution
  const { path, query } = parseHash()
  const match = findRoute(path, routes)

  if (match) {
    const { config: routeConfig, params } = match
    const initialData = { ...persistedState, ...routeConfig.state }

    routerState.value = {
      route: { path, params, query },
      data: initialData,
      isLoading: false,
      error: null,
    }

    // Load async data if needed
    if (routeConfig.load) {
      loadRoute(routeConfig, params).then(loadedData => {
        routerState.value = {
          ...routerState.value,
          data: { ...routerState.value.data, ...loadedData },
        }
      })
    }
  } else {
    // Route not found - use fallback
    routerState.value = {
      route: { path, params: {}, query },
      data: persistedState,
      isLoading: false,
      error: {
        type: "route_not_found",
        message: `Route not found: ${path}`,
        recoverable: true,
      },
    }
  }

  // Return router instance
  return router
}

// Section 6: Preact Hooks (35 lines)

// Main hook
function useStateRouter() {
  const [state, setState] = useState(routerState.value)

  useEffect(() => {
    // Use effect to watch signal changes
    const cleanup = effect(() => {
      setState(routerState.value)
    })

    return cleanup
  }, [])

  return {
    state: state.data,
    route: state.route,
    navigate,
    isLoading: state.isLoading,
    error: state.error,
    exportState,
    importState,
  }
}

// Route params hook
function useRouteParams() {
  const { route } = useStateRouter()
  return route.params
}

// Query hook
function useQuery() {
  const { route } = useStateRouter()
  return route.query
}

// Section 7: Optional Component Wrapper (15 lines)

// Optional root component for error boundaries
function StateRouter({ children, fallback }) {
  const { error } = useStateRouter()

  if (error && fallback) {
    return h(fallback, { error })
  }

  return children
}

// Section 8: Exports (5 lines)
export {
  createStateRouter,
  useStateRouter,
  useRouteParams,
  useQuery,
  StateRouter,
}
