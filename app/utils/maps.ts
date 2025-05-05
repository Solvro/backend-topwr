declare global {
  interface Map<K, V> {
    /**
     * Retrieves the existing value under the given key, or inserts a default value and returns it
     *
     * Make sure to side-effect import "#utils/maps" to use this function!
     *
     * WILL BREAK IF YOU INSERT `undefined` INTO THE MAP
     * PLEASE DO NOT INSERT `undefined` INTO MAPS
     *
     * @param key key to look up
     * @param defaultValue value to insert if no value was found
     * @returns the retrieved value or the inserted value (if no value existed)
     */
    getOrInsert(key: K, defaultValue: V): V;
    /**
     * Retrieves the existing value under the given key, or inserts a default value and returns it
     *
     * Make sure to side-effect import "#utils/maps" to use this function!
     *
     * WILL BREAK IF YOU INSERT `undefined` INTO THE MAP
     * PLEASE DO NOT INSERT `undefined` INTO MAPS
     *
     * @param key key to look up
     * @param defaultValue function used to generate a default value for a given key
     * @returns the retrieved value or the inserted value (if no value existed)
     */
    getOrInsertWith(key: K, defaultValue: (key: K) => V): V;
    /**
     * Retrieves the existing value under the given key, or inserts a default value and returns it
     *
     * Make sure to side-effect import "#utils/maps" to use this function!
     *
     * WILL BREAK IF YOU INSERT `undefined` INTO THE MAP
     * PLEASE DO NOT INSERT `undefined` INTO MAPS
     *
     * @param key key to look up
     * @param defaultValue async function used to generate a default value for a given key
     * @returns the retrieved value or the inserted value (if no value existed)
     */
    getOrInsertWithAsync(
      key: K,
      defaultValue: (key: K) => Promise<V>,
    ): Promise<V>;
  }
}

globalThis.Map.prototype.getOrInsert = function <K, V>(
  this: Map<K, V>,
  key: K,
  defaultValue: V,
): V {
  const existing = this.get(key);
  if (existing !== undefined) {
    return existing;
  }
  this.set(key, defaultValue);
  return defaultValue;
};

globalThis.Map.prototype.getOrInsertWith = function <K, V>(
  this: Map<K, V>,
  key: K,
  defaultValue: (key: K) => V,
): V {
  const existing = this.get(key);
  if (existing !== undefined) {
    return existing;
  }
  const newValue = defaultValue(key);
  this.set(key, newValue);
  return newValue;
};

globalThis.Map.prototype.getOrInsertWithAsync = async function <K, V>(
  this: Map<K, V>,
  key: K,
  defaultValue: (key: K) => Promise<V>,
): Promise<V> {
  const existing = this.get(key);
  if (existing !== undefined) {
    return existing;
  }
  const newValue = await defaultValue(key);
  this.set(key, newValue);
  return newValue;
};

export {};
