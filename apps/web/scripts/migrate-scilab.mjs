import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const scilab = path.join(root, "..", "scilab");
const src = path.join(root, "src");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else copyFile(srcPath, destPath);
  }
}

function transformContent(content, filePath) {
  let result = content;

  result = result.replace(/from "\.\/ui\//g, 'from "@/shared/components/ui/');
  result = result.replace(/from '\.\/ui\//g, "from '@/shared/components/ui/");
  result = result.replace(/from "\.\.\/ui\//g, 'from "@/shared/components/ui/');
  result = result.replace(/from '\.\.\/ui\//g, "from '@/shared/components/ui/");

  const featureImports = {
    "./JournalSearch": "@/features/laboratories/components/JournalSearch",
    "./JournalDetail": "@/features/laboratories/components/JournalDetail",
    "./ArticleSearch": "@/features/experiments/components/ArticleSearch",
    "./ArticleDetail": "@/features/experiments/components/ArticleDetail",
    "./TrendAnalysis": "@/features/reports/components/TrendAnalysis",
    "./ProfileManagement": "@/features/auth/components/ProfileManagement",
    "./BookmarkCenter": "@/features/submissions/components/BookmarkCenter",
    "./NotificationCenter": "@/features/notifications/components/NotificationCenter",
    "./RegisterScreen": "@/features/auth/components/RegisterScreen",
    "./components/RegisterScreen": "@/features/auth/components/RegisterScreen",
    "./components/Dashboard": "@/features/dashboard/components/Dashboard",
    "./components/admin/UserManagement": "@/features/users/components/UserManagement",
  };

  for (const [oldPath, newPath] of Object.entries(featureImports)) {
    result = result.replaceAll(`from "${oldPath}"`, `from "${newPath}"`);
    result = result.replaceAll(`from '${oldPath}'`, `from '${newPath}'`);
  }

  if (filePath.endsWith(".tsx") && !result.includes('"use client"')) {
    result = `"use client";\n\n${result}`;
  }

  return result;
}

function writeTransformed(from, to) {
  const content = fs.readFileSync(from, "utf8");
  fs.writeFileSync(to, transformContent(content, to));
}

// Styles
copyDir(path.join(scilab, "src", "styles"), path.join(src, "styles"));

// Update tailwind source path for Next.js
const tailwindCss = path.join(src, "styles", "tailwind.css");
fs.writeFileSync(
  tailwindCss,
  `@import 'tailwindcss' source(none);
@source '../../src/**/*.{js,ts,jsx,tsx}';

@import 'tw-animate-css';
`
);

// UI components
copyDir(
  path.join(scilab, "src", "app", "components", "ui"),
  path.join(src, "shared", "components", "ui")
);

// Image helper
writeTransformed(
  path.join(scilab, "src", "app", "components", "figma", "ImageWithFallback.tsx"),
  path.join(src, "shared", "components", "ui", "image-with-fallback.tsx")
);

// Assets
copyDir(path.join(scilab, "src", "imports"), path.join(src, "assets", "images"));

const featureMap = [
  ["src/app/App.tsx", "features/auth/components/LoginScreen.tsx"],
  ["src/app/components/RegisterScreen.tsx", "features/auth/components/RegisterScreen.tsx"],
  ["src/app/components/ProfileManagement.tsx", "features/auth/components/ProfileManagement.tsx"],
  ["src/app/components/Dashboard.tsx", "features/dashboard/components/Dashboard.tsx"],
  ["src/app/components/JournalSearch.tsx", "features/laboratories/components/JournalSearch.tsx"],
  ["src/app/components/JournalDetail.tsx", "features/laboratories/components/JournalDetail.tsx"],
  ["src/app/components/ArticleSearch.tsx", "features/experiments/components/ArticleSearch.tsx"],
  ["src/app/components/ArticleDetail.tsx", "features/experiments/components/ArticleDetail.tsx"],
  ["src/app/components/TrendAnalysis.tsx", "features/reports/components/TrendAnalysis.tsx"],
  ["src/app/components/BookmarkCenter.tsx", "features/submissions/components/BookmarkCenter.tsx"],
  ["src/app/components/NotificationCenter.tsx", "features/notifications/components/NotificationCenter.tsx"],
  ["src/app/components/admin/UserManagement.tsx", "features/users/components/UserManagement.tsx"],
];

for (const [fromRel, toRel] of featureMap) {
  writeTransformed(path.join(scilab, fromRel), path.join(src, toRel));
}

console.log("Migration copy complete.");
