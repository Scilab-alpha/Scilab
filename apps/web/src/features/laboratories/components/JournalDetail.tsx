"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  ArrowLeft,
  LockOpen,
  Lock,
  Award,
  Globe,
  Calendar,
  Users,
  BarChart3,
  ExternalLink,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import Can from "@/shared/components/auth/Can";
import { Card } from "@/shared/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const publicationTrendData = [
  { year: "2019", publications: 420 },
  { year: "2020", publications: 480 },
  { year: "2021", publications: 550 },
  { year: "2022", publications: 620 },
  { year: "2023", publications: 680 },
  { year: "2024", publications: 720 },
];

const rankingHistoryData = [
  { year: "2019", impactFactor: 3.2, quartile: 2 },
  { year: "2020", impactFactor: 3.8, quartile: 2 },
  { year: "2021", impactFactor: 4.1, quartile: 1 },
  { year: "2022", impactFactor: 4.3, quartile: 1 },
  { year: "2023", impactFactor: 4.4, quartile: 1 },
  { year: "2024", impactFactor: 4.428, quartile: 1 },
];

const recentPublications = [
  {
    id: "1",
    title: "Machine Learning Applications in Genomic Data Analysis: A Comprehensive Review",
    authors: ["Zhang, L.", "Kumar, R.", "Smith, J."],
    date: "2024-05-15",
    citations: 23,
    doi: "10.1371/journal.pcbi.1011234",
  },
  {
    id: "2",
    title: "Deep Neural Networks for Protein Structure Prediction",
    authors: ["Anderson, M.", "Lee, S.", "Williams, K."],
    date: "2024-05-10",
    citations: 45,
    doi: "10.1371/journal.pcbi.1011223",
  },
  {
    id: "3",
    title: "Computational Methods for Drug Discovery: Recent Advances",
    authors: ["Chen, Y.", "Brown, A.", "Davis, R."],
    date: "2024-05-05",
    citations: 67,
    doi: "10.1371/journal.pcbi.1011212",
  },
  {
    id: "4",
    title: "Systems Biology Approaches to Understanding Complex Diseases",
    authors: ["Martinez, E.", "Taylor, J.", "Wilson, C."],
    date: "2024-04-28",
    citations: 34,
    doi: "10.1371/journal.pcbi.1011201",
  },
  {
    id: "5",
    title: "Bioinformatics Tools for Next-Generation Sequencing Data",
    authors: ["Robinson, P.", "Garcia, M.", "Thompson, L."],
    date: "2024-04-20",
    citations: 56,
    doi: "10.1371/journal.pcbi.1011190",
  },
];

interface JournalDetailProps {
  journalId: string;
}

