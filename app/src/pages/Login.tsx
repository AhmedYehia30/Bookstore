import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loginMutation = trpc.customAuth.login.useMutation({
    onSuccess: (data) => {
      login(data.token, data.user as any);
      navigate("/");
    },
    onError: (err) => {
      setErrors({ general: err.message });
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = "Email is required";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    loginMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-[#fefcf8] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="w-8 h-8 text-[#fa5e50]" />
            <span className="font-heading text-2xl font-bold text-[#1a1a1a]">BookHaven</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-[#1a1a1a] mb-2">Welcome Back</h1>
          <p className="text-[#666666] text-sm">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-[#e5e5e0] p-8">
          {errors.general && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666666]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full btn-primary py-3 disabled:opacity-60"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#666666]">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#fa5e50] font-medium hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
