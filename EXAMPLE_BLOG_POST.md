# Example Blog Post Template

Use this as a template for your blog posts! Copy and paste into the editor.

---

# Getting Started with React Hooks: A Complete Guide

## Introduction

React Hooks revolutionized how we write React components. In this comprehensive guide, we'll explore the most commonly used hooks and learn when to use each one.

## What Are Hooks?

Hooks are special functions that let you "hook into" React features from function components. They were introduced in React 16.8 and have since become the standard way to write React components.

### Benefits of Hooks

- **Simpler code**: No need for class components
- **Better code reuse**: Share stateful logic between components
- **Easier testing**: Pure functions are easier to test
- **Better organization**: Group related logic together

## useState Hook

The `useState` hook lets you add state to function components.

### Basic Example

```javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

### Multiple State Variables

```javascript
function UserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(0);

  return (
    <form>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        type="number"
        value={age} 
        onChange={(e) => setAge(Number(e.target.value))} 
      />
    </form>
  );
}
```

## useEffect Hook

The `useEffect` hook lets you perform side effects in function components.

### Fetching Data

```javascript
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      setUser(data);
      setLoading(false);
    }

    fetchUser();
  }, [userId]); // Re-run when userId changes

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### Cleanup

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);

  // Cleanup function
  return () => clearInterval(interval);
}, []);
```

## useContext Hook

Share data across components without prop drilling.

```javascript
import { createContext, useContext, useState } from 'react';

// Create context
const ThemeContext = createContext();

// Provider component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Use context in child components
function ThemedButton() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <button
      style={{ 
        background: theme === 'light' ? 'white' : 'black',
        color: theme === 'light' ? 'black' : 'white'
      }}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      Toggle Theme
    </button>
  );
}
```

## Custom Hooks

Create reusable logic by building custom hooks!

### useLocalStorage Hook

```javascript
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Usage
function App() {
  const [name, setName] = useLocalStorage('name', 'Guest');

  return (
    <input 
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}
```

## Best Practices

### 1. Rules of Hooks

✅ **DO**: Call hooks at the top level
```javascript
function MyComponent() {
  const [state, setState] = useState(0); // ✅ Good
  
  if (condition) {
    const [other, setOther] = useState(1); // ❌ Bad - conditional
  }
}
```

### 2. Dependency Arrays

Always include all dependencies in `useEffect`:

```javascript
// ❌ Bad - missing dependency
useEffect(() => {
  console.log(userId);
}, []);

// ✅ Good - all dependencies listed
useEffect(() => {
  console.log(userId);
}, [userId]);
```

### 3. Separate Concerns

Split complex logic into multiple hooks:

```javascript
function UserProfile() {
  // Each hook handles one concern
  const [user, loading] = useUser();
  const [posts, postsLoading] = usePosts(user?.id);
  const [theme] = useTheme();
  
  // Component logic...
}
```

## Common Patterns

### Async Data Fetching

```javascript
function useApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url);
        const json = await response.json();
        
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}
```

### Debounced Search

```javascript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchInput() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    // Only runs 500ms after user stops typing
    if (debouncedSearch) {
      console.log('Searching for:', debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## Performance Optimization

### useMemo

Memoize expensive calculations:

```javascript
function ExpensiveComponent({ items }) {
  const expensiveValue = useMemo(() => {
    return items.reduce((acc, item) => {
      // Expensive computation
      return acc + complexCalculation(item);
    }, 0);
  }, [items]); // Only recalculate when items change

  return <div>{expensiveValue}</div>;
}
```

### useCallback

Memoize callback functions:

```javascript
function ParentComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('Clicked!');
  }, []); // Function never changes

  return <ChildComponent onClick={handleClick} />;
}
```

## Comparison Table

| Hook | Purpose | When to Use |
|------|---------|-------------|
| `useState` | Add state | Need to track values that change |
| `useEffect` | Side effects | Data fetching, subscriptions, DOM updates |
| `useContext` | Access context | Avoid prop drilling |
| `useReducer` | Complex state | Multiple related state values |
| `useMemo` | Memoize values | Expensive calculations |
| `useCallback` | Memoize functions | Prevent unnecessary re-renders |
| `useRef` | Persist values | DOM references, mutable values |

## Conclusion

React Hooks provide a powerful and intuitive way to manage state and side effects in functional components. By following best practices and understanding when to use each hook, you can write cleaner, more maintainable React code.

### Key Takeaways

- ✅ Hooks simplify component logic
- ✅ Custom hooks enable code reuse
- ✅ Always follow the Rules of Hooks
- ✅ Use the dependency array correctly
- ✅ Optimize with `useMemo` and `useCallback` when needed

Happy coding! 🚀

---

## Further Reading

- [React Hooks Official Docs](https://react.dev/reference/react)
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

*Published on January 15, 2024 • 8 min read*
