import { h, Component, createContext, cloneElement } from 'preact';
import { useState, useEffect, useContext, useCallback } from 'preact/hooks';

// --- Constants ---
export const EVENTS = {
  ROUTE_CHANGE_START: 'routeChangeStart',
  ROUTE_CHANGE_COMPLETE: 'routeChangeComplete',
  ROUTE_CHANGE_ERROR: 'routeChangeError'
};

// --- Helper: Path Matching ---
const cache = {};
const cacheLimit = 10000;
let cacheCount = 0;

function compilePath(path, options) {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});
  if (pathCache[path]) return pathCache[path];
  const keys = [];
  const regexp = new RegExp(`^${path
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/?)\.{3}/g, (_, slash) => `(?:${slash || ''}(.*?))?`)
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, (_, slash, format, key, capture, optional) => {
      keys.push({ name: key, optional: !!optional });
      slash = slash || '';
      return `${optional ? '' : slash}(?:${optional ? slash : ''}${format || ''}${capture || '([^/]+?)'})${optional || ''}`;
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.*?)')
  }${options.end ? '$' : '(?=\\/|$)'}`, options.sensitive ? '' : 'i');
  if (cacheCount < cacheLimit) {
    pathCache[path] = { keys, regexp };
    cacheCount++;
  }
  return { keys, regexp };
}

function matchPath(pathname, options = {}) {
  const { path = '/', exact = false, strict = false, sensitive = false } = options;
  const currentPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const { keys, regexp } = compilePath(path, { end: exact, strict, sensitive });
  const match = regexp.exec(currentPathname);
  if (!match) return null;
  const [url, ...values] = match;
  const isExact = currentPathname === url;
  if (exact && !isExact) return null;
  return {
    path: path,
    url: path === '/' && url === '' ? '/' : url,
    isExact,
    params: keys.reduce((memo, key, index) => {
      memo[key.name] = values[index] ? decodeURIComponent(values[index]) : undefined;
      return memo;
    }, {}),
  };
}

// --- Helper: Query String Parsing ---
function parseQuery(queryString) {
    const query = {};
    if (!queryString) return query;
    queryString.split('&').forEach(pair => {
        if (pair) {
            const parts = pair.split('=');
            const key = decodeURIComponent(parts[0].replace(/\+/g, ' '));
            const value = parts.length > 1 ? decodeURIComponent(parts[1].replace(/\+/g, ' ')) : '';
            if (key) { query[key] = value; }
        }
    });
    return query;
}

