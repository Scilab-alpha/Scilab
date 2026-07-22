"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  Lock,
  LockOpen,
} from "lucide-react";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { useJournals } from "@/features/laboratories/hooks/use-journals";
import {
  getJournalCountry,
  getJournalIssn,
  getJournalName,
  getJournalPublisher,
  getJournalSubjects,
} from "@/features/laboratories/utils/journal-format";

const itemsPerPage = 8;

export default function JournalSearch() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { items, isLoading, isLoadingMore, hasMore, error, reload, loadMore } =
    useJournals();

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJournals = items.slice(startIndex, endIndex);

  return (
    <>
      <StudentTopHeader />

      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl text-foreground">
              Journal Search
            </h1>
            <p className="mt-1 text-muted-foreground">
              Browse journals returned by the academic catalog API
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              "Loading journals..."
            ) : (
              <>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {items.length === 0
                    ? 0
                    : `${startIndex + 1}-${Math.min(endIndex, items.length)}`}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {items.length}
                  {hasMore ? "+" : ""}
                </span>{" "}
                journals returned by the backend
              </>
            )}
          </p>

          {error && (
            <Card className="border-border p-6">
              <p className="mb-4 text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </Card>
          )}

          {isLoading && <RouteDataLoading label="Loading journals…" />}

          {!isLoading && !error && currentJournals.length === 0 && (
            <Card className="border-border p-8 text-center text-muted-foreground">
              No journals were returned by the backend.
            </Card>
          )}

          <div className="space-y-4">
            {currentJournals.map((journal) => {
              const subjects = getJournalSubjects(journal);
              return (
                <Card
                  key={journal.id}
                  onClick={() => router.push(`/student/journals/${journal.id}`)}
                  className="cursor-pointer border-border p-6 transition-all hover:border-primary/30"
                >
                  <div className="flex gap-6">
                    <div className="flex size-16 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20">
                      <BookOpen className="size-8 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 line-clamp-1 font-heading text-lg text-foreground">
                            {getJournalName(journal)}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span>ISSN: {getJournalIssn(journal)}</span>
                            <span>{getJournalPublisher(journal)}</span>
                            <span className="flex items-center gap-1">
                              <Globe className="size-3.5" />
                              {getJournalCountry(journal)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {journal.isOpenAccess ? (
                            <span className="flex items-center gap-1 rounded-md bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                              <LockOpen className="size-3.5" /> Open Access
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-md bg-surface-raised px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              <Lock className="size-3.5" /> Subscription
                            </span>
                          )}
                          {journal.isOaDiamond && (
                            <span className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-tag">
                              <Award className="size-3.5" /> OA Diamond
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {subjects.slice(0, 3).map((subject) => (
                          <span
                            key={subject}
                            className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-tag"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {journal.articleCount.toLocaleString()}
                        </span>{" "}
                        articles in graph
                        {journal.coverage
                          ? ` · Coverage: ${journal.coverage}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {!isLoading && items.length > 0 && (
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="mr-1 size-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  isLoadingMore || (currentPage === totalPages && !hasMore)
                }
                onClick={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage((page) => page + 1);
                    return;
                  }
                  void loadMore().then((loaded) => {
                    if (loaded) setCurrentPage((page) => page + 1);
                  });
                }}
              >
                {isLoadingMore ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : null}
                Next <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          )}
        </PageContainer>
      </main>
    </>
  );
}
