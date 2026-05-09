import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, ShoppingBag, Users,
  Plus, Pencil, Trash2, Search, ChevronLeft,
  DollarSign, UserCheck, AlertTriangle
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

type AdminTab = "dashboard" | "books" | "orders" | "users";

const sidebarItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
];

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAuthContext();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [bookForm, setBookForm] = useState({
    title: "", author: "", description: "", category: "fiction",
    price: "", stock: "", coverImage: "", isbn: "", publisher: "", publishedYear: "", pages: "",
  });
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [showBookForm, setShowBookForm] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [bookSearch, setBookSearch] = useState("");

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isAdmin });
  const { data: ordersData } = trpc.orders.listAll.useQuery(
    { page: 1, limit: 50, status: orderStatusFilter },
    { enabled: isAdmin && (activeTab === "orders" || activeTab === "dashboard") }
  );
  const { data: usersData } = trpc.admin.getUsers.useQuery(
    { page: 1, limit: 50 },
    { enabled: isAdmin && activeTab === "users" }
  );
  const { data: booksData } = trpc.books.list.useQuery(
    { page: 1, limit: 100, search: bookSearch },
    { enabled: isAdmin && activeTab === "books" }
  );

  const utils = trpc.useUtils();

  const createBook = trpc.books.create.useMutation({
    onSuccess: () => {
      showToast("Book created!", "success");
      setShowBookForm(false);
      resetForm();
      utils.books.list.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const updateBook = trpc.books.update.useMutation({
    onSuccess: () => {
      showToast("Book updated!", "success");
      setShowBookForm(false);
      setEditingBookId(null);
      resetForm();
      utils.books.list.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const deleteBook = trpc.books.delete.useMutation({
    onSuccess: () => {
      showToast("Book deleted!", "info");
      utils.books.list.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const updateOrderStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      showToast("Order updated!", "success");
      utils.orders.listAll.invalidate();
    },
  });

  const updateUserRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      showToast("User role updated!", "success");
      utils.admin.getUsers.invalidate();
    },
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-3 border-[#fa5e50] border-t-transparent rounded-full" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-[#666666] mb-4">You need admin privileges to access this page.</p>
          <button onClick={() => navigate("/")} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setBookForm({ title: "", author: "", description: "", category: "fiction", price: "", stock: "", coverImage: "", isbn: "", publisher: "", publishedYear: "", pages: "" });
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title: bookForm.title,
      author: bookForm.author,
      description: bookForm.description,
      category: bookForm.category,
      price: Number(bookForm.price),
      stock: Number(bookForm.stock),
      coverImage: bookForm.coverImage,
      isbn: bookForm.isbn || undefined,
      publisher: bookForm.publisher || undefined,
      publishedYear: bookForm.publishedYear ? Number(bookForm.publishedYear) : undefined,
      pages: bookForm.pages ? Number(bookForm.pages) : undefined,
    };
    if (editingBookId) {
      updateBook.mutate({ id: editingBookId, ...data });
    } else {
      createBook.mutate(data);
    }
  };

  const startEdit = (book: any) => {
    setBookForm({
      title: book.title, author: book.author, description: book.description,
      category: book.category, price: book.price, stock: book.stock.toString(),
      coverImage: book.coverImage, isbn: book.isbn ?? "", publisher: book.publisher ?? "",
      publishedYear: book.publishedYear?.toString() ?? "", pages: book.pages?.toString() ?? "",
    });
    setEditingBookId(book.id);
    setShowBookForm(true);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-[#f4f4f0]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1a1a1a] text-white min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-8">
              <ChevronLeft className="w-4 h-4" />
              <span className="font-heading text-lg font-bold">BookHaven Admin</span>
            </button>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowBookForm(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id ? "bg-[#fa5e50] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 ml-64 p-8">
          {/* Dashboard */}
          {activeTab === "dashboard" && stats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-heading text-2xl font-bold text-[#1a1a1a] mb-6">Dashboard Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: "Total Books", value: stats.totalBooks, icon: BookOpen, color: "bg-blue-500" },
                  { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-purple-500" },
                  { label: "Total Users", value: stats.totalUsers, icon: UserCheck, color: "bg-green-500" },
                  { label: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-[#fa5e50]" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-6 border border-[#e5e5e0] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-[#1a1a1a]">{stat.value}</p>
                    <p className="text-sm text-[#666666]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {stats.lowStockBooks.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                  <h3 className="font-heading font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Low Stock Alerts
                  </h3>
                  <div className="space-y-2">
                    {stats.lowStockBooks.map((book) => (
                      <div key={book.id} className="flex justify-between text-sm">
                        <span className="text-amber-900">{book.title}</span>
                        <span className="font-medium text-amber-700">{book.stock} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-[#e5e5e0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e5e0]">
                  <h3 className="font-heading font-bold text-[#1a1a1a]">Recent Orders</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-[#f4f4f0]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[#666666] font-medium">Order</th>
                      <th className="px-6 py-3 text-left text-[#666666] font-medium">Customer</th>
                      <th className="px-6 py-3 text-left text-[#666666] font-medium">Total</th>
                      <th className="px-6 py-3 text-left text-[#666666] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-[#e5e5e0]">
                        <td className="px-6 py-3 font-medium">#{order.id.toString().padStart(6, "0")}</td>
                        <td className="px-6 py-3">{order.shippingName}</td>
                        <td className="px-6 py-3">${Number(order.total).toFixed(2)}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Books */}
          {activeTab === "books" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-heading text-2xl font-bold text-[#1a1a1a]">Manage Books</h1>
                <button
                  onClick={() => { resetForm(); setEditingBookId(null); setShowBookForm(true); }}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Book
                </button>
              </div>

              {showBookForm && (
                <div className="bg-white rounded-xl p-6 border border-[#e5e5e0] shadow-lg mb-6">
                  <h3 className="font-heading font-bold text-lg mb-4">
                    {editingBookId ? "Edit Book" : "Add New Book"}
                  </h3>
                  <form onSubmit={handleSaveBook} className="grid md:grid-cols-2 gap-4">
                    <input placeholder="Title *" value={bookForm.title} onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" required />
                    <input placeholder="Author *" value={bookForm.author} onChange={(e) => setBookForm((f) => ({ ...f, author: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" required />
                    <textarea placeholder="Description *" value={bookForm.description} onChange={(e) => setBookForm((f) => ({ ...f, description: e.target.value }))} className="md:col-span-2 px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" rows={3} required />
                    <select value={bookForm.category} onChange={(e) => setBookForm((f) => ({ ...f, category: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30">
                      {["fiction", "non-fiction", "science", "history", "technology", "childrens", "self-help", "mystery", "fantasy", "romance", "biography", "philosophy", "poetry"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input placeholder="Price *" type="number" step="0.01" value={bookForm.price} onChange={(e) => setBookForm((f) => ({ ...f, price: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" required />
                    <input placeholder="Stock *" type="number" value={bookForm.stock} onChange={(e) => setBookForm((f) => ({ ...f, stock: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" required />
                    <input placeholder="Cover Image URL *" value={bookForm.coverImage} onChange={(e) => setBookForm((f) => ({ ...f, coverImage: e.target.value }))} className="md:col-span-2 px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" required />
                    <input placeholder="ISBN" value={bookForm.isbn} onChange={(e) => setBookForm((f) => ({ ...f, isbn: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" />
                    <input placeholder="Publisher" value={bookForm.publisher} onChange={(e) => setBookForm((f) => ({ ...f, publisher: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" />
                    <input placeholder="Published Year" type="number" value={bookForm.publishedYear} onChange={(e) => setBookForm((f) => ({ ...f, publishedYear: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" />
                    <input placeholder="Pages" type="number" value={bookForm.pages} onChange={(e) => setBookForm((f) => ({ ...f, pages: e.target.value }))} className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30" />
                    <div className="md:col-span-2 flex gap-3">
                      <button type="submit" className="btn-primary text-sm" disabled={createBook.isPending || updateBook.isPending}>
                        {createBook.isPending || updateBook.isPending ? "Saving..." : "Save Book"}
                      </button>
                      <button type="button" onClick={() => setShowBookForm(false)} className="px-4 py-2 text-sm border border-[#e5e5e0] rounded-lg hover:bg-[#f4f4f0]">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-xl border border-[#e5e5e0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e5e0]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                    <input
                      placeholder="Search books..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      className="w-full max-w-sm pl-9 pr-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f4f4f0]">
                      <tr>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Book</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Category</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Price</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Stock</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booksData?.books.map((book) => (
                        <tr key={book.id} className="border-t border-[#e5e5e0]">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <img src={book.coverImage} alt="" className="w-8 h-12 object-cover rounded" />
                              <div>
                                <p className="font-medium truncate max-w-[200px]">{book.title}</p>
                                <p className="text-xs text-[#666666]">{book.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 capitalize">{book.category}</td>
                          <td className="px-6 py-3">${Number(book.price).toFixed(2)}</td>
                          <td className="px-6 py-3">
                            <span className={book.stock < 5 ? "text-red-500 font-medium" : ""}>{book.stock}</span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => startEdit(book)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => { if (confirm("Delete this book?")) deleteBook.mutate({ id: book.id }); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Orders */}
          {activeTab === "orders" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-heading text-2xl font-bold text-[#1a1a1a]">Manage Orders</h1>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30 bg-white"
                >
                  <option value="">All Statuses</option>
                  {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-xl border border-[#e5e5e0] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f4f4f0]">
                      <tr>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Order</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Customer</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Total</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Status</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData?.orders.map((order) => (
                        <tr key={order.id} className="border-t border-[#e5e5e0]">
                          <td className="px-6 py-3 font-medium">#{order.id.toString().padStart(6, "0")}</td>
                          <td className="px-6 py-3">
                            <p className="font-medium">{order.shippingName}</p>
                            <p className="text-xs text-[#666666]">{order.shippingEmail}</p>
                          </td>
                          <td className="px-6 py-3">${Number(order.total).toFixed(2)}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus.mutate({ id: order.id, status: e.target.value as any })}
                              className="text-xs px-2 py-1 border border-[#e5e5e0] rounded-lg focus:outline-none"
                            >
                              {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-heading text-2xl font-bold text-[#1a1a1a] mb-6">Manage Users</h1>
              <div className="bg-white rounded-xl border border-[#e5e5e0] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f4f4f0]">
                      <tr>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">User</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Email</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Role</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Joined</th>
                        <th className="px-6 py-3 text-left text-[#666666] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData?.users.map((user) => (
                        <tr key={user.id} className="border-t border-[#e5e5e0]">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#fa5e50]/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-[#fa5e50]">
                                  {user.name?.charAt(0).toUpperCase() ?? "U"}
                                </span>
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">{user.email}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => updateUserRole.mutate({ userId: user.id, role: user.role === "admin" ? "user" : "admin" })}
                              className="text-xs px-3 py-1.5 border border-[#e5e5e0] rounded-lg hover:bg-[#f4f4f0]"
                            >
                              Toggle Role
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
