// Small LRU over a Map. Insertion order is recency: get() re-inserts.
export function createLru(max = 5000) {
  const map = new Map();
  return {
    get size() { return map.size; },
    has: (k) => map.has(k),
    get(k) {
      if (!map.has(k)) return undefined;
      const v = map.get(k);
      map.delete(k);
      map.set(k, v);
      return v;
    },
    set(k, v) {
      if (map.has(k)) map.delete(k);
      map.set(k, v);
      while (map.size > max) map.delete(map.keys().next().value);
    },
    keys: () => map.keys(),
    clear: () => map.clear(),
    toJSON: () => [...map.entries()],
    fromJSON(entries) {
      map.clear();
      for (const [k, v] of entries || []) map.set(k, v);
      while (map.size > max) map.delete(map.keys().next().value);
    },
  };
}
