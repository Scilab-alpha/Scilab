"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  ArrowLeft,
  LockOpen,
  Award,
  Globe,
  BarChart3,
  Plus,
  Check,
  Lock,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import Can from "@/shared/components/auth/Can";
import { Card } from "@/shared/components/ui/card";
import { useJournalDetail } from "@/features/laboratories/hooks/use-journal-detail";
import { useJournalArticles } from "@/features/laboratories/hooks/use-journal-articles";
import { toggleFollow } from "@/features/follows/api/follows.api";
import { isLocallyFollowing } from "@/features/follows/api/local-follows";
import {
  getJournalCountry,
  getJournalIssn,
  getJournalName,
  getJournalPublisher,
  getJournalSubjects,
} from "@/features/laboratories/utils/journal-format";
import {
  getArticleAbstract,
  getArticleAuthors,
  getArticleTitle,
  getArticleYear,
} from "@/features/experiments/utils/article-format";

interface JournalDetailProps {
  journalId: string;
}

export default function JournalDetail({ journalId }: JournalDetailProps) {
  const router = useRouter();
  const { journal, isLoading, error } = useJournalDetail(journalId);
  const {
    items: articles,
    isLoading: isArticlesLoading,
    isLoadingMore,
    hasMore,
    error: articlesError,
    loadMore,
  } = useJournalArticles(journalId);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);

  useEffect(() => {
    setIsFollowing(isLocallyFollowing("JOURNAL", journalId));
  }, [journalId]);

  const handleToggleFollow = async () => {
    if (isFollowPending || !journal) {
      return;
    }

    setIsFollowPending(true);
    try {
      const result = await toggleFollow({
        objectType: "JOURNAL",
        objectId: journalId,
        displayName: getJournalName(journal),
        notifyMode: "IN_APP",
      });
      setIsFollowing(result.followed);
    } catch {
      // Keep previous follow state if the request fails.
    } finally {
      setIsFollowPending(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <StudentTopHeader />
        <main className="flex-1 overflow-auto">
          <PageContainer size="wide" className="py-16">
            <RouteDataLoading label="Loading journal…" />
          </PageContainer>
        </main>
      </>
    );
  }

  if (error || !journal) {
    return (
      <>
        <StudentTopHeader />
        <main className="flex-1 overflow-auto">
          <PageContainer size="wide" className="py-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/student/journals")}
              className="mb-6 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Journals
            </Button>
            <Card className="p-8 border-border text-center">
              <p className="text-destructive">
                {error ?? "Journal not found."}
              </p>
            </Card>
          </PageContainer>
        </main>
      </>
    );
  }

  const subjects = getJournalSubjects(journal);

  return (
    <>
      <StudentTopHeader />

      <main className="flex-1 overflow-auto" data-journal-id={journalId}>
        <div className="bg-card border-b border-border">
          <PageContainer size="wide" className="py-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/student/journals")}
              className="mb-6 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Journals
            </Button>

            <div className="flex gap-8">
              <div className="w-24 h-24 bg-primary rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0">
                <BookOpen
                  className="w-12 h-12 text-primary-foreground"
                  strokeWidth={1.75}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-6 mb-4">
                  <div className="flex-1">
                    <h1 className="font-heading text-4xl text-foreground mb-3">
                      {getJournalName(journal)}
                    </h1>
                    <div className="flex items-center gap-4 text-muted-foreground mb-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">ISSN:</span>
                        <span className="text-sm">
                          {getJournalIssn(journal)}
                        </span>
                      </div>
                      <span className="text-border">•</span>
                      <span className="text-sm">
                        {getJournalPublisher(journal)}
                      </span>
                      <span className="text-border">•</span>
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">
                          {getJournalCountry(journal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Can permission="follow">
                    <Button
                      disabled={isFollowPending}
                      onClick={() => void handleToggleFollow()}
                      className={`h-10 px-6 ${
                        isFollowing
                          ? "bg-surface-raised text-foreground hover:bg-accent"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  </Can>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {journal.isOpenAccess ? (
                    <div className="px-3 py-1.5 bg-teal/10 text-teal rounded-lg flex items-center gap-2 text-sm font-medium">
                      <LockOpen className="w-4 h-4" />
                      Open Access
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-surface-raised text-muted-foreground rounded-lg flex items-center gap-2 text-sm font-medium">
                      <Lock className="w-4 h-4" />
                      Subscription
                    </div>
                  )}
                  {journal.isOaDiamond && (
                    <div className="px-3 py-1.5 bg-accent text-tag rounded-lg flex items-center gap-2 text-sm font-medium">
                      <Award className="w-4 h-4" />
                      OA Diamond
                    </div>
                  )}
                  {journal.type && (
                    <div className="px-3 py-1.5 bg-accent text-tag rounded-lg text-sm font-medium capitalize">
                      {journal.type}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </PageContainer>
        </div>

        <PageContainer size="wide" className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Articles in graph
                      </p>
                      <p className="font-heading text-2xl text-foreground">
                        {journal.articleCount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Source ID</p>
                      <p className="font-heading text-sm text-foreground break-all">
                        {journal.sourceId ?? "—"}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6 border-border">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="font-heading text-lg text-foreground">
                    Articles in this journal
                  </h2>
                  {articles.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Showing {articles.length}
                      {journal.articleCount > articles.length
                        ? ` of ${journal.articleCount.toLocaleString()}`
                        : ""}
                    </span>
                  )}
                </div>

                {isArticlesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading articles…
                  </div>
                ) : articlesError ? (
                  <p className="text-sm text-destructive py-4">{articlesError}</p>
                ) : articles.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No articles are linked to this journal in the catalog yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {articles.map((item) => {
                      const year = getArticleYear(item);
                      return (
                        <button
                          key={item.article.id}
                          type="button"
                          onClick={() =>
                            router.push(
                              `/student/articles/${encodeURIComponent(item.article.id)}`,
                            )
                          }
                          className="w-full text-left rounded-lg border border-border p-4 hover:bg-accent/40 transition-colors"
                        >
                          <p className="font-medium text-foreground mb-1 line-clamp-2">
                            {getArticleTitle(item)}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="line-clamp-1">
                              {getArticleAuthors(item)}
                            </span>
                            {year != null && (
                              <span className="inline-flex items-center gap-1 shrink-0">
                                <Calendar className="w-3.5 h-3.5" />
                                {year}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {getArticleAbstract(item)}
                          </p>
                        </button>
                      );
                    })}

                    {hasMore && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          disabled={isLoadingMore}
                          onClick={() => void loadMore()}
                          className="w-full"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading more…
                            </>
                          ) : (
                            "Load more articles"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6 border-border">
                <h2 className="font-heading text-lg text-foreground mb-4">
                  Subject Categories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-3 py-1.5 bg-accent text-tag text-xs font-medium rounded-full"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </Card>

              <Card className="p-6 border-border">
                <h2 className="font-heading text-lg text-foreground mb-4">
                  Coverage
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="text-foreground font-medium">
                      {journal.coverage ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Region</span>
                    <span className="text-foreground font-medium">
                      {journal.region ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="text-foreground font-medium">
                      {getJournalCountry(journal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Publisher</span>
                    <span className="text-foreground font-medium text-right">
                      {getJournalPublisher(journal)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </PageContainer>
      </main>
    </>
  );
}
