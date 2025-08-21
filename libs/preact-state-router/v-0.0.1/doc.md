# preact-state-router (v-0.0.1)

A lightweight (~200 lines), zero-dependency routing and state management library for Preact applications built with the molecular approach.

## Overview

`preact-state-router` combines URL routing with persistent state management using Preact signals. Perfect for build-free molecular apps that need navigation, state persistence, and data synchronization across components.

**Key Features:**

- Hash-based routing (`#/path`) that works without a server
- Automatic state persistence to localStorage
- Signal-based reactive updates across all components
- Route parameters (`:id`) and query string support
- Export/import functionality for state sharing
- Automatic route loading on navigation (load functions called for every route change)
- Zero external dependencies (only requires Preact + Signals)

## Installation

### For Molecular Apps (CDN)

Add to your `index.html` import map:

```html
<script type="importmap">
  {
    "imports": {
      "preact": "https://cdn.jsdelivr.net/npm/preact@10.22.0/dist/preact.module.js",
      "preact/hooks": "https://cdn.jsdelivr.net/npm/preact@10.22.0/hooks/dist/hooks.module.js",
      "@preact/signals": "https://cdn.jsdelivr.net/npm/@preact/signals@2.0.4/+esm",
      "htm": "https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.module.js",
      "preact-state-router": "https://cdn.toolbomber.com/libs/preact-state-router/v-0.0.1/preact-state-router.js"
    }
  }
</script>
```

Then import directly:

```js
import { createStateRouter, useStateRouter } from "preact-state-router"
```

Alternatively, copy `preact-state-router.js` to your project:

```js
import {
  createStateRouter,
  useStateRouter,
} from "./path/to/preact-state-router.js"
```

## Quick Start

### 1. Basic Router Setup

```js
import { h } from "preact"
import htm from "htm"
import { createStateRouter, useStateRouter } from "preact-state-router"

const html = htm.bind(h)

// Create router with routes and persistent state
const router = createStateRouter({
  routes: {
    "/": { component: Home, state: { view: "home" } },
    "/about": { component: About, state: { view: "about" } },
    "/user/:userId": {
      component: UserProfile,
      state: { view: "user" },
      load: ({ userId }) => fetchUser(userId),
    },
  },
  persist: ["theme", "preferences", "userData"],
  fallback: NotFound,
})

// Make router globally accessible
window.__router = router
```

### 2. Component Usage

```js
const App = () => {
  const { state, navigate, route, isLoading } = useStateRouter();

  return html`
    <div>
      <nav>
        <button onClick=${() => navigate('/')}>Home</button>
        <button onClick=${() => navigate('/about')}>About</button>
        <button onClick=${() => navigate('/user/123')}>User 123</button>
      </nav>

      ${isLoading ? html`<div>Loading...</div>` : ''}

      <main>
        ${/* Router automatically renders matched component */}
      </main>
    </div>
  `;
};
```

### 3. Accessing Router State

```js
const SomeComponent = () => {
  const { state } = useStateRouter()

  // Update state (automatically persisted if in persist array)
  const updateTheme = newTheme => {
    if (window.__router) {
      window.__router.setState({ theme: newTheme })
    }
  }

  return html`
    <div class=${state.theme === "dark" ? "dark" : "light"}>
      <button onClick=${() => updateTheme("dark")}>Dark Mode</button>
    </div>
  `
}
```

## API Reference

### createStateRouter(config)

Creates and initializes a router instance.

**Parameters:**

- `config.routes` - Object mapping URL patterns to route configurations
- `config.persist` - Array of state keys to persist in localStorage
- `config.fallback` - Component to render when no route matches

**Route Configuration:**

```js
{
  component: ComponentFunction,     // Required: Component to render
  state: { key: 'value' },         // Optional: Initial state for this route
  load: (params) => Promise        // Optional: Async data loading function
}
```

**Returns:** Router instance with methods:

- `navigate(path, replace = false)` - Navigate to path
- `setState(newState)` - Update router state
- `getState()` - Get current state
- `exportState()` - Export state as JSON string
- `importState(data)` - Import state from JSON

### useStateRouter()

Primary hook for accessing router state and navigation.

**Returns:**

```js
{
  state: {},              // Current router state (persisted data)
  route: {                // Current route information
    path: '/user/123',
    params: { userId: '123' },
    query: { tab: 'posts' }
  },
  navigate: Function,     // Navigate to new route
  isLoading: Boolean,     // True when route.load() is executing
  error: Object|null,     // Error object if route loading failed
  exportState: Function,  // Export current state
  importState: Function   // Import state from data
}
```