// --- Helper: Query String Stringifying ---
function stringifyQuery(obj) {
    if (!obj || Object.keys(obj).length === 0) return '';
    const params = Object.entries(obj)
        .map(([key, value]) => {
            if (value === undefined || value === null) return '';
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .filter(Boolean)
        .join('&');
    return params ? `?${params}` : '';
}

// --- Router Context ---
const RouterContext = createContext({
  currentUrl: '',
  currentRoute: null,
  previousRoute: null,
  route: (url, replace = false) => {
    console.warn('RouterContext not found.');
    const targetUrl = url.startsWith('#') ? url : `#${url.startsWith('/') ? url : `/${url}`}`;
     if (replace) { window.location.replace(targetUrl); } else { window.location.hash = targetUrl; }
  },
});

// --- Global Router Instance ---
let globalRouterInstance = null;

// --- Router Component ---
export class Router extends Component {
  constructor(props) {
    super(props);
    if (!globalRouterInstance) { globalRouterInstance = this; }
    const initialHash = window.location.hash.substring(1) || '/';
    const [initialUrl, initialQueryString] = initialHash.split('?');
    const initialQuery = parseQuery(initialQueryString);
    const initialRoute = this.resolveRoute(initialUrl, initialQuery);
    this.state = {
      currentUrl: initialUrl,
      currentRoute: initialRoute ? {
          path: initialRoute.path, url: initialUrl, params: initialRoute.params, query: initialQuery
      } : { path: null, url: initialUrl, params: {}, query: initialQuery },
      previousRoute: null,
      currentComponent: initialRoute ? initialRoute.component : null,
    };
  }

  getCurrentPath() {
    const hash = window.location.hash.substring(1) || '/';
    return hash.split('?')[0];
  }

  getCurrentQueryString() {
      const hash = window.location.hash.substring(1) || '/';
      return hash.split('?')[1] || '';
  }

  resolveRoute(url, query) {
      const children = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
      let matchedComponent = null;
      let routeInfo = null;

      for (const child of children) {
          // Check if child is a valid VNode with props and either path or default
          if (child && typeof child === 'object' && child.props && (child.props.path || child.props.default)) {
              if (child.props.path) {
                  // Match specific path
                  const isLeafRoute = !child.props.children; // Basic check
                  const match = matchPath(url, {
                      path: child.props.path,
                      exact: child.props.exact !== undefined ? child.props.exact : isLeafRoute,
                      strict: child.props.strict,
                      sensitive: child.props.sensitive
                  });

                  if (match) {
                      routeInfo = { ...match, query };
                      const { path, exact, strict, sensitive, default: isDefault, ...restProps } = child.props;
                      // Pass matched params and current query to the component
                      // For AsyncRoute, pass the original props including getComponent
                      if (child.type === AsyncRoute) {
                           matchedComponent = cloneElement(child, { ...routeInfo.params, ...query });
                      } else {
                           matchedComponent = cloneElement(child, { ...restProps, ...routeInfo.params, ...query });
                      }
                      break; // First match wins
                  }
              }
          }
      }

      if (matchedComponent) {
          return { component: matchedComponent, path: routeInfo.path, params: routeInfo.params };
      }

      // If no specific match, find and prepare the default component
      const defaultComponent = this.findDefaultComponent(query);
      if (defaultComponent) {
          return { component: defaultComponent, path: null, params: {} };
      }

      return null; // No match and no default
  }

  findDefaultComponent(query) {
    const children = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
    for (const child of children) {
      if (child && typeof child === 'object' && child.props && child.props.default) {
        const { path, exact, strict, sensitive, default: isDefault, ...restProps } = child.props;
         // Pass query params to default component too
        return cloneElement(child, { ...restProps, ...query });
      }
    }
    return null;
  }

  handleHashChange = () => {
    const newUrl = this.getCurrentPath();
    const newQueryString = this.getCurrentQueryString();
    const newQuery = parseQuery(newQueryString);
    const queryChanged = JSON.stringify(newQuery) !== JSON.stringify(this.state.currentRoute?.query);

    if (newUrl !== this.state.currentUrl || queryChanged) {
      const previousRoute = this.state.currentRoute;
      const resolvedRoute = this.resolveRoute(newUrl, newQuery);
      let newRouteState = null;
      let componentToRender = null;

      if (resolvedRoute) {
          newRouteState = {
              path: resolvedRoute.path, url: newUrl, params: resolvedRoute.params, query: newQuery,
          };
          componentToRender = resolvedRoute.component;
      } else {
          newRouteState = { path: null, url: newUrl, params: {}, query: newQuery };
          componentToRender = null;
      }

      this.setState({
        currentUrl: newUrl, currentRoute: newRouteState, previousRoute: previousRoute, currentComponent: componentToRender
      }, () => {
        if (this.props.onChange && newRouteState) {
          const event = {
            current: newRouteState, previous: previousRoute, url: window.location.hash.substring(1), params: newRouteState.params,
          };
          if (this.props.onChange(event) === false) {
            const revertTo = previousRoute ? `#${previousRoute.url}${stringifyQuery(previousRoute.query)}` : '#/';
            this.navigate(revertTo, true);
          }
        }
      });
    }
  };

  componentDidMount() {
    if (!globalRouterInstance) { globalRouterInstance = this; }
    window.addEventListener('hashchange', this.handleHashChange, false);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange, false);
    if (globalRouterInstance === this) { globalRouterInstance = null; }
  }

  navigate = (url, replace = false) => {
    let targetUrl = url.startsWith('#') ? url : `#${url.startsWith('/') ? url : `/${url}`}`;
    if (targetUrl === window.location.hash && !replace) { return; }
    if (replace) { window.location.replace(targetUrl); } else { window.location.hash = targetUrl; }
  };

  render() {
    const routerContextValue = {
      currentUrl: this.state.currentUrl, currentRoute: this.state.currentRoute, previousRoute: this.state.previousRoute, route: this.navigate,
    };
    // Use h() for the Provider
    return h(RouterContext.Provider, { value: routerContextValue },
        this.state.currentComponent // Render the matched component as children
    );
  }
}

// --- Hooks ---
export function useRouter() { return useContext(RouterContext); }
export function useParams() { const { currentRoute } = useContext(RouterContext); return currentRoute?.params ?? {}; }
export function useLocation() {
  const { currentRoute } = useContext(RouterContext);
  const pathname = currentRoute?.url ?? (window.location.hash.substring(1) || '/').split('?')[0];
  const hash = window.location.hash;
  const query = currentRoute?.query ?? parseQuery(window.location.hash.split('?')[1] || '');
  return { pathname, hash, query };
}

// --- Programmatic Navigation ---
export function route(url, replace = false) {
  if (globalRouterInstance?.navigate) { globalRouterInstance.navigate(url, replace); }
  else {
    console.warn('Router instance not found for route().');
    const targetUrl = url.startsWith('#') ? url : `#${url.startsWith('/') ? url : `/${url}`}`;
    if (replace) { window.location.replace(targetUrl); } else { window.location.hash = targetUrl; }
  }
}

// --- Link Component ---
export function Link(props) {
  const { route: navigate, currentRoute } = useRouter();
  const { href, activeClassName = 'active', exactActiveMatch = false, replace = false, onClick: customOnClick, children, ...restProps } = props;

  const handleClick = (event) => {
    if (customOnClick) { customOnClick(event); }
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button !== 0) { return; }
    event.preventDefault();
    navigate(href, replace);
  };

  let isActive = false;
  if (currentRoute) {
    const linkPath = (href.startsWith('#') ? href.substring(1) : href).split('?')[0];
    const currentPath = currentRoute.url;
    const normalizedLinkPath = linkPath.startsWith('/') ? linkPath : `/${linkPath}`;
    const normalizedCurrentPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
    if (exactActiveMatch) { isActive = normalizedLinkPath === normalizedCurrentPath; }
    else { isActive = normalizedCurrentPath.startsWith(normalizedLinkPath) && (normalizedLinkPath === '/' || normalizedCurrentPath.length === normalizedLinkPath.length || normalizedCurrentPath[normalizedLinkPath.length] === '/'); }
  }

  const className = [restProps.className, isActive ? activeClassName : null].filter(Boolean).join(' ');
  const finalHref = href.startsWith('#') ? href : `#${href.startsWith('/') ? href : `/${href}`}`;

  return h('a', { href: finalHref, onClick: handleClick, ...restProps, className }, children);
}

