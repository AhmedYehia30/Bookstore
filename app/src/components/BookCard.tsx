import { Link } from "react-router";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import type { BookItem } from "@/lib/utils";
interface BookCardProps {
  book: BookItem;
  index?: number;
}

export default function BookCard({ book, index = 0 }: BookCardProps) {
  const rating = Number(book.rating ?? 0);
  const reviewCount = book.reviewCount ?? 0;
  const hasPrice = book.price && !Number.isNaN(Number(book.price));
  const displayPrice = hasPrice
    ? `$${Number(book.price).toFixed(2)}`
    : "Price unavailable";
  const { addToCart } = useCart();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <Link to={`/books/${encodeURIComponent(book.id)}`} className="block">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#f4f4f0] card-shadow mb-3">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-[#f4f4f0] flex items-center justify-center text-[#999] text-xs">
              No cover image
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
      </Link>

      <div className="space-y-1.5">
        <p className="text-[11px] uppercase tracking-wider text-[#fa5e50] font-medium">
          {book.category ?? "General"}
        </p>
        <Link to={`/books/${encodeURIComponent(book.id)}`}>
          <h3 className="font-heading font-semibold text-[#1a1a1a] text-sm leading-tight line-clamp-2 group-hover:text-[#fa5e50] transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-[#666666]">by {book.author}</p>

        {rating > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-[#666666]">({reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-[#1a1a1a] text-base">
            {displayPrice}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addToCart(book)}
              className="rounded-full bg-[#fa5e50] px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-[#e04d41]"
            >
              Add to cart
            </button>
            <div className="px-2 py-1 bg-[#f4f4f0] rounded-full text-[11px] text-[#666666]">
              View details
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