### useRouteParams()

Hook to access current route parameters.

```js
const { userId, postId } = useRouteParams()
// For route: /user/:userId/post/:postId
// URL: #/user/123/post/456
// Returns: { userId: '123', postId: '456' }
```

### useQuery()

Hook to access query string parameters.

```js
const { tab, filter } = useQuery()
// For URL: #/user/123?tab=posts&filter=recent
// Returns: { tab: 'posts', filter: 'recent' }
```

## Route Patterns

### Basic Routes

```js
routes: {
  '/': { component: Home },
  '/about': { component: About },
  '/contact': { component: Contact }
}
```

### Parameterized Routes

```js
routes: {
  '/user/:userId': {
    component: UserProfile,
    load: ({ userId }) => api.getUser(userId)
  },
  '/blog/:slug': { component: BlogPost },
  '/category/:cat/item/:id': { component: CategoryItem }
}
```

### Route with State and Loading

```js
routes: {
  '/dashboard': {
    component: Dashboard,
    state: { view: 'dashboard', sidebarOpen: true },
    load: async () => {
      const data = await api.getDashboardData();
      return { dashboardData: data };
    }
  }
}
```

## State Management

### Automatic Persistence

State keys listed in the `persist` array are automatically saved to localStorage:

```js
const router = createStateRouter({
  persist: ["theme", "userPreferences", "cartItems"],
  // ...
})

// These updates are automatically persisted:
router.setState({ theme: "dark" })
router.setState({ userPreferences: { language: "en" } })
```

### Manual State Updates

```js
// In any component
const updateGlobalState = () => {
  if (window.__router) {
    window.__router.setState({
      user: { name: "John", role: "admin" },
      notifications: [],
    })
  }
}
```

### State Export/Import

```js
// Export current state
const stateJSON = router.exportState()

// Import state (useful for user data migration)
router.importState(stateJSON)

// Or import from object
router.importState({ theme: "dark", user: userData })
```

## Navigation

### Programmatic Navigation

```js
const { navigate } = useStateRouter()

// Basic navigation
navigate("/about")

// Replace current history entry
navigate("/login", true)

// Navigate with parameters
navigate("/user/123")

// Navigate with query string
navigate("/search?q=preact&type=docs")
```

### URL Structure

URLs use hash-based routing for build-free compatibility:

```
https://example.com/              → #/ (home)
https://example.com/#/about       → /about route
https://example.com/#/user/123    → /user/:userId with userId=123
https://example.com/#/search?q=x  → /search with query.q='x'
```

## Advanced Usage

### Route Loading with Error Handling

```js
routes: {
  '/user/:userId': {
    component: UserProfile,
    load: async ({ userId }) => {
      try {
        const user = await api.getUser(userId);
        const posts = await api.getUserPosts(userId);
        return { user, posts };
      } catch (error) {
        throw new Error(`Failed to load user ${userId}: ${error.message}`);
      }
    }
  }
}

// In component:
const { isLoading, error } = useStateRouter();

if (isLoading) return html`<div>Loading user...</div>`;
if (error) return html`<div>Error: ${error.message}</div>`;
```

### Dynamic Route Registration

```js
// Add routes after initialization
router.routes["/new-page"] = {
  component: NewPage,
  state: { view: "new" },
}

// Navigate to new route
navigate("/new-page")
```

### State Synchronization

Router state updates automatically trigger re-renders in all components using `useStateRouter()`:

```js
// Component A updates state
const ComponentA = () => {
  const updateSharedData = () => {
    window.__router.setState({ sharedData: "new value" })
  }
  // ...
}

// Component B automatically receives the update
const ComponentB = () => {
  const { state } = useStateRouter()
  return html`<div>Shared: ${state.sharedData}</div>`
}
```

## Best Practices

### 1. Router Instance Access

Always make the router globally accessible for state updates:

```js
const router = createStateRouter({
  /* config */
})
window.__router = router // Essential for setState() access
```

### 2. Molecular Component Integration

```js
const MyComponent = ({ title = defaults.title }) => {
  const { state, navigate } = useStateRouter()

  return html`
    <div class=${state.theme}>
      <h1>${title}</h1>
      <button onClick=${() => navigate("/other")}>Navigate</button>
    </div>
  `
}

MyComponent.displayName = "MyComponent"
MyComponent.meta = {
  properties: {
    title: { type: "string", description: "Component title" },
  },
}
MyComponent.defaults = { title: "Default Title" }
```

