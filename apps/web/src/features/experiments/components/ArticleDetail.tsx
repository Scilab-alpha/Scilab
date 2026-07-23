"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  BookmarkPlus,
  BookmarkCheck,
  ExternalLink,
  Calendar,
  Quote,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import Can from "@/shared/components/auth/Can";
import { Card } from "@/shared/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useArticleDetail } from "@/features/experiments/hooks/use-article-detail";
import { RelatedWorksGraph } from "@/features/experiments/components/RelatedWorksGraph";
import { toGraphPaperInfo } from "@/features/experiments/hooks/use-graph-paper-details";
import { toggleBookmark } from "@/features/submissions/api/bookmarks.api";
import { bookmarksRootQueryKey } from "@/features/submissions/hooks/use-bookmarks";
import { isLocallyBookmarked } from "@/features/submissions/api/local-bookmarks";
import {
  formatVolumeNumber,
  getArticleAbstract,
  getArticleCitationCount,
  getArticleDoi,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
  getAuthorDisplayName,
  getTagNames,
} from "@/features/experiments/utils/article-format";

interface ArticleDetailProps {
  articleId: string;
}

export default function ArticleDetail({ articleId }: ArticleDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { article, isLoading, error } = useArticleDetail(articleId);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  useEffect(() => {
    setIsBookmarked(isLocallyBookmarked(articleId));
  }, [articleId]);

  const handleToggleBookmark = async () => {
    if (isBookmarkPending || !article) {
      return;
    }

    setIsBookmarkPending(true);
    try {
      const result = await toggleBookmark({
        articleId,
        article: {
          id: articleId,
          title: getArticleTitle(article),
          abstract: article.article.abstract,
          doi: article.article.doi,
          publicationYear: article.article.publicationYear,
        },
      });
      setIsBookmarked(result.bookmarked);
      // Keep the bookmarks page in sync with the new toggle state.
      void queryClient.invalidateQueries({ queryKey: bookmarksRootQueryKey });
    } catch {
      // Keep previous bookmark state if the API call fails.
    } finally {
      setIsBookmarkPending(false);
    }
  };

  const copyCitation = () => {
    if (!article) {
      return;
    }

    const authors = article.authors
      .map((author) => getAuthorDisplayName(author))
      .join(", ");
    const year = getArticleYear(article) ?? "n.d.";
    const journal = getArticleJournal(article);
    const doi = getArticleDoi(article);
    const citation = `${authors} (${year}). ${getArticleTitle(article)}. ${journal}. https://doi.org/${doi}`;

    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  if (isLoading) {
    return (
      <>
        <StudentTopHeader />
        <main className="flex-1 overflow-auto bg-card">
          <PageContainer size="narrow" className="py-12">
            <RouteDataLoading label="Loading article…" />
          </PageContainer>
        </main>
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <StudentTopHeader />
        <main className="flex-1 overflow-auto bg-card">
          <PageContainer size="narrow" className="py-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/student/articles")}
              className="mb-8 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
            <Card className="p-8 border-border text-center">
              <p className="text-destructive mb-2">
                {error ?? "Article not found."}
              </p>
            </Card>
          </PageContainer>
        </main>
      </>
    );
  }

  const keywords = getTagNames(article.keywords, 12);
  const topics = article.topics
    .map((topic) => topic.displayName?.trim())
    .filter((name): name is string => Boolean(name));
  const doi = getArticleDoi(article);

  return (
    <>
      <StudentTopHeader />

      <main className="flex-1 overflow-auto bg-card">
        <PageContainer size="narrow" className="py-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/student/articles")}
            className="mb-8 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>

          <article className="space-y-8">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-foreground leading-tight mb-6">
                {getArticleTitle(article)}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-lg text-muted-foreground mb-4">
                {article.authors.map((author, index) => (
                  <span key={author.id} className="font-medium">
                    {index > 0 && (
                      <span className="text-muted-foreground mr-2">•</span>
                    )}
                    {getAuthorDisplayName(author)}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-base text-muted-foreground pb-6 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-5 h-5 text-muted-foreground shrink-0" />
                  {article.journal?.id ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/student/journals/${encodeURIComponent(article.journal!.id)}`,
                        )
                      }
                      className="font-medium text-foreground hover:underline text-left"
                    >
                      {getArticleJournal(article)}
                    </button>
                  ) : (
                    <span className="font-medium">
                      {getArticleJournal(article)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span>{getArticleYear(article) ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Quote className="w-5 h-5 text-muted-foreground" />
                  <span>{getArticleCitationCount(article)} citations</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-8 border-b border-border">
              <Can permission="bookmark">
                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  disabled={isBookmarkPending}
                  onClick={() => void handleToggleBookmark()}
                  className="h-10"
                >
                  {isBookmarked ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-2" />
                      Bookmarked
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      Bookmark
                    </>
                  )}
                </Button>
              </Can>
              {doi !== "—" && (
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() =>
                    window.open(`https://doi.org/${doi}`, "_blank")
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open DOI
                </Button>
              )}
            </div>

            <section className="space-y-4">
              <h2 className="font-heading text-2xl text-foreground">
                Abstract
              </h2>
              <p className="text-lg text-foreground leading-relaxed">
                {getArticleAbstract(article)}
              </p>
            </section>

            {keywords.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-heading text-2xl text-foreground">
                  Keywords
                </h2>
                <div className="flex flex-wrap gap-3">
                  {keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-4 py-2 bg-accent text-tag text-base font-medium rounded-lg"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {topics.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-heading text-2xl text-foreground">
                  Research Topics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {article.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="p-4 bg-background rounded-lg border border-border"
                    >
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {topic.isPrimary ? "Primary Topic" : "Related Topic"}
                      </h3>
                      <p className="text-base text-muted-foreground">
                        {topic.displayName}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h2 className="font-heading text-2xl text-foreground">
                Related Works Graph
              </h2>
              <RelatedWorksGraph
                articleId={articleId}
                citedArticleIds={article.citedArticleIds}
                rootPaper={toGraphPaperInfo(article)}
              />
            </section>

            <section className="space-y-4">
              <h2 className="font-heading text-2xl text-foreground">
                Citation
              </h2>
              <Card className="p-6 bg-background border-border">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                      DOI
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-base text-foreground font-mono">
                        {doi}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyCitation}
                        className="h-10 px-4"
                      >
                        {copiedCitation ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Journal
                      </p>
                      {article.journal?.id ? (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/student/journals/${encodeURIComponent(article.journal!.id)}`,
                            )
                          }
                          className="text-base text-foreground hover:underline text-left"
                        >
                          {getArticleJournal(article)}
                        </button>
                      ) : (
                        <p className="text-base text-foreground">
                          {getArticleJournal(article)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Volume
                      </p>
                      <p className="text-base text-foreground">
                        {formatVolumeNumber(article.article.volumeNumber)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Issue
                      </p>
                      <p className="text-base text-foreground">
                        {article.article.issueNumber ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Version
                      </p>
                      <p className="text-base text-foreground">
                        {article.article.version ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Publisher
                      </p>
                      <p className="text-base text-foreground">
                        {article.journal?.publisherName ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          </article>
        </PageContainer>
      </main>
    </>
  );
}
