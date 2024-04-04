import { NAMESPACE } from './constants';

export interface Series {
  id: string;
  title: string;
  cover: string;
  latest: {
    title: string;
    url: string;
  };
}

interface History {
  list: () => Series[];
  add: (item: Series) => Series[];
  remove: (id: string) => Series[];
}

function createLocalStorage(name: string): History {
  const getValue = () => {
    try {
      const value = JSON.parse(localStorage.getItem(name) || '[]');
      return value as Series[];
    } catch (e) {
      return [];
    }
  };

  return {
    list: getValue,
    add(item: Series) {
      const storage = getValue();
      const added = [item, storage.filter((t) => t.id !== item.id)];
      localStorage.setItem(name, JSON.stringify(added));
      return storage;
    },
    remove(id: string) {
      const storage = getValue();
      const removed = storage.filter((item) => item.id === id);
      localStorage.setItem(name, JSON.stringify(removed));
      return storage;
    }
  };
}

function createGMStorage(name: string): History {
  const getValue = () => (GM_getValue(name) || []) as Series[];

  return {
    list: getValue,
    add(item: Series) {
      const storage = getValue();
      const added = [item, ...storage.filter((t) => t.id !== item.id)];
      GM_setValue(name, added);
      return added;
    },
    remove(id: string) {
      const storage = getValue();
      const removed = storage.filter((item) => item.id === id);
      GM_setValue(name, removed);
      return storage;
    }
  };
}

export function useHistory(key: string, type: 'gm' | 'localstorage' = 'gm') {
  const storageKey = `${NAMESPACE}_${key}`;
  if (type === 'localstorage') {
    return createLocalStorage(storageKey);
  }
  return createGMStorage(key);
}
