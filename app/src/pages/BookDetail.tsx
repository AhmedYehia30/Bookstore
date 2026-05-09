import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Calendar, Globe, Package } from "lucide-react";
import { fetchBookById, type BookItem } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) {
      setBook(null);
      setError("Invalid book ID");
      return;
    }

    const controller = new AbortController();
    const loadBook = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchBookById(id, controller.signal);
        if (!result) {
          setError("Book not found");
          setBook(null);
        } else {
          setBook(result);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err?.message ?? "Unable to load book details");
          setBook(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadBook();
    return () => controller.abort();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-[#fa5e50] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-[#e5e5e0] mx-auto mb-4" />
          <p className="text-[#666666] mb-4">{error}</p>
          <Link to="/books" className="text-[#fa5e50] hover:underline text-sm">
            Browse other books
          </Link>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-[#e5e5e0] mx-auto mb-4" />
          <p className="text-[#666666]">Book not found</p>
          <Link
            to="/books"
            className="text-[#fa5e50] hover:underline text-sm mt-2 inline-block"
          >
            Browse all books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefcf8] py-8">
      <div className="section-container">
        <div className="flex items-center gap-2 text-sm text-[#666666] mb-6">
          <Link to="/" className="hover:text-[#fa5e50]">
            Home
          </Link>
          <span>/</span>
          <Link to="/books" className="hover:text-[#fa5e50]">
            Books
          </Link>
          <span>/</span>
          <span className="text-[#1a1a1a] font-medium">{book.title}</span>
        </div>

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1 text-sm text-[#666666] hover:text-[#fa5e50] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:sticky md:top-24 h-fit"
          >
            <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[400px] bg-[#f4f4f0] flex items-center justify-center text-[#999] text-sm">
                  No cover image available
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              {book.category && (
                <span className="text-[11px] uppercase tracking-wider text-[#fa5e50] font-medium">
                  {book.category}
                </span>
              )}
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-2 mb-2">
                {book.title}
              </h1>
              <p className="text-[#666666] text-lg">
                by{" "}
                <span className="text-[#1a1a1a] font-medium">
                  {book.author}
                </span>
              </p>
            </div>

            <p className="text-[#666666] leading-relaxed">{book.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {book.publisher && (
                <div className="flex items-center gap-2 text-[#666666]">
                  <BookOpen className="w-4 h-4" />
                  <span>{book.publisher}</span>
                </div>
              )}
              {book.publishedDate && (
                <div className="flex items-center gap-2 text-[#666666]">
                  <Calendar className="w-4 h-4" />
                  <span>{book.publishedDate}</span>
                </div>
              )}
              {book.language && (
                <div className="flex items-center gap-2 text-[#666666]">
                  <Globe className="w-4 h-4" />
                  <span>{book.language}</span>
                </div>
              )}
              {book.pageCount != null && (
                <div className="flex items-center gap-2 text-[#666666]">
                  <Package className="w-4 h-4" />
                  <span>{book.pageCount} pages</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#666666]">
                <span className="font-semibold">
                  {book.price
                    ? `$${Number(book.price).toFixed(2)}`
                    : "Not for sale"}
                </span>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => addToCart(book)}
                  className="btn-primary px-5 py-3"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(book);
                    navigate("/cart");
                  }}
                  className="btn-secondary px-5 py-3"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
