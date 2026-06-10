"use client";

import { useState } from "react";
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
import Can from "@/shared/components/auth/Can";
import { Card } from "@/shared/components/ui/card";

interface ArticleDetailProps {
  articleId: string;
}

export default function ArticleDetail({ articleId }: ArticleDetailProps) {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  const copyCitation = () => {
    const citation = "Zhang, L., Kumar, R., Smith, J., & Anderson, M. (2024). Deep Learning Approaches for Protein Structure Prediction: AlphaFold and Beyond. Nature Machine Intelligence, 6(4), 234-256. https://doi.org/10.1038/s42256-024-00789-1";
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  void articleId;

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

            {/* Article Header */}
            <article className="space-y-8">
              {/* Title */}
              <div>
                <h1 className="font-heading text-4xl md:text-5xl text-foreground leading-tight mb-6">
                  Deep Learning Approaches for Protein Structure Prediction: AlphaFold and Beyond
                </h1>

                {/* Authors */}
                <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                  <span className="font-medium">Li Zhang</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">Raj Kumar</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">John Smith</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">Maria Anderson</span>
                </div>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-base text-muted-foreground pb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Nature Machine Intelligence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>May 15, 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Quote className="w-5 h-5 text-muted-foreground" />
                    <span>245 citations</span>
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center gap-3 pb-8 border-b border-border">
                <Can permission="bookmark">
                  <Button
                    variant={isBookmarked ? "default" : "outline"}
                    onClick={() => setIsBookmarked(!isBookmarked)}
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
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => window.open("https://doi.org/10.1038/s42256-024-00789-1", "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open DOI
                </Button>
              </div>

              {/* Abstract */}
              <section className="space-y-4">
                <h2 className="font-heading text-2xl text-foreground">Abstract</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg text-foreground leading-relaxed">
                    Recent advances in deep learning have revolutionized protein structure prediction. We present a
                    comprehensive review of state-of-the-art methods, focusing on AlphaFold2 and its successors. Our
                    analysis covers the architectural innovations, training methodologies, and practical applications
                    that have enabled near-atomic accuracy in structure prediction.
                  </p>
                  <p className="text-lg text-foreground leading-relaxed mt-4">
                    We examine the key components of modern deep learning architectures, including attention mechanisms,
                    evolutionary coupling analysis, and multi-sequence alignment processing. The integration of these
                    techniques has dramatically improved prediction accuracy, reducing the median error from several
                    angstroms to sub-angstrom precision for many protein families.
                  </p>
                  <p className="text-lg text-foreground leading-relaxed mt-4">
                    Our review also discusses the limitations of current approaches, including challenges with
                    multi-domain proteins, membrane proteins, and intrinsically disordered regions. We propose future
                    directions for improving prediction accuracy and computational efficiency, with particular emphasis
                    on incorporating experimental constraints and developing more robust validation frameworks.
                  </p>
                </div>
              </section>

              {/* Keywords */}
              <section className="space-y-4">
                <h2 className="font-heading text-2xl text-foreground">Keywords</h2>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-accent text-tag text-base font-medium rounded-lg">
                    Deep Learning
                  </span>
                  <span className="px-4 py-2 bg-accent text-tag text-base font-medium rounded-lg">
                    Protein Structure
                  </span>
                  <span className="px-4 py-2 bg-accent text-tag text-base font-medium rounded-lg">
                    AlphaFold
                  </span>
                  <span className="px-4 py-2 bg-accent text-tag text-base font-medium rounded-lg">
                    Structural Biology
                  </span>
                  <span className="px-4 py-2 bg-accent text-tag text-base font-medium rounded-lg">
                    Machine Learning
                  </span>
                  <span className="px-4 py-2 bg-accent text-tag text-base font-medium rounded-lg">
                    Computational Biology
                  </span>
                </div>
              </section>

              {/* Topics */}
              <section className="space-y-4">
                <h2 className="font-heading text-2xl text-foreground">Research Topics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <h3 className="text-base font-semibold text-foreground mb-1">Primary Topic</h3>
                    <p className="text-base text-muted-foreground">Computational Structural Biology</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <h3 className="text-base font-semibold text-foreground mb-1">Field of Study</h3>
                    <p className="text-base text-muted-foreground">Bioinformatics</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <h3 className="text-base font-semibold text-foreground mb-1">Methodology</h3>
                    <p className="text-base text-muted-foreground">Neural Networks</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <h3 className="text-base font-semibold text-foreground mb-1">Application</h3>
                    <p className="text-base text-muted-foreground">Drug Discovery</p>
                  </div>
                </div>
              </section>

              {/* Citation Information */}
              <section className="space-y-4">
                <h2 className="font-heading text-2xl text-foreground">Citation</h2>
                <Card className="p-6 bg-background border-border">
                  <div className="space-y-4">
                    {/* APA Format */}
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">APA Format</p>
                      <p className="text-base text-foreground font-mono leading-relaxed">
                        Zhang, L., Kumar, R., Smith, J., & Anderson, M. (2024). Deep Learning Approaches for
                        Protein Structure Prediction: AlphaFold and Beyond. <em>Nature Machine Intelligence</em>,
                        6(4), 234-256. https://doi.org/10.1038/s42256-024-00789-1
                      </p>
                    </div>

                    {/* DOI */}
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">DOI</p>
                      <div className="flex items-center gap-3">
                        <code className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-base text-foreground font-mono">
                          10.1038/s42256-024-00789-1
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

                    {/* Publication Info */}
                    <div className="pt-4 border-t border-border grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Volume</p>
                        <p className="text-base text-foreground">6</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Issue</p>
                        <p className="text-base text-foreground">4</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Pages</p>
                        <p className="text-base text-foreground">234-256</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">Publisher</p>
                        <p className="text-base text-foreground">Nature Publishing Group</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Article Metrics */}
              <section className="space-y-4 pb-12">
                <h2 className="font-heading text-2xl text-foreground">Metrics</h2>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-6 border-border text-center">
                    <p className="font-heading text-3xl text-foreground mb-1">245</p>
                    <p className="text-sm text-muted-foreground">Citations</p>
                  </Card>
                  <Card className="p-6 border-border text-center">
                    <p className="font-heading text-3xl text-foreground mb-1">1,234</p>
                    <p className="text-sm text-muted-foreground">Readers</p>
                  </Card>
                  <Card className="p-6 border-border text-center">
                    <p className="font-heading text-3xl text-foreground mb-1">89</p>
                    <p className="text-sm text-muted-foreground">Recommendations</p>
                  </Card>
                </div>
              </section>
            </article>
          </PageContainer>
      </main>
    </>
  );
}