export default function JournalDetail({ journalId }: JournalDetailProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <>
      <StudentTopHeader />

      <main className="flex-1 overflow-auto">
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
                  <BookOpen className="w-12 h-12 text-primary-foreground" strokeWidth={1.75} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div className="flex-1">
                      <h1 className="font-heading text-4xl text-foreground mb-3">
                        PLOS Computational Biology
                      </h1>
                      <div className="flex items-center gap-4 text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">ISSN:</span>
                          <span className="text-sm">1553-7358</span>
                        </div>
                        <span className="text-border">•</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Public Library of Science</span>
                        </div>
                        <span className="text-border">•</span>
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          <span className="text-sm">United States</span>
                        </div>
                      </div>
                    </div>

                    <Can permission="follow">
                      <Button
                        onClick={() => setIsFollowing(!isFollowing)}
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

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-teal/10 text-teal rounded-lg flex items-center gap-2 text-sm font-medium">
                      <LockOpen className="w-4 h-4" />
                      Open Access
                    </div>
                    <div className="px-3 py-1.5 bg-accent text-tag rounded-lg flex items-center gap-2 text-sm font-medium">
                      <Award className="w-4 h-4" />
                      OA Diamond
                    </div>
                    <div className="px-3 py-1.5 bg-teal/10 text-teal rounded-lg text-sm font-bold">
                      Q1
                    </div>
                  </div>
                </div>
              </div>
            </PageContainer>
          </div>

          <PageContainer size="wide" className="py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Analytics */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-6">
                  <Card className="p-6 border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Impact Factor</p>
                        <p className="font-heading text-2xl text-foreground">4.428</p>
                      </div>
                    </div>
                    <p className="text-xs text-teal font-medium">+12.5% from last year</p>
                  </Card>

                  <Card className="p-6 border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Articles</p>
                        <p className="font-heading text-2xl text-foreground">3,842</p>
                      </div>
                    </div>
                    <p className="text-xs text-teal font-medium">+245 this year</p>
                  </Card>

                  <Card className="p-6 border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Followers</p>
                        <p className="font-heading text-2xl text-foreground">12.4K</p>
                      </div>
                    </div>
                    <p className="text-xs text-teal font-medium">+8.3% this month</p>
                  </Card>
                </div>

                {/* Publication Trend */}
                <Card className="p-6 border-border">
                  <div className="mb-6">
                    <h2 className="font-heading text-lg text-foreground">Publication Trend</h2>
                    <p className="text-sm text-muted-foreground mt-1">Annual publication volume over time</p>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={publicationTrendData}>
                      <CartesianGrid key="grid-pub-trend" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis key="xaxis-pub-trend" dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                      <YAxis key="yaxis-pub-trend" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                      <Tooltip key="tooltip-pub-trend" contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px" }} />
                      <Area key="area-pub-trend" type="monotone" dataKey="publications" stroke="#D3AB9E" strokeWidth={1.75} fill="#D3AB9E" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Ranking History */}
                <Card className="p-6 border-border">
                  <div className="mb-6">
                    <h2 className="font-heading text-lg text-foreground">Ranking History</h2>
                    <p className="text-sm text-muted-foreground mt-1">Impact factor progression</p>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={rankingHistoryData}>
                      <CartesianGrid key="grid-ranking" strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        key="xaxis-ranking"
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <YAxis
                        key="yaxis-ranking"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <Tooltip
                        key="tooltip-ranking"
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "8px 12px",
                        }}
                      />
                      <Line key="line-ranking" type="monotone" dataKey="impactFactor" stroke="#3AC9C1" strokeWidth={2} dot={{ fill: "#3AC9C1", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Recent Publications */}
                <Card className="p-6 border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-heading text-lg text-foreground">Recent Publications</h2>
                      <p className="text-sm text-muted-foreground mt-1">Latest research articles</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary">
                      View All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {recentPublications.map((pub) => (
                      <div
                        key={pub.id}
                        className="p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer border border-border"
                      >
                        <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2">
                          {pub.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{pub.authors.slice(0, 3).join(", ")}</span>
                          {pub.authors.length > 3 && <span>et al.</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(pub.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                            <span>{pub.citations} citations</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Column - Information */}
              <div className="space-y-6">
                {/* About */}
                <Card className="p-6 border-border">
                  <h2 className="font-heading text-lg text-foreground mb-4">About</h2>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Description</p>
                      <p className="text-muted-foreground leading-relaxed">
                        PLOS Computational Biology features works of exceptional significance that further our
                        understanding of living systems at all scales through the application of computational
                        methods.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Subject Categories */}
                <Card className="p-6 border-border">
                  <h2 className="font-heading text-lg text-foreground mb-4">Subject Categories</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-accent text-tag text-xs font-medium rounded-full">
                      Computational Biology
                    </span>
                    <span className="px-3 py-1.5 bg-accent text-tag text-xs font-medium rounded-full">
                      Bioinformatics
                    </span>
                    <span className="px-3 py-1.5 bg-accent text-tag text-xs font-medium rounded-full">
                      Systems Biology
                    </span>
                    <span className="px-3 py-1.5 bg-accent text-tag text-xs font-medium rounded-full">
                      Genomics
                    </span>
                    <span className="px-3 py-1.5 bg-accent text-tag text-xs font-medium rounded-full">
                      Machine Learning
                    </span>
                  </div>
                </Card>

                {/* Coverage */}
                <Card className="p-6 border-border">
                  <h2 className="font-heading text-lg text-foreground mb-4">Coverage</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">First Published</span>
                      <span className="text-foreground font-medium">2005</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="text-foreground font-medium">Monthly</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Language</span>
                      <span className="text-foreground font-medium">English</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Publisher Type</span>
                      <span className="text-foreground font-medium">Non-profit</span>
                    </div>
                  </div>
                </Card>

                {/* Indexing */}
                <Card className="p-6 border-border">
                  <h2 className="font-heading text-lg text-foreground mb-4">Indexed In</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">PubMed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Web of Science</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Scopus</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">Google Scholar</span>
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
