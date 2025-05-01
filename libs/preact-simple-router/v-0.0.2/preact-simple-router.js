import { h, Component, createContext, cloneElement } from 'preact';
import { useState, useEffect, useContext, useCallback } from 'preact/hooks';
import htm from 'htm';

const html = htm.bind(h);

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
  const regexp = new RegExp(
    `^${path
      .replace(/\/\*/g, '(?:/.*)?')
      .replace(/\/\(\.\*\)/g, '(?:/.*)(?:/)?')
      .replace(/\(\.\*\)/g, '(?:.*)')
      .replace(/\(\?:\.\*\)/g, '(?:.*)')
      .replace(/\//g, '\\/')
      .replace(/\?/g, '\\?')
      .replace(/\+/g, '\\+')
      .replace(/\*/g, '.*')
      .replace(/:(\w+)/g, (_, name) => {
        keys.push({ name });
        return '([^\\/]+)';
      })}${options.end ? '$' : ''}`
  );
  pathCache[path] = { keys, regexp };
  if (cacheCount < cacheLimit) {
    cacheCount++;
  }
  return { keys, regexp };
}

function matchPath(pathname, options = {}) {
  if (pathname === null || pathname === undefined) return null;
  const { path, exact = false, strict = false, sensitive = false } = options;
  const paths = [].concat(path);
  return paths.reduce((matched, path) => {
    if (matched) return matched;
    if (!path) return null;
    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict,
      sensitive
    });
    const match = regexp.exec(pathname);
    if (!match) return null;
    const [url, ...values] = match;
    const isExact = pathname === url;
    if (exact && !isExact) return null;
    return {
      path,
      url: path === '/' && url === '' ? '/' : url,
      isExact,
      params: keys.reduce((memo, key, index) => {
        memo[key.name] = values[index];
        return memo;
      }, {})
    };
  }, null);
}

// --- Router Context ---
export const RouterContext = createContext({
  location: typeof window !== 'undefined' ? window.location : { pathname: '/' },
  navigate: () => {}
});

// --- Link Component ---
export class Link extends Component {
  handleClick = event => {
    const { onClick, target, replace, href } = this.props;
    if (onClick) onClick(event);

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore right clicks
      (!target || target === '_self') && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();
      route(href, replace);
    }
  };

  render() {
    const {
      href,
      children,
      activeClassName,
      exactActiveMatch,
      class: className,
      ...props
    } = this.props;

    // Get current location from context
    const { location } = useContext(RouterContext);
    const pathname = location.hash ? location.hash.slice(1) : location.pathname;

    // Check if link is active
    const match = matchPath(pathname, {
      path: href,
      exact: exactActiveMatch
    });

    // Combine classes
    const combinedClassName = `${className || ''} ${match && activeClassName ? activeClassName : ''}`.trim();

    return html`
      <a
        href=${`#${href}`}
        onClick=${this.handleClick}
        class=${combinedClassName}
        ...${props}
      >
        ${children}
      </a>
    `;
  }
}

// Helper function for Link
function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

// --- Route Component ---
export function Route({ path, component, render, children, ...rest }) {
  const { location } = useContext(RouterContext);
  const pathname = location.hash ? location.hash.slice(1) : location.pathname;
  const match = matchPath(pathname, { path, exact: rest.exact });

  const props = { ...rest, location, match };

  if (!match) return null;
  
  if (component) {
    return html`<${component} ...${props} />`;
  }
  
  if (render) {
    return render(props);
  }
  
  if (typeof children === 'function') {
    return children(props);
  }
  
  return children;
}

// --- Router Component ---
export function Router({ children, onChange }) {
  const [location, setLocation] = useState(() => ({
    pathname: '/',
    hash: window.location.hash
  }));

  const handleLocationChange = useCallback(() => {
    const newLocation = {
      pathname: '/',
      hash: window.location.hash
    };
    
    setLocation(newLocation);
    
    if (onChange) {
      onChange(newLocation);
    }
  }, [onChange]);

  useEffect(() => {
    // Listen for hash changes
    window.addEventListener('hashchange', handleLocationChange);
    
    // Initial location setup
    handleLocationChange();
    
    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [handleLocationChange]);

  return html`
    <${RouterContext.Provider} value=${{ location, navigate: route }}>
      ${children}
    <//>
  `;
}

// --- Navigation Function ---
export function route(url, replace = false) {
  if (typeof url !== 'string') return;
  
  // Handle hash-based routing
  if (!url.startsWith('#')) {
    url = `#${url}`;
  }
  
  if (replace) {
    window.location.replace(url);
  } else {
    window.location.hash = url.startsWith('#') ? url.slice(1) : url;
  }
}

// Default export
export default {
  Router,
  Route,
  Link,
  route,
  RouterContext
};