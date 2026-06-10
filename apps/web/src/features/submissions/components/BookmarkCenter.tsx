"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Bell,
  Search,
  BookOpen,
  Filter,
  X,
  ExternalLink,
  Trash2,
  Calendar,
  Quote,
  ChevronDown,
  BookmarkX,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import PageContainer from "@/shared/components/layout/PageContainer";
import { Label } from "@/shared/components/ui/label";

interface BookmarkedArticle {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  keywords: string[];
  dateBookmarked: string;
  doi: string;
}

const mockBookmarks: BookmarkedArticle[] = [
  {
    id: "1",
    title: "Deep Learning Approaches for Protein Structure Prediction: AlphaFold and Beyond",
    authors: ["Zhang, L.", "Kumar, R.", "Smith, J.", "Anderson, M."],
    journal: "Nature Machine Intelligence",
    year: 2024,
    keywords: ["Deep Learning", "Protein Structure", "AlphaFold", "Structural Biology"],
    dateBookmarked: "2024-06-05",
    doi: "10.1038/s42256-024-00789-1",
  },
  {
    id: "2",
    title: "Machine Learning Applications in Genomic Data Analysis: A Systematic Review",
    authors: ["Chen, Y.", "Williams, K.", "Martinez, E."],
    journal: "PLOS Computational Biology",
    year: 2024,
    keywords: ["Machine Learning", "Genomics", "Bioinformatics", "Data Analysis"],
    dateBookmarked: "2024-06-03",
    doi: "10.1371/journal.pcbi.1011234",
  },
  {
    id: "3",
    title: "Single-Cell RNA Sequencing: Technologies, Analysis Methods, and Applications",
    authors: ["Anderson, M.", "White, K.", "Harris, J."],
    journal: "Nature Biotechnology",
    year: 2023,
    keywords: ["Single-Cell", "RNA-Seq", "Transcriptomics", "Cell Biology"],
    dateBookmarked: "2024-06-01",
    doi: "10.1038/s41587-023-01234-5",
  },
  {
    id: "4",
    title: "Artificial Intelligence in Medical Imaging: Opportunities and Challenges",
    authors: ["Johnson, R.", "Miller, S.", "Clark, D.", "Lewis, A."],
    journal: "Radiology",
    year: 2024,
    keywords: ["AI", "Medical Imaging", "Deep Learning", "Diagnostics"],
    dateBookmarked: "2024-05-28",
    doi: "10.1148/radiol.2024231234",
  },
  {
    id: "5",
    title: "CRISPR-Cas9 Gene Editing: Recent Advances and Clinical Applications",
    authors: ["Brown, A.", "Taylor, J.", "Davis, R.", "Wilson, C.", "Thompson, L."],
    journal: "Cell Reports",
    year: 2023,
    keywords: ["CRISPR", "Gene Editing", "Therapeutics", "Clinical Trials"],
    dateBookmarked: "2024-05-25",
    doi: "10.1016/j.celrep.2023.112456",
  },
  {
    id: "6",
    title: "Computational Methods for Drug Discovery: From Virtual Screening to Clinical Trials",
    authors: ["Lee, S.", "Robinson, P.", "Garcia, M."],
    journal: "Journal of Medicinal Chemistry",
    year: 2023,
    keywords: ["Drug Discovery", "Virtual Screening", "Computational Chemistry"],
    dateBookmarked: "2024-05-20",
    doi: "10.1021/acs.jmedchem.3c00123",
  },
];

const journalOptions = ["All Journals", "Nature Machine Intelligence", "PLOS Computational Biology", "Nature Biotechnology", "Cell Reports", "Radiology"];
const yearOptions = ["All Years", "2024", "2023", "2022", "2021"];
const topicOptions = ["All Topics", "Machine Learning", "AI", "CRISPR", "Genomics", "Medical Imaging"];

