import { useEffect, useState, useRef, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { BookOpen, Loader2, Search } from "lucide-react";
import BookCard from "@/components/BookCard";
import {
  fetchBooks,
  fetchOpenLibrarySuggestions,
  type BookItem,
} from "@/lib/utils";

export default function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category")?.trim() ?? "";
  const sortParam = searchParams.get("sort")?.trim() ?? "";
  const searchParam = searchParams.get("search")?.trim() ?? "";
  const defaultQuery =
    searchParam ||
    (categoryParam
      ? categoryParam
      : sortParam === "bestseller"
        ? "bestseller"
        : "");

  const [query, setQuery] = useState(defaultQuery);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  useEffect(() => {
    const activeQuery = defaultQuery.trim();
    const controller = new AbortController();

    async function loadBooks() {
      if (!activeQuery) {
        setBooks([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await fetchBooks(activeQuery, controller.signal, 24);
        setBooks(results);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err?.message ?? "Unable to load books. Please try again.");
          setBooks([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadBooks();
    return () => controller.abort();
  }, [defaultQuery]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const results = await fetchOpenLibrarySuggestions(
          trimmedQuery,
          controller.signal,
          5
        );
        setSuggestions(results);
        setIsSuggestionsOpen(results.length > 0);
      } catch (err) {
        console.warn("Unable to load suggestions", err);
        setSuggestions([]);
        setIsSuggestionsOpen(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed) {
      setSearchParams({ search: trimmed });
    } else {
      searchParams.delete("search");
      setSearchParams(searchParams);
    }
    setIsSuggestionsOpen(false);
  };

  const chooseSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSearchParams({ search: suggestion });
    setIsSuggestionsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="min-h-screen bg-[#fefcf8] py-8">
      <div className="section-container">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <BookOpen className="mx-auto mb-4 w-12 h-12 text-[#fa5e50]" />
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
            Search Books
          </h1>
        </div>

        <div className="max-w-3xl mx-auto" ref={containerRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <label htmlFor="books-search" className="sr-only">
              Search books
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
              <input
                ref={inputRef}
                id="books-search"
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setIsSuggestionsOpen(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setIsSuggestionsOpen(true);
                  }
                }}
                className="w-full rounded-full border border-[#ddd] bg-white py-4 pl-12 pr-36 text-sm text-[#1a1a1a] shadow-sm focus:border-[#fa5e50] focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/20"
                placeholder="Search books by title, author, or keyword..."
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#fa5e50] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#e04d41] transition-colors"
              >
                Search
              </button>
            </div>

            {isSuggestionsOpen && suggestions.length > 0 && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#eee] bg-white shadow-lg">
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => chooseSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left text-sm text-[#1a1a1a] hover:bg-[#f7f2ef]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="max-w-5xl mx-auto mt-10">
          {error && (
            <div className="rounded-3xl border border-[#fad2cc] bg-[#fff1ee] px-6 py-5 text-sm text-[#a33b2f]">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="mt-12">
              <div className="flex flex-col items-center gap-4 text-[#666666] mb-10">
                <Loader2 className="h-10 w-10 animate-spin text-[#fa5e50]" />
                <p className="text-lg font-medium">Loading books...</p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-[#eee] bg-white p-6 shadow-sm animate-pulse"
                  >
                    <div className="mb-4 h-60 w-full rounded-3xl bg-[#f4f4f0]" />
                    <div className="h-5 w-3/4 rounded-full bg-[#f4f4f0] mb-3" />
                    <div className="h-4 w-1/2 rounded-full bg-[#f4f4f0] mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded-full bg-[#f4f4f0]" />
                      <div className="h-4 w-4/5 rounded-full bg-[#f4f4f0]" />
                      <div className="h-4 w-1/2 rounded-full bg-[#f4f4f0]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : defaultQuery ? (
            books.length > 0 ? (
              <>
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {books.map((book, index) => (
                    <BookCard
                      key={`${book.source}-${book.id}`}
                      book={book}
                      index={index}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-12 rounded-3xl border border-[#eee] bg-white px-8 py-12 text-center text-[#666666] shadow-sm">
                <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-3">
                  No books found
                </h2>
                <p>Try a different search term or refine your query.</p>
              </div>
            )
          ) : (
            <div className="mt-12 rounded-3xl border border-[#eee] bg-white px-8 py-12 text-center text-[#666666] shadow-sm">
              <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-3">
                Start your search
              </h2>
              <p>
                Type a title, author, or topic to discover books from Open
                Library and Google Books.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
