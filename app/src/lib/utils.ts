import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const GOOGLE_BOOKS_API_KEY =
  ((import.meta as any).env?.VITE_GOOGLE_BOOKS_API_KEY as string | undefined) ??
  "AIzaSyAF3kDsIMDBAeoU-tXEy0a6KXYkKI8cNDA";
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

export interface BaseBook {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string | null;
  category: string | null;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  language?: string;
  infoLink?: string;
  price?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}

export type BookItem = BaseBook & {
  source: "openlibrary" | "google";
};
export type GoogleBook = BaseBook & {
  source: "google";
};

export type SearchSuggestion = string;

function normalizeVolume(volume: any): BaseBook {
  const info = volume?.volumeInfo ?? {};
  const sale = volume?.saleInfo ?? {};
  const imageLinks = info.imageLinks ?? {};
  const thumbnail = imageLinks.thumbnail || imageLinks.smallThumbnail || null;

  return {
    id: volume?.id ?? "",
    title: info.title ?? "Untitled",
    author: info.authors?.[0] ?? "Unknown author",
    description: info.description ?? "No description available.",
    coverImage: thumbnail
      ? String(thumbnail).replace(/^http:/i, "https:")
      : null,
    category: info.categories?.[0] ?? null,
    publisher: info.publisher,
    publishedDate: info.publishedDate,
    pageCount: info.pageCount,
    language: info.language,
    infoLink: info.infoLink,
    price: ensurePrice(
      sale?.listPrice?.amount != null ? String(sale.listPrice.amount) : null,
      volume?.id ?? info.title ?? "google-book"
    ),
    rating: info.averageRating ?? null,
    reviewCount: info.ratingsCount ?? null,
  };
}

function normalizeGoogleVolume(volume: any): BookItem {
  return {
    ...normalizeVolume(volume),
    source: "google",
  };
}

function normalizeOpenLibraryDoc(doc: any): BookItem {
  const coverId = doc.cover_i ?? doc.cover_id;
  const coverImage = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : null;
  const descriptionField =
    typeof doc.description === "string"
      ? doc.description
      : typeof doc.description?.value === "string"
        ? doc.description.value
        : undefined;
  const firstSentence =
    typeof doc.first_sentence === "string"
      ? doc.first_sentence
      : Array.isArray(doc.first_sentence)
        ? doc.first_sentence[0]
        : undefined;
  const description =
    descriptionField ??
    firstSentence ??
    doc.subtitle ??
    "No description available.";
  return {
    id: `openlibrary:${doc.key?.replace(/^\//, "") ?? doc.key ?? ""}`,
    title: doc.title ?? "Untitled",
    author: doc.author_name?.[0] ?? doc.author?.[0] ?? "Unknown author",
    description,
    coverImage,
    category: doc.subject?.[0] ?? null,
    publisher: doc.publisher?.[0],
    publishedDate: doc.first_publish_year
      ? String(doc.first_publish_year)
      : undefined,
    pageCount: doc.number_of_pages_median,
    language: doc.language?.[0] ?? undefined,
    infoLink: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
    price: ensurePrice(null, doc.key ?? doc.title ?? "openlibrary-book"),
    rating: null,
    reviewCount: null,
    source: "openlibrary",
  };
}

function normalizeOpenLibraryWork(work: any, authorName?: string): BookItem {
  const coverId = work.covers?.[0];
  const coverImage = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : null;
  const descriptionField = work.description;
  const description =
    typeof descriptionField === "string"
      ? descriptionField
      : (descriptionField?.value ?? "No description available.");
  return {
    id: `openlibrary:${work.key?.replace(/^\//, "") ?? ""}`,
    title: work.title ?? "Untitled",
    author: authorName ?? "Unknown author",
    description,
    coverImage,
    category: work.subjects?.[0] ?? null,
    publisher: undefined,
    publishedDate: work.first_publish_date,
    pageCount: work.number_of_pages,
    language: undefined,
    infoLink: work.key ? `https://openlibrary.org${work.key}` : undefined,
    price: ensurePrice(null, work.key ?? work.title ?? "openlibrary-work"),
    rating: null,
    reviewCount: null,
    source: "openlibrary",
  };
}

function generateDeterministicPrice(seedValue: string) {
  let hash = 0;
  for (let i = 0; i < seedValue.length; i += 1) {
    hash = (hash * 31 + seedValue.charCodeAt(i)) >>> 0;
  }
  const minPrice = 8;
  const maxOffset = 22;
  const dollars = minPrice + (hash % maxOffset);
  return `${dollars}.99`;
}

