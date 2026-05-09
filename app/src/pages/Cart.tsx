import { Link } from "react-router";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function Cart() {
  const { items, isLoading, updateQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-[#fa5e50] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center py-16">
        <div className="text-center">
          <ShoppingCart className="w-20 h-20 text-[#e5e5e0] mx-auto mb-6" />
          <h2 className="font-heading text-2xl font-bold text-[#1a1a1a] mb-3">
            Your cart is empty
          </h2>
          <p className="text-[#666666] mb-6">
            Looks like you haven't added any books yet.
          </p>
          <Link to="/books" className="btn-primary inline-flex items-center gap-2">
            Start Browsing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const tax = totalPrice * 0.08;
  const shipping = totalPrice > 35 ? 0 : 4.99;
  const grandTotal = totalPrice + tax + shipping;

  return (
    <div className="min-h-screen bg-[#fefcf8] py-8">
      <div className="section-container">
        <h1 className="font-heading text-3xl font-bold text-[#1a1a1a] mb-8">
          Shopping Cart ({totalItems})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              item.book && (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl p-4 border border-[#e5e5e0] flex gap-4"
              >
                <Link to={`/books/${item.book.id}`}>
                  <img
                    src={item.book.coverImage}
                    alt={item.book.title}
                    className="w-20 h-30 object-cover rounded-lg flex-shrink-0"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/books/${item.book.id}`}>
                    <h3 className="font-heading font-semibold text-[#1a1a1a] truncate hover:text-[#fa5e50] transition-colors">
                      {item.book.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-[#666666] mb-2">{item.book.author}</p>
                  <p className="font-bold text-[#1a1a1a]">${Number(item.book.price).toFixed(2)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-[#e5e5e0] rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-2 hover:bg-[#f4f4f0]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-medium min-w-[32px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-[#f4f4f0]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="font-bold text-[#1a1a1a]">
                        ${(Number(item.book.price) * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-[#999] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              )
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-[#666666] hover:text-red-500 transition-colors"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl p-6 border border-[#e5e5e0] shadow-sm lg:sticky lg:top-24">
              <h2 className="font-heading text-xl font-bold text-[#1a1a1a] mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-[#666666]">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-[#fa5e50]">
                    Add ${(35 - totalPrice).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="border-t border-[#e5e5e0] pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#fa5e50]">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/books"
                className="block text-center text-sm text-[#666666] hover:text-[#fa5e50] mt-4 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
