import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scilab = path.join(__dirname, "..", "..", "scilab");
const src = path.join(__dirname, "..", "src");

function extractBetween(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start);
  if (start === -1 || end === -1) return "";
  return content.slice(start, end).trim();
}

function writeMock(relPath, header, body) {
  const filePath = path.join(src, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${header}\n\n${body}\n`);
}

const dashboard = fs.readFileSync(
  path.join(scilab, "src/app/components/Dashboard.tsx"),
  "utf8"
);
writeMock(
  "features/dashboard/api/mockDashboardData.ts",
  "",
  extractBetween(dashboard, "const publicationGrowthData", "export default function Dashboard")
);

const users = fs.readFileSync(
  path.join(scilab, "src/app/components/admin/UserManagement.tsx"),
  "utf8"
);
writeMock(
  "features/users/types/user.types.ts",
  'export type UserRole = "admin" | "researcher" | "reader";\nexport type UserStatus = "active" | "inactive" | "suspended";\n\nexport interface User {\n  id: string;\n  email: string;\n  displayName: string;\n  role: UserRole;\n  status: UserStatus;\n  registrationDate: string;\n  lastLogin?: string;\n}',
  extractBetween(users, "const mockUsers", "export default function UserManagement").replace(
    "interface User {",
    "import type { User } from \"../types/user.types\";\n\nexport "
  )
);

const notifications = fs.readFileSync(
  path.join(scilab, "src/app/components/NotificationCenter.tsx"),
  "utf8"
);
writeMock(
  "features/notifications/types/notification.types.ts",
  'export type NotificationCategory = "journal" | "topic" | "publication" | "system";\n\nexport interface Notification {\n  id: string;\n  category: NotificationCategory;\n  title: string;\n  description: string;\n  timestamp: string;\n  isRead: boolean;\n  relatedId?: string;\n}',
  extractBetween(
    notifications,
    "const mockNotifications",
    "export default function NotificationCenter"
  ).replace("interface Notification {", 'import type { Notification } from "../types/notification.types";\n\nexport ')
);

const bookmarks = fs.readFileSync(
  path.join(scilab, "src/app/components/BookmarkCenter.tsx"),
  "utf8"
);
writeMock(
  "features/submissions/api/mockBookmarks.ts",
  extractBetween(bookmarks, "interface BookmarkedArticle", "export default function BookmarkCenter")
    .replace(/^interface BookmarkedArticle[\s\S]*?}\n\n/m, 'export interface BookmarkedArticle {\n  id: string;\n  title: string;\n  authors: string[];\n  journal: string;\n  year: number;\n  doi: string;\n  keywords: string[];\n  bookmarkedDate: string;\n  notes?: string;\n}\n\n')
    .replace("const mockBookmarks", "export const mockBookmarks")
    .replace("const journalOptions", "export const journalOptions")
    .replace("const yearOptions", "export const yearOptions")
    .replace("const topicOptions", "export const topicOptions")
);

const trends = fs.readFileSync(
  path.join(scilab, "src/app/components/TrendAnalysis.tsx"),
  "utf8"
);
writeMock(
  "features/reports/api/mockTrendData.ts",
  "",
  extractBetween(trends, "// Mock data for multi-keyword trends", "export default function TrendAnalysis")
    .replace(/^const /gm, "export const ")
);

const articles = fs.readFileSync(
  path.join(scilab, "src/app/components/ArticleSearch.tsx"),
  "utf8"
);
writeMock(
  "features/experiments/types/article.types.ts",
  'export interface Article {\n  id: string;\n  title: string;\n  authors: string[];\n  journal: string;\n  year: number;\n  doi: string;\n  keywords: string[];\n  abstract: string;\n  citations: number;\n  isBookmarked: boolean;\n}',
  extractBetween(articles, "const mockArticles", "export default function ArticleSearch")
    .replace("interface Article {", 'import type { Article } from "../types/article.types";\n\nexport ')
    .replace("const mockArticles", "export const mockArticles")
    .replace("const yearOptions", "export const yearOptions")
);

const journals = fs.readFileSync(
  path.join(scilab, "src/app/components/JournalSearch.tsx"),
  "utf8"
);
writeMock(
  "features/laboratories/types/journal.types.ts",
  'export interface Journal {\n  id: string;\n  name: string;\n  issn: string;\n  publisher: string;\n  subjects: string[];\n  ranking: {\n    metric: string;\n    value: string;\n    quartile: "Q1" | "Q2" | "Q3" | "Q4";\n  };\n  openAccess: boolean;\n  oaDiamond: boolean;\n  country: string;\n  citations: number;\n  articles: number;\n}',
  extractBetween(journals, "const mockJournals", "export default function JournalSearch")
    .replace("interface Journal {", 'import type { Journal } from "../types/journal.types";\n\nexport ')
    .replace("const mockJournals", "export const mockJournals")
    .replace("const subjectAreas", "export const subjectAreas")
    .replace("const countries", "export const countries")
    .replace("const publishers", "export const publishers")
    .replace("const rankingMetrics", "export const rankingMetrics")
);

const journalDetail = fs.readFileSync(
  path.join(scilab, "src/app/components/JournalDetail.tsx"),
  "utf8"
);
writeMock(
  "features/laboratories/api/mockJournalDetail.ts",
  "",
  extractBetween(journalDetail, "const publicationTrendData", "export default function JournalDetail").replace(
    /^const /gm,
    "export const "
  )
);

console.log("Mock extraction complete.");
