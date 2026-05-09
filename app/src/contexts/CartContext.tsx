import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { trpc } from "@/providers/trpc";
import { useAuthContext } from "./AuthContext";
import { useToast } from "./ToastContext";
import type { BookItem } from "@/lib/utils";

interface CartBook {
  id: number | string;
  title: string;
  author: string;
  price: string;
  coverImage: string;
  stock: number | null;
}

interface CartItem {
  id: number | string;
  userId: number;
  bookId: number | string;
  quantity: number;
  createdAt: Date;
  book: CartBook | null;
}

type AddToCartPayload = number | (BookItem & { quantity?: number });

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  totalItems: number;
  totalPrice: number;
  addToCart: (book: AddToCartPayload, quantity?: number) => void;
  updateQuantity: (itemId: number | string, quantity: number) => void;
  removeItem: (itemId: number | string) => void;
  clearCart: () => void;
  refetch: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const { showToast } = useToast();
  const [localItems, setLocalItems] = useState<CartItem[]>([]);

  const { data, isLoading, refetch } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      showToast("Added to cart!", "success");
      refetch();
    },
    onError: err => showToast(err.message, "error"),
  });

  const addExternalMutation = trpc.cart.addExternal.useMutation({
    onSuccess: () => {
      showToast("Added to cart!", "success");
      refetch();
    },
    onError: err => showToast(err.message, "error"),
  });

  const updateMutation = trpc.cart.update.useMutation({
    onSuccess: () => refetch(),
    onError: err => showToast(err.message, "error"),
  });

  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      showToast("Item removed", "info");
      refetch();
    },
    onError: err => showToast(err.message, "error"),
  });

  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      showToast("Cart cleared", "info");
      refetch();
    },
    onError: err => showToast(err.message, "error"),
  });

  const items: CartItem[] = (data?.items ?? []).map((item: any) => ({
    id: item.id,
    userId: item.userId,
    bookId: item.bookId,
    quantity: item.quantity,
    createdAt: item.createdAt,
    book: item.book,
  }));

  const localTotalItems = localItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const localTotalPrice = localItems.reduce(
    (sum, item) => sum + Number(item.book?.price ?? 0) * item.quantity,
    0
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.book?.price ?? 0) * item.quantity,
    0
  );

  const addToCart = useCallback(
    (book: AddToCartPayload, quantity = 1) => {
      if (!isAuthenticated) {
        if (typeof book === "number") {
          showToast("Please login to add items to cart", "warning");
          return;
        }

        setLocalItems(currentItems => {
          const existingIndex = currentItems.findIndex(
            item => String(item.book?.id) === String(book.id)
          );
          const newItems = [...currentItems];
          if (existingIndex >= 0) {
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
          } else {
            newItems.push({
              id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
              userId: 0,
              bookId: book.id,
              quantity,
              createdAt: new Date(),
              book: {
                id: book.id,
                title: book.title,
                author: book.author,
                price: book.price ?? "0.00",
                coverImage: book.coverImage ?? "",
                stock: null,
              },
            });
          }
          localStorage.setItem("local_cart", JSON.stringify(newItems));
          return newItems;
        });
        showToast("Added to cart locally. Sign in to checkout.", "success");
        return;
      }

      if (typeof book === "number") {
        addMutation.mutate({ bookId: book, quantity });
        return;
      }

      addExternalMutation.mutate({
        title: book.title,
        author: book.author,
        description: book.description,
        category: book.category ?? undefined,
        price: book.price ?? undefined,
        coverImage:
          book.coverImage && book.coverImage.trim().length > 0
            ? book.coverImage
            : "https://via.placeholder.com/300x450?text=No+Cover",
        isbn: undefined,
        publisher: book.publisher ?? undefined,
        publishedYear: book.publishedDate
          ? Number(book.publishedDate.replace(/[^0-9]/g, ""))
          : undefined,
        pages: book.pageCount ?? undefined,
        language: book.language ?? undefined,
        quantity,
      });
    },
    [isAuthenticated, addMutation, addExternalMutation, showToast, refetch]
  );

  const updateQuantity = useCallback(
    (itemId: number | string, quantity: number) => {
      if (!isAuthenticated) {
        setLocalItems(currentItems => {
          const updated = currentItems.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          );
          localStorage.setItem("local_cart", JSON.stringify(updated));
          return updated;
        });
        return;
      }
      updateMutation.mutate({ itemId: Number(itemId), quantity });
    },
    [isAuthenticated, updateMutation]
  );

  const removeItem = useCallback(
    (itemId: number | string) => {
      if (!isAuthenticated) {
        setLocalItems(currentItems => {
          const updated = currentItems.filter(item => item.id !== itemId);
          localStorage.setItem("local_cart", JSON.stringify(updated));
          return updated;
        });
        return;
      }
      removeMutation.mutate({ itemId: Number(itemId) });
    },
    [isAuthenticated, removeMutation]
  );

  const clearCart = useCallback(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("local_cart");
      setLocalItems([]);
      showToast("Cart cleared", "info");
      return;
    }
    clearMutation.mutate();
  }, [clearMutation, isAuthenticated, showToast]);

  const value: CartContextType = {
    items: isAuthenticated ? items : localItems,
    isLoading,
    totalItems: isAuthenticated ? totalItems : localTotalItems,
    totalPrice: isAuthenticated ? totalPrice : localTotalPrice,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refetch,
  };

  useEffect(() => {
    const stored = localStorage.getItem("local_cart");
    if (!stored) return;
    try {
      setLocalItems(JSON.parse(stored));
    } catch {
      setLocalItems([]);
    }
  }, []);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