### 3. State Organization

Structure your persisted state logically:

```js
const router = createStateRouter({
  persist: ["user", "ui", "app"],
  routes: {
    "/": {
      state: {
        ui: { sidebarOpen: false, theme: "light" },
        app: { version: "1.0.0", initialized: true },
      },
    },
  },
})
```

### 4. Error Boundaries

Use the optional StateRouter component for error handling:

```js
import { StateRouter } from "./preact-state-router.js"

const ErrorFallback = ({ error }) => html`
  <div class="error">
    <h2>Something went wrong</h2>
    <p>${error.message}</p>
    <button onClick=${() => location.reload()}>Reload</button>
  </div>
`

const App = () => html`
  <${StateRouter} fallback=${ErrorFallback}>
    <${MainContent}/>
  </StateRouter>
`
```

## Common Patterns

### Protected Routes

```js
routes: {
  '/admin': {
    component: AdminPanel,
    load: async () => {
      const user = getCurrentUser();
      if (!user || user.role !== 'admin') {
        navigate('/login');
        throw new Error('Access denied');
      }
      return { user };
    }
  }
}
```

### Route-Based Data Loading

```js
routes: {
  '/posts': {
    component: PostList,
    load: async () => {
      const posts = await api.getPosts();
      return { posts };
    }
  },
  '/posts/:id': {
    component: PostDetail,
    load: async ({ id }) => {
      const post = await api.getPost(id);
      const comments = await api.getComments(id);
      return { post, comments };
    }
  }
}
```

### Theme Management

```js
const router = createStateRouter({
  persist: ["theme"],
  routes: {
    "/": { state: { theme: "light" } },
  },
})

// Theme component
const ThemeToggle = () => {
  const { state } = useStateRouter()

  const toggleTheme = () => {
    const newTheme = state.theme === "light" ? "dark" : "light"
    window.__router.setState({ theme: newTheme })
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return html`
    <button onClick=${toggleTheme}>
      ${state.theme === "light" ? "🌙" : "☀️"}
    </button>
  `
}
```

## Troubleshooting

### Router Not Updating

Ensure router is globally accessible:

```js
// ❌ Wrong
const router = createStateRouter({...});

// ✅ Correct
const router = createStateRouter({...});
window.__router = router;
```

### State Not Persisting

Check that keys are in persist array:

```js
// ❌ State won't persist
router.setState({ theme: "dark" })

// ✅ Include in persist array
createStateRouter({
  persist: ["theme"], // Must include 'theme'
  // ...
})
```

### Components Not Re-rendering

Ensure components use `useStateRouter()` hook:

```js
// ❌ Won't update automatically
const Component = () => {
  const theme = window.__router.getState().theme
  return html`<div class=${theme}>Content</div>`
}

// ✅ Updates automatically
const Component = () => {
  const { state } = useStateRouter()
  return html`<div class=${state.theme}>Content</div>`
}
```

### Route Not Matching

Check URL patterns and navigation:

```js
// ❌ Wrong pattern
routes: { 'user/:id': { ... } }  // Missing leading slash

// ✅ Correct pattern
routes: { '/user/:id': { ... } }

// ❌ Wrong navigation
navigate('user/123');  // Missing leading slash

// ✅ Correct navigation
navigate('/user/123');
```

## File Size & Performance

- **Library size**: ~200 lines, <5KB minified
- **Dependencies**: Only Preact + Signals (already in molecular apps)
- **Route resolution**: <10ms for typical applications
- **Memory usage**: Single global signal, automatic cleanup
- **Browser support**: All modern browsers with ES modules

## Migration from Other Routers

### From React Router

```js
// React Router
import { BrowserRouter, Route, Switch } from "react-router-dom"

// preact-state-router
import { createStateRouter, useStateRouter } from "./preact-state-router.js"

// Instead of JSX routes, use config object
const router = createStateRouter({
  routes: {
    "/": { component: Home },
    "/about": { component: About },
    "/user/:id": { component: User },
  },
})
```

### From Wouter

```js
// Wouter
import { Route, Link } from "wouter"

// preact-state-router
const { navigate } = useStateRouter()
// Replace <Link> with onClick={() => navigate('/path')}
```

This documentation provides everything needed for an LLM to effectively use `preact-state-router` in molecular applications.