function ensurePrice(price: string | null, fallbackId: string) {
  const normalized = price?.toString().trim();
  if (normalized && !Number.isNaN(Number(normalized))) {
    return normalized;
  }
  return generateDeterministicPrice(fallbackId);
}

function isValidSearchBook(book: BookItem) {
  return Boolean(
    book.coverImage && book.description && book.description.trim() !== ""
  );
}

async function fetchGoogleBooksResponse(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Books API request failed: ${error}`);
  }
  const data = await response.json();
  console.log("Google Books API response:", data);
  return data;
}

export async function fetchBooksFromGoogle(
  query: string,
  signal?: AbortSignal,
  maxResults = 20
): Promise<GoogleBook[]> {
  const url = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${GOOGLE_BOOKS_API_KEY}`;
  const data = await fetchGoogleBooksResponse(url, signal);
  return Array.isArray(data?.items)
    ? data.items.map(normalizeGoogleVolume).filter(isValidSearchBook)
    : [];
}

export async function fetchBooks(
  query: string,
  signal?: AbortSignal,
  maxResults = 20
): Promise<BookItem[]> {
  const trimmedQuery = query.trim() || "";
  if (!trimmedQuery) {
    return [];
  }

  const openLibraryUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    trimmedQuery
  )}&limit=${maxResults}`;
  try {
    const data = await fetchGoogleBooksResponse(openLibraryUrl, signal);
    const docs = Array.isArray(data?.docs) ? data.docs : [];
    const books = docs
      .slice(0, maxResults)
      .map(normalizeOpenLibraryDoc)
      .filter(isValidSearchBook);
    if (books.length > 0) {
      return books;
    }
  } catch (openErr) {
    console.warn(
      "Open Library search failed, falling back to Google Books.",
      openErr
    );
  }

  try {
    return await fetchBooksFromGoogle(trimmedQuery, signal, maxResults);
  } catch (googleErr) {
    console.error("Google Books fallback also failed.", googleErr);
    return [];
  }
}

export async function fetchOpenLibrarySuggestions(
  query: string,
  signal?: AbortSignal,
  maxResults = 5
): Promise<SearchSuggestion[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    trimmedQuery
  )}&limit=${maxResults}`;
  const data = await fetchGoogleBooksResponse(url, signal);
  const docs = Array.isArray(data?.docs) ? data.docs : [];
  return docs
    .map((doc: any) => doc.title)
    .filter(Boolean)
    .slice(0, maxResults);
}

export async function fetchOpenLibraryBooks(
  query: string,
  signal?: AbortSignal,
  maxResults = 20
): Promise<BookItem[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    trimmedQuery
  )}&limit=${maxResults}`;
  const data = await fetchGoogleBooksResponse(url, signal);
  const docs = Array.isArray(data?.docs) ? data.docs : [];
  return docs
    .slice(0, maxResults)
    .map(normalizeOpenLibraryDoc)
    .filter(isValidSearchBook);
}

export async function fetchBookById(
  id: string,
  signal?: AbortSignal
): Promise<BookItem | null> {
  if (!id) return null;
  if (id.startsWith("openlibrary:")) {
    const key = id.replace(/^openlibrary:/, "");
    const path = key.startsWith("/") ? key : `/${key}`;
    const url = `https://openlibrary.org${path}.json`;
    const data = await fetchGoogleBooksResponse(url, signal);
    let authorName: string | undefined;
    if (Array.isArray(data?.authors) && data.authors[0]?.author?.key) {
      try {
        const authorResp = await fetchGoogleBooksResponse(
          `https://openlibrary.org${data.authors[0].author.key}.json`,
          signal
        );
        authorName = authorResp?.name;
      } catch {
        authorName = undefined;
      }
    }
    return normalizeOpenLibraryWork(data, authorName);
  }
  if (id.startsWith("google:")) {
    const googleId = id.replace(/^google:/, "");
    const result = await fetchGoogleBookById(googleId, signal);
    return result ? { ...result, source: "google" } : null;
  }

  const fallback = await fetchGoogleBookById(id, signal);
  return fallback ? { ...fallback, source: "google" } : null;
}

export async function fetchGoogleBookById(
  id: string,
  signal?: AbortSignal
): Promise<GoogleBook | null> {
  if (!id) return null;
  const url = `${GOOGLE_BOOKS_BASE_URL}/${encodeURIComponent(id)}?key=${GOOGLE_BOOKS_API_KEY}`;
  const data = await fetchGoogleBooksResponse(url, signal);
  if (!data) return null;
  return {
    ...normalizeVolume(data),
    source: "google",
  };
}
