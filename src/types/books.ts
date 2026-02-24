export type BookCategory = "guide" | "faq" | "education" | "report";

export type BookIconKey =
  | "book"
  | "key"
  | "flag"
  | "chart"
  | "graduation"
  | "tag"
  | "building"
  | "home"
  | "help"
  | "shield"
  | "file";

export interface BookTOCItem {
  title: string;
  duration?: string;
}

export interface BookData {
  title: string;
  cover: string;
  href: string;
  category: BookCategory;
  tableOfContents: BookTOCItem[];

  /** If true, we render the cover image as-is (no overlay); used for locked brand covers. */
  coverLocked?: boolean;

  /** Icon badge shown on the cover overlay (when coverLocked is not true). */
  icon?: BookIconKey;
}
