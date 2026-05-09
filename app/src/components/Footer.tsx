import { Link } from "react-router";
import { BookOpen, Github, Twitter, Instagram, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-[#fefcf8]">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-[#fa5e50]" />
              <span className="font-heading text-xl font-bold">BookHaven</span>
            </div>
            <p className="text-[#fefcf8]/70 text-sm leading-relaxed mb-6">
              Your literary journey starts here. Discover thousands of books across every genre, curated for the modern reader.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-[#fefcf8]/50 hover:text-[#fa5e50] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-[#fefcf8]/50 hover:text-[#fa5e50] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-[#fefcf8]/50 hover:text-[#fa5e50] transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-[#fefcf8]/50 hover:text-[#fa5e50] transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Home", path: "/" },
                { label: "Browse Books", path: "/books" },
                { label: "Bestsellers", path: "/books?sort=bestseller" },
                { label: "Cart", path: "/cart" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-[#fefcf8]/70 hover:text-[#fa5e50] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Stay Updated</h4>
            <p className="text-[#fefcf8]/70 text-sm mb-4">
              Get weekly book recommendations and exclusive deals.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-[#fefcf8] placeholder:text-[#fefcf8]/40 focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/50"
              />
              <button type="submit" className="btn-primary py-2 px-4 text-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="section-container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[#fefcf8]/40 text-xs">
            &copy; {new Date().getFullYear()} BookHaven. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-[#fefcf8]/40">
            <a href="#" className="hover:text-[#fa5e50] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#fa5e50] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
