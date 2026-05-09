import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, CreditCard, Truck, Wallet, Package, ArrowLeft } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuthContext();

  const [step, setStep] = useState<"form" | "success">("form");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    paymentMethod: "credit_card" as "credit_card" | "paypal" | "cod",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      setOrderId(data.order.id);
      clearCart();
      setStep("success");
      showToast("Order placed successfully!", "success");
    },
    onError: (err) => showToast(err.message, "error"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-[#e5e5e0] mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-[#1a1a1a] mb-3">Please Sign In</h2>
          <p className="text-[#666666] mb-6">You need to be logged in to complete checkout.</p>
          <button onClick={() => navigate("/login")} className="btn-primary">Sign In</button>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step === "form") {
    return (
      <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-[#e5e5e0] mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-[#1a1a1a] mb-3">Your cart is empty</h2>
          <button onClick={() => navigate("/books")} className="btn-primary">Browse Books</button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.email) errs.email = "Email is required";
    if (!form.address) errs.address = "Address is required";
    if (!form.city) errs.city = "City is required";
    if (!form.state) errs.state = "State is required";
    if (!form.zip) errs.zip = "ZIP code is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createOrder.mutate({
      shippingName: form.name,
      shippingEmail: form.email,
      shippingPhone: form.phone,
      shippingAddress: `${form.address}, ${form.city}, ${form.state} ${form.zip}, ${form.country}`,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
    });
  };

  const tax = totalPrice * 0.08;
  const shipping = totalPrice > 35 ? 0 : 4.99;
  const grandTotal = totalPrice + tax + shipping;

  return (
    <div className="min-h-screen bg-[#fefcf8] py-8">
      <div className="section-container">
        <button onClick={() => navigate("/cart")} className="flex items-center gap-1 text-sm text-[#666666] hover:text-[#fa5e50] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>

        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Shipping */}
                  <div className="bg-white rounded-xl p-6 border border-[#e5e5e0]">
                    <h2 className="font-heading text-lg font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#fa5e50]" /> Shipping Information
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">Full Name *</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">Email *</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">Phone</label>
                        <input
                          value={form.phone}
                          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">Address *</label>
                        <input
                          value={form.address}
                          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">City *</label>
                        <input
                          value={form.city}
                          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">State *</label>
                        <input
                          value={form.state}
                          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        />
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">ZIP Code *</label>
                        <input
                          value={form.zip}
                          onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        />
                        {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-[#666666] mb-1">Country</label>
                        <input
                          value={form.country}
                          disabled
                          className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg bg-[#f4f4f0] text-[#666666]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="bg-white rounded-xl p-6 border border-[#e5e5e0]">
                    <h2 className="font-heading text-lg font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-[#fa5e50]" /> Payment Method
                    </h2>
                    <div className="space-y-3">
                      {[
                        { value: "credit_card" as const, label: "Credit Card", icon: CreditCard },
                        { value: "paypal" as const, label: "PayPal", icon: Wallet },
                        { value: "cod" as const, label: "Cash on Delivery", icon: Truck },
                      ].map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                            form.paymentMethod === method.value
                              ? "border-[#fa5e50] bg-[#fa5e50]/5"
                              : "border-[#e5e5e0] hover:bg-[#f4f4f0]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.value}
                            checked={form.paymentMethod === method.value}
                            onChange={() => setForm((f) => ({ ...f, paymentMethod: method.value }))}
                            className="accent-[#fa5e50]"
                          />
                          <method.icon className="w-5 h-5 text-[#666666]" />
                          <span className="text-sm font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm text-[#666666] mb-1">Order Notes (optional)</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        placeholder="Any special instructions..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createOrder.isPending}
                    className="w-full btn-primary py-4 text-lg disabled:opacity-60"
                  >
                    {createOrder.isPending ? "Placing Order..." : `Place Order - $${grandTotal.toFixed(2)}`}
                  </button>
                </form>
              </div>

              {/* Summary */}
              <div>
                <div className="bg-white rounded-xl p-6 border border-[#e5e5e0] shadow-sm lg:sticky lg:top-24">
                  <h2 className="font-heading text-lg font-bold text-[#1a1a1a] mb-4">
                    Order Summary
                  </h2>
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      item.book && (
                      <div key={item.id} className="flex gap-3">
                        <img
                          src={item.book.coverImage}
                          alt={item.book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.book.title}</p>
                          <p className="text-xs text-[#666666]">
                            {item.quantity} x ${Number(item.book.price).toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          ${(Number(item.book.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      )
                    ))}
                  </div>
                  <div className="space-y-2 text-sm border-t border-[#e5e5e0] pt-4">
                    <div className="flex justify-between text-[#666666]">
                      <span>Subtotal</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#666666]">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-[#666666]">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total</span>
                      <span className="text-[#fa5e50]">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="font-heading text-3xl font-bold text-[#1a1a1a] mb-3">
                Order Placed Successfully!
              </h2>
              <p className="text-[#666666] mb-2">
                Thank you for your purchase. Your order has been received.
              </p>
              <p className="text-sm text-[#fa5e50] font-medium mb-8">
                Order #{orderId?.toString().padStart(6, "0")}
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => navigate("/")} className="btn-primary">
                  Continue Shopping
                </button>
                <button onClick={() => navigate("/profile")} className="btn-outline">
                  View Orders
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
