import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { User, Package, ArrowLeft, BookOpen } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

type ProfileTab = "profile" | "orders";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
  });

  const { data: ordersData } = trpc.orders.list.useQuery(
    { page: 1, limit: 20 },
    { enabled: isAuthenticated }
  );

  const updateProfile = trpc.customAuth.updateProfile.useMutation({
    onSuccess: () => {
      showToast("Profile updated!", "success");
    },
    onError: (err) => showToast(err.message, "error"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-[#e5e5e0] mx-auto mb-4" />
          <p className="text-[#666666] mb-4">Please sign in to view your profile.</p>
          <button onClick={() => navigate("/login")} className="btn-primary">Sign In</button>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(form);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-[#fefcf8] py-8">
      <div className="section-container">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-[#666666] hover:text-[#fa5e50] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="grid md:grid-cols-[200px_1fr] gap-8">
          {/* Sidebar */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-6 px-3">
              <div className="w-10 h-10 bg-[#fa5e50]/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-[#fa5e50]">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-[#666666]">{user?.email}</p>
              </div>
            </div>
            {[
              { id: "profile" as ProfileTab, label: "My Profile", icon: User },
              { id: "orders" as ProfileTab, label: "My Orders", icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#fa5e50] text-white"
                    : "text-[#666666] hover:bg-[#f4f4f0]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {activeTab === "profile" && (
              <div>
                <h1 className="font-heading text-2xl font-bold text-[#1a1a1a] mb-6">My Profile</h1>
                <div className="bg-white rounded-xl p-6 border border-[#e5e5e0] max-w-lg">
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Full Name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Email</label>
                      <input
                        value={user?.email ?? ""}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg bg-[#f4f4f0] text-[#666666]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Phone</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        placeholder="Your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Address</label>
                      <textarea
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                        placeholder="Your shipping address"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="btn-primary disabled:opacity-60"
                    >
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <h1 className="font-heading text-2xl font-bold text-[#1a1a1a] mb-6">My Orders</h1>
                {ordersData?.orders.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-[#e5e5e0]">
                    <Package className="w-12 h-12 text-[#e5e5e0] mx-auto mb-3" />
                    <p className="text-[#666666]">No orders yet.</p>
                    <button onClick={() => navigate("/books")} className="text-[#fa5e50] text-sm hover:underline mt-2">
                      Start shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ordersData?.orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl p-6 border border-[#e5e5e0]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-medium text-sm">Order #{order.id.toString().padStart(6, "0")}</p>
                            <p className="text-xs text-[#666666]">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-[#e5e5e0] pt-4">
                          <p className="text-sm text-[#666666]">
                            {order.shippingName} - {order.shippingAddress?.slice(0, 50)}...
                          </p>
                          <p className="font-bold text-[#fa5e50]">${Number(order.total).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