// --- AsyncRoute Component ---
export function AsyncRoute(props) {
  const { getComponent, loading: LoadingComponent, ...routeProps } = props;
  // routeProps will contain path, params, query passed down from Router
  const [LoadedComponent, setLoadedComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize getComponent to prevent re-fetching if props object changes identity
  const loadComponent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const module = await getComponent();
      // Handle both default and named exports (assuming default export is preferred)
      const component = module.default || module;
      if (!component) {
          throw new Error("Loaded module has no default or named export.");
      }
      setLoadedComponent(() => component); // Use functional update for Preact state
    } catch (err) {
      console.error("Error loading async component:", err);
      setError(err);
      // TODO: Emit ROUTE_CHANGE_ERROR event?
    } finally {
      setIsLoading(false);
    }
  }, [getComponent]); // Dependency array includes getComponent

  useEffect(() => {
    loadComponent();
    // Cleanup function if needed (e.g., cancel fetch) - not applicable for dynamic import
    // return () => { /* cleanup */ };
  }, [loadComponent]); // Re-run effect if loadComponent changes (due to getComponent changing)

  if (error) {
    // Optionally render an error message or component
    return h('div', null, `Error loading route: ${error.message}`);
  }

  if (isLoading) {
    return LoadingComponent ? h(LoadingComponent, routeProps) : null; // Render loading component or nothing
  }

  if (LoadedComponent) {
    // Pass all route props (params, query) down to the loaded component
    return h(LoadedComponent, routeProps);
  }

  return null; // Should not happen if loading/error/loaded states are handled
}


// --- Exports ---
export { RouterContext }; // Only export context here, others are exported directly
// TODO: Add RouterProvider later