"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  BookOpen,
  ExternalLink,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import { useBookmarks } from "@/features/submissions/hooks/use-bookmarks";

export default function BookmarkCenter() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { items, isLoading, error, reload, remove } = useBookmarks();

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const haystack = [
        item.article.title,
        item.article.doi ?? "",
        item.article.abstract ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, searchQuery]);

  return (
    <>
      <StudentTopHeader
        searchPlaceholder="Search bookmarks..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl text-foreground">Bookmarks</h1>
            <p className="text-muted-foreground mt-1">
              Articles you saved for later
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `${filtered.length} bookmark${filtered.length === 1 ? "" : "s"}`}
            </p>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or DOI"
              className="max-w-xs h-9"
            />
          </div>

          {error && (
            <Card className="p-6 border-border">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </Card>
          )}

          {isLoading && <RouteDataLoading label="Loading bookmarks…" />}

          {!isLoading && !error && filtered.length === 0 && (
            <Card className="p-12 border-border text-center">
              <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-lg mb-2">No bookmarks yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save articles from search to see them here.
              </p>
              <Button onClick={() => router.push("/student/articles")}>
                Browse articles
              </Button>
            </Card>
          )}

          <div className="space-y-4">
            {filtered.map((item) => (
              <Card key={item.articleId} className="p-6 border-border">
                <div className="flex gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-xl text-foreground mb-2 line-clamp-2">
                      {item.article.title}
                    </h3>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{item.article.publicationYear ?? "—"}</span>
                      </div>
                      <span className="text-border">•</span>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>
                          Saved{" "}
                          {new Date(item.bookmarkedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {item.article.abstract && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.article.abstract}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      DOI: {item.article.doi ?? "—"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/student/articles/${item.articleId}`)
                      }
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void remove(item.articleId)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </main>
    </>
  );
}
