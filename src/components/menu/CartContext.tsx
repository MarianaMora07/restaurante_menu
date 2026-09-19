'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { CartItem, Dish } from '@/types/database';

const STORAGE_KEY = 'joswil-cart-v1';
const EMPTY_ITEMS: CartItem[] = [];

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addDish: (dish: Dish) => void;
  addDishWithSides: (dish: Dish, sideDishes: { id: string; name: string; price: number }[]) => void;
  incrementItem: (dishId: string) => void;
  decrementItem: (dishId: string) => void;
  setItemNote: (dishId: string, note: string) => void;
  removeItem: (dishId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function sanitizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): CartItem[] => {
    if (typeof entry !== 'object' || entry === null) return [];
    const item = entry as Record<string, unknown>;
    if (
      typeof item.dishId !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.price !== 'number' ||
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      typeof item.quantity !== 'number' ||
      !Number.isFinite(item.quantity)
    ) {
      return [];
    }
    return [
      {
        dishId: item.dishId,
        name: item.name,
        price: item.price,
        quantity: Math.max(1, Math.floor(item.quantity)),
        note: typeof item.note === 'string' && item.note.trim() ? item.note : undefined,
        sideDishes: Array.isArray(item.sideDishes)
          ? (item.sideDishes as { id: string; name: string; price: number }[])
          : undefined,
      },
    ];
  });
}

/* Fuente externa de verdad: memoria como caché estable + persistencia en localStorage. */
let cachedItems: CartItem[] = EMPTY_ITEMS;

function readStoredItems(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ITEMS;
    return sanitizeItems(JSON.parse(raw));
  } catch {
    // Almacenamiento corrupto o no disponible: se inicia con carrito vacío.
    return EMPTY_ITEMS;
  }
}

function getSnapshot(): CartItem[] {
  return cachedItems;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_ITEMS;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function commitItems(update: (prev: CartItem[]) => CartItem[]): void {
  const prev = cachedItems === EMPTY_ITEMS ? readStoredItems() : cachedItems;
  const next = update(prev);
  cachedItems = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Sin persistencia disponible (navegador privado): el carrito vive en memoria.
  }
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addDish = useCallback((dish: Dish) => {
    if (!dish.is_available) return;
    commitItems((prev) => {
      const existing = prev.find((item) => item.dishId === dish.id);
      if (!existing) {
        return [...prev, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
      }
      return prev.map((item) =>
        item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  }, []);

  const addDishWithSides = useCallback((dish: Dish, sideDishes: { id: string; name: string; price: number }[]) => {
    if (!dish.is_available) return;
    commitItems((prev) => {
      const existing = prev.find((item) => item.dishId === dish.id);
      if (!existing) {
        return [...prev, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1, sideDishes: sideDishes.length > 0 ? sideDishes : undefined }];
      }
      return prev.map((item) =>
        item.dishId === dish.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  }, []);

  const incrementItem = useCallback((dishId: string) => {
    commitItems((prev) =>
      prev.map((item) =>
        item.dishId === dishId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, []);

  const decrementItem = useCallback((dishId: string) => {
    commitItems((prev) =>
      prev.map((item) =>
        item.dishId === dishId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  }, []);

  const setItemNote = useCallback((dishId: string, note: string) => {
    commitItems((prev) =>
      prev.map((item) => (item.dishId === dishId ? { ...item, note } : item))
    );
  }, []);

  const removeItem = useCallback((dishId: string) => {
    commitItems((prev) => prev.filter((item) => item.dishId !== dishId));
  }, []);

  const clearCart = useCallback(() => {
    commitItems(() => EMPTY_ITEMS);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => {
        const sides = item.sideDishes?.reduce((s, sd) => s + sd.price, 0) ?? 0;
        return sum + (item.price + sides) * item.quantity;
      }, 0),
      addDish,
      addDishWithSides,
      incrementItem,
      decrementItem,
      setItemNote,
      removeItem,
      clearCart,
    }),
    [items, addDish, addDishWithSides, incrementItem, decrementItem, setItemNote, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider.');
  return context;
}
