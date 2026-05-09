import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Users, Truck, Star } from "lucide-react";
import { fetchOpenLibraryBooks, type BookItem } from "@/lib/utils";
import BookCard from "@/components/BookCard";

const categories = [
  { name: "Fiction", image: "/book-covers/book1.jpg" },
  { name: "Non-Fiction", image: "/book-covers/book4.jpg" },
  { name: "Science", image: "/book-covers/book6.jpg" },
  { name: "History", image: "/book-covers/book8.jpg" },
  { name: "Technology", image: "/book-covers/book10.jpg" },
  { name: "Children's", image: "/book-covers/book12.jpg" },
  { name: "Self-Help", image: "/book-covers/book14.jpg" },
  { name: "Mystery", image: "/book-covers/book16.jpg" },
];

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<BookItem[]>([]);
  const [bestsellerBooks, setBestsellerBooks] = useState<BookItem[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(false);
  const [isBestsellerLoading, setIsBestsellerLoading] = useState(false);

  useEffect(() => {
    const featuredController = new AbortController();
    const bestsellerController = new AbortController();

    const loadFeatured = async () => {
      setIsFeaturedLoading(true);
      try {
        const results = await fetchOpenLibraryBooks(
          "popular books",
          featuredController.signal,
          8
        );
        setFeaturedBooks(results);
      } catch (err) {
        console.error("Open Library featured load error", err);
        setFeaturedBooks([]);
      } finally {
        setIsFeaturedLoading(false);
      }
    };

    const loadBestsellers = async () => {
      setIsBestsellerLoading(true);
      try {
        const results = await fetchOpenLibraryBooks(
          "bestsellers",
          bestsellerController.signal,
          8
        );
        setBestsellerBooks(results);
      } catch (err) {
        console.error("Open Library bestseller load error", err);
        setBestsellerBooks([]);
      } finally {
        setIsBestsellerLoading(false);
      }
    };

    loadFeatured();
    loadBestsellers();

    return () => {
      featuredController.abort();
      bestsellerController.abort();
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#fefcf8]">
        <div className="section-container py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a1a] leading-tight mb-6">
                Discover Your Next{" "}
                <span className="text-[#fa5e50]">Great Read</span>
              </h1>
              <p className="text-[#666666] text-lg leading-relaxed mb-8 max-w-lg">
                Open Library powers the featured book previews on this page.
                Explore books from a live open-source catalog.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <Link
                  to="/books"
                  className="btn-primary flex items-center gap-2"
                >
                  Browse Collection
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/books?sort=bestseller" className="btn-outline">
                  View Bestsellers
                </Link>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <p className="font-heading text-2xl font-bold text-[#1a1a1a]">
                    10K+
                  </p>
                  <p className="text-xs text-[#666666]">Books</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-2xl font-bold text-[#1a1a1a]">
                    50+
                  </p>
                  <p className="text-xs text-[#666666]">Categories</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-2xl font-bold text-[#1a1a1a]">
                    Free
                  </p>
                  <p className="text-xs text-[#666666]">Shipping</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden md:block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/hero.jpg"
                  alt="Book collection"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <div>
                    <p className="text-sm font-bold text-[#1a1a1a]">
                      4.9 Rating
                    </p>
                    <p className="text-[10px] text-[#666666]">
                      From 10,000+ readers
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f4f4f0] py-12">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: "10,000+ Books",
                desc: "Curated collection",
              },
              {
                icon: Users,
                title: "Expert Reviews",
                desc: "Reader community",
              },
              {
                icon: Truck,
                title: "Free Shipping",
                desc: "On orders over $35",
              },
              { icon: Star, title: "Best Prices", desc: "Quality guaranteed" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 bg-white rounded-xl p-4"
              >
                <div className="w-10 h-10 bg-[#fa5e50]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-[#fa5e50]" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1a1a1a]">
                    {feature.title}
                  </p>
                  <p className="text-xs text-[#666666]">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="section-container">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-[#1a1a1a] mb-3">
              Browse by Category
            </h2>
            <p className="text-[#666666]">Find your favorite genre</p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/books?category=${cat.name.toLowerCase().replace("'", "")}`}
                  className="group block text-center"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 relative">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {cat.name}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16 bg-[#f4f4f0]">
        <div className="section-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl font-bold text-[#1a1a1a] mb-1">
                Featured Books
              </h2>
              <p className="text-[#666666] text-sm">
                Handpicked by our editors
              </p>
            </div>
            <Link
              to="/books"
              className="text-[#fa5e50] text-sm font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isFeaturedLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 rounded-xl bg-[#f4f4f0] animate-pulse"
                  />
                ))
              : featuredBooks.map((book: BookItem, i: number) => (
                  <BookCard key={book.id} book={book} index={i} />
                ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-16">
        <div className="section-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl font-bold text-[#1a1a1a] mb-1">
                Bestsellers
              </h2>
              <p className="text-[#666666] text-sm">Most popular this month</p>
            </div>
            <Link
              to="/books"
              className="text-[#fa5e50] text-sm font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isBestsellerLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 rounded-xl bg-[#f4f4f0] animate-pulse"
                  />
                ))
              : bestsellerBooks.map((book: BookItem, i: number) => (
                  <BookCard key={book.id} book={book} index={i} />
                ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-[#fa5e50]">
        <div className="section-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Stay in the Literary Loop
            </h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Get weekly book recommendations, exclusive deals, and author
              interviews delivered to your inbox.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={e => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-sm text-[#1a1a1a] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="bg-white text-[#fa5e50] px-6 py-3 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