export default function BookmarkCenter() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournal, setSelectedJournal] = useState("All Journals");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [authorFilter, setAuthorFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarks, setBookmarks] = useState(mockBookmarks);

  const handleRemoveBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id));
  };

  const handleOpenArticle = (id: string) => {
    router.push(`/student/articles/${id}`);
  };

  const clearFilters = () => {
    setSelectedJournal("All Journals");
    setSelectedYear("All Years");
    setSelectedTopic("All Topics");
    setAuthorFilter("");
  };

  const activeFilterCount =
    (selectedJournal !== "All Journals" ? 1 : 0) +
    (selectedYear !== "All Years" ? 1 : 0) +
    (selectedTopic !== "All Topics" ? 1 : 0) +
    (authorFilter ? 1 : 0);

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch = searchQuery
      ? bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchesJournal = selectedJournal === "All Journals" || bookmark.journal === selectedJournal;
    const matchesYear = selectedYear === "All Years" || bookmark.year.toString() === selectedYear;
    const matchesTopic =
      selectedTopic === "All Topics" ||
      bookmark.keywords.some((k) => k.toLowerCase().includes(selectedTopic.toLowerCase()));
    const matchesAuthor = authorFilter
      ? bookmark.authors.some((a) => a.toLowerCase().includes(authorFilter.toLowerCase()))
      : true;

    return matchesSearch && matchesJournal && matchesYear && matchesTopic && matchesAuthor;
  });

  return (
    <>
      <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center shadow-sm">
                <Bookmark className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading text-lg text-foreground truncate">Bookmark Center</h1>
                <p className="text-xs text-muted-foreground truncate">Your research library</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/student/notifications"
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            <Link
              href="/student/profile"
              className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium text-tag">JS</span>
            </Link>
          </div>
        </header>

      <main className="flex-1 overflow-auto py-8">
          <PageContainer size="wide" className="space-y-6">
            {/* Stats & Search Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading text-2xl text-foreground">{filteredBookmarks.length}</p>
                    <p className="text-sm text-muted-foreground">Saved Articles</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search bookmarks by title or keywords..."
                    className="pl-10 h-11 bg-card border-border shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-11 px-4"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="p-6 border-border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground truncate">Filter Options</h2>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs flex-shrink-0">
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {/* Journal Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="journal-filter" className="text-sm font-medium">
                      Journal
                    </Label>
                    <div className="relative">
                      <select
                        id="journal-filter"
                        className="w-full h-10 px-3 pr-8 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedJournal}
                        onChange={(e) => setSelectedJournal(e.target.value)}
                      >
                        {journalOptions.map((journal) => (
                          <option key={journal} value={journal}>
                            {journal}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Year Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="year-filter" className="text-sm font-medium">
                      Year
                    </Label>
                    <div className="relative">
                      <select
                        id="year-filter"
                        className="w-full h-10 px-3 pr-8 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Topic Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="topic-filter" className="text-sm font-medium">
                      Topic
                    </Label>
                    <div className="relative">
                      <select
                        id="topic-filter"
                        className="w-full h-10 px-3 pr-8 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                      >
                        {topicOptions.map((topic) => (
                          <option key={topic} value={topic}>
                            {topic}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Author Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="author-filter" className="text-sm font-medium">
                      Author
                    </Label>
                    <Input
                      id="author-filter"
                      type="text"
                      placeholder="Author name..."
                      className="h-10"
                      value={authorFilter}
                      onChange={(e) => setAuthorFilter(e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {filteredBookmarks.length === 0 && (
              <Card className="p-12 border-border bg-card">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookmarkX className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading text-lg text-foreground mb-2">No bookmarks found</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchQuery || activeFilterCount > 0
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Start building your research library by bookmarking articles that interest you."}
                  </p>
                  {(searchQuery || activeFilterCount > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        clearFilters();
                      }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Bookmark Cards */}
            {filteredBookmarks.length > 0 && (
              <div className="space-y-4">
                {filteredBookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.id}
                    className="p-6 border-border  hover:border-border transition-all bg-card"
                  >
                    <div className="flex gap-6">
                      {/* Bookmark Icon */}
                      <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bookmark className="w-6 h-6 text-amber-600 fill-amber-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3
                          className="font-heading text-xl text-foreground mb-3 hover:text-primary transition-colors cursor-pointer line-clamp-2"
                          onClick={() => handleOpenArticle(bookmark.id)}
                        >
                          {bookmark.title}
                        </h3>

                        {/* Authors */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <span className="truncate">
                            {bookmark.authors.slice(0, 3).join(", ")}
                            {bookmark.authors.length > 3 && " et al."}
                          </span>
                        </div>

                        {/* Journal & Year */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium truncate">{bookmark.journal}</span>
                          </div>
                          <span className="text-border">•</span>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{bookmark.year}</span>
                          </div>
                        </div>

                        {/* Keywords */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {bookmark.keywords.slice(0, 4).map((keyword) => (
                            <span
                              key={keyword}
                              className="px-3 py-1 bg-accent text-tag text-xs font-medium rounded-md"
                            >
                              {keyword}
                            </span>
                          ))}
                          {bookmark.keywords.length > 4 && (
                            <span className="px-3 py-1 bg-surface-raised text-muted-foreground text-xs font-medium rounded-md">
                              +{bookmark.keywords.length - 4} more
                            </span>
                          )}
                        </div>

                        {/* Date Bookmarked */}
                        <div className="text-xs text-muted-foreground">
                          Bookmarked on {new Date(bookmark.dateBookmarked).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-4"
                          onClick={() => handleOpenArticle(bookmark.id)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveBookmark(bookmark.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </PageContainer>
      </main>
    </>
  );
}
