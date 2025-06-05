import { ExtendedMap, extendGlobally } from "@solvro/utils/map";

declare global {
  interface Map<K, V> {
    getOrInsert: ExtendedMap<K, V>["getOrInsert"];
    getOrInsertWith: ExtendedMap<K, V>["getOrInsertWith"];
    getOrInsertWithAsync: ExtendedMap<K, V>["getOrInsertWithAsync"];
  }
}

extendGlobally();
