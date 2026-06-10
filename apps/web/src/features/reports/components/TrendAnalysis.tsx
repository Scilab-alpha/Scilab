"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Bell,
  Search,
  Calendar,
  Plus,
  X,
  Download,
  Image as ImageIcon,
  FileText,
  FileText as FileTextIcon,
  Star,
  StarOff,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  User,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import PageContainer from "@/shared/components/layout/PageContainer";
import Can from "@/shared/components/auth/Can";
import { Label } from "@/shared/components/ui/label";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const multiTrendData = [
  { month: "Jan 2024", ml: 4500, ai: 5200, quantum: 1800, crispr: 2100, climate: 3400 },
  { month: "Feb 2024", ml: 4800, ai: 5800, quantum: 1950, crispr: 2050, climate: 3600 },
  { month: "Mar 2024", ml: 5200, ai: 6400, quantum: 2100, crispr: 2200, climate: 3900 },
  { month: "Apr 2024", ml: 5600, ai: 7100, quantum: 2300, crispr: 2150, climate: 4200 },
  { month: "May 2024", ml: 6100, ai: 7900, quantum: 2600, crispr: 2300, climate: 4500 },
  { month: "Jun 2024", ml: 6800, ai: 8800, quantum: 2900, crispr: 2280, climate: 4900 },
];

const growthComparisonData = [
  { keyword: "Artificial Intelligence", current: 8800, previous: 5200, growth: 69.2, color: "#D3AB9E" },
  { keyword: "Machine Learning", current: 6800, previous: 4500, growth: 51.1, color: "#3AC9C1" },
  { keyword: "Climate Science", current: 4900, previous: 3400, growth: 44.1, color: "#8AAFA8" },
  { keyword: "Quantum Computing", current: 2900, previous: 1800, growth: 61.1, color: "#C4B5A8" },
  { keyword: "CRISPR Technology", current: 2280, previous: 2100, growth: 8.6, color: "#5C534E" },
];

const velocityData = [
  { week: "Week 1", velocity: 420, avg: 380 },
  { week: "Week 2", velocity: 450, avg: 380 },
  { week: "Week 3", velocity: 380, avg: 380 },
  { week: "Week 4", velocity: 520, avg: 380 },
  { week: "Week 5", velocity: 490, avg: 380 },
  { week: "Week 6", velocity: 580, avg: 380 },
  { week: "Week 7", velocity: 620, avg: 380 },
  { week: "Week 8", velocity: 560, avg: 380 },
];

const emergingTopics = [
  { topic: "AI Safety & Alignment", publications: 1240, growth: 156.3, momentum: "explosive", followers: 2340 },
  { topic: "mRNA Therapeutics", publications: 980, growth: 124.7, momentum: "explosive", followers: 1890 },
  { topic: "Quantum Error Correction", publications: 760, growth: 98.4, momentum: "strong", followers: 1230 },
  { topic: "Fusion Energy", publications: 650, growth: 87.2, momentum: "strong", followers: 1560 },
  { topic: "Neuromorphic Computing", publications: 540, growth: 72.8, momentum: "strong", followers: 890 },
  { topic: "Carbon Capture", publications: 890, growth: 56.4, momentum: "growing", followers: 1670 },
  { topic: "Liquid Biopsies", publications: 720, growth: 48.9, momentum: "growing", followers: 1120 },
  { topic: "Perovskite Solar Cells", publications: 680, growth: 42.1, momentum: "growing", followers: 950 },
];

const topJournals = [
  { name: "Nature", share: 18.4, trend: "up", publications: 2340 },
  { name: "Science", share: 16.2, trend: "up", publications: 2060 },
  { name: "Cell", share: 12.8, trend: "stable", publications: 1630 },
  { name: "PNAS", share: 10.5, trend: "up", publications: 1340 },
  { name: "Nature Communications", share: 8.9, trend: "up", publications: 1130 },
];

const trendKeywords = [
  { id: "1", label: "Artificial Intelligence", color: "#D3AB9E", dataKey: "ai" },
  { id: "2", label: "Machine Learning", color: "#3AC9C1", dataKey: "ml" },
  { id: "3", label: "Quantum Computing", color: "#8AAFA8", dataKey: "quantum" },
  { id: "4", label: "CRISPR Technology", color: "#C4B5A8", dataKey: "crispr" },
  { id: "5", label: "Climate Science", color: "#5C534E", dataKey: "climate" },
];

export default function TrendAnalysis() {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(["ai", "ml", "quantum"]);
  const [keywordInput, setKeywordInput] = useState("");
  const [dateRange, setDateRange] = useState("6m");
  const [selectedJournal, setSelectedJournal] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [followedTopics, setFollowedTopics] = useState<string[]>(["AI Safety & Alignment"]);

  const toggleKeyword = (dataKey: string) => {
    if (selectedKeywords.includes(dataKey)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== dataKey));
    } else {
      setSelectedKeywords([...selectedKeywords, dataKey]);
    }
  };

  const toggleFollowTopic = (topic: string) => {
    if (followedTopics.includes(topic)) {
      setFollowedTopics(followedTopics.filter((t) => t !== topic));
    } else {
      setFollowedTopics([...followedTopics, topic]);
    }
  };

  const getMomentumBadge = (momentum: string) => {
    const configs = {
      explosive: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
      strong: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
      growing: { bg: "bg-accent", text: "text-tag", border: "border-border" },
    };
    const config = configs[momentum as keyof typeof configs];
    return (
      <span className={`px-2.5 py-1 ${config.bg} ${config.text} text-xs font-semibold rounded-md border ${config.border} uppercase tracking-wide`}>
        {momentum}
      </span>
    );
  };

  return (
    <>
      <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading text-lg text-foreground truncate">Trend Analysis</h1>
                <p className="text-xs text-muted-foreground truncate">Real-time research intelligence</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Can permission="export_report">
              <>
                <Button variant="outline" size="sm" className="h-9">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Export PNG
                </Button>
                <Button variant="outline" size="sm" className="h-9">
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
              </>
            </Can>

            <Can permission="notifications">
              <Link
                href="/student/notifications"
                className="relative p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
            </Can>

            <Can permission="profile">
              <Link
                href="/student/profile"
                className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium text-tag">JS</span>
              </Link>
            </Can>
          </div>
        </header>

      <main className="flex-1 overflow-auto py-8">
          <PageContainer size="wide" className="space-y-6">
            {/* Filters Panel */}
            <Card className="p-6 border-border bg-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-base font-semibold text-foreground truncate">Analysis Filters</h2>
                  <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">
                    Reset All
                  </Button>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {/* Keywords */}
                  <div className="space-y-2">
                    <Label htmlFor="keyword-input" className="text-sm font-medium">
                      Keywords
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="keyword-input"
                        type="text"
                        placeholder="Add keyword..."
                        className="pl-9 h-9"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label htmlFor="date-range" className="text-sm font-medium">
                      Date Range
                    </Label>
                    <select
                      id="date-range"
                      className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                    >
                      <option value="1m">Last Month</option>
                      <option value="3m">Last 3 Months</option>
                      <option value="6m">Last 6 Months</option>
                      <option value="1y">Last Year</option>
                      <option value="2y">Last 2 Years</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>

                  {/* Journal */}
                  <div className="space-y-2">
                    <Label htmlFor="journal-filter" className="text-sm font-medium">
                      Journal
                    </Label>
                    <select
                      id="journal-filter"
                      className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                      value={selectedJournal}
                      onChange={(e) => setSelectedJournal(e.target.value)}
                    >
                      <option value="">All Journals</option>
                      <option value="nature">Nature</option>
                      <option value="science">Science</option>
                      <option value="cell">Cell</option>
                      <option value="pnas">PNAS</option>
                    </select>
                  </div>

                  {/* Subject Area */}
                  <div className="space-y-2">
                    <Label htmlFor="subject-filter" className="text-sm font-medium">
                      Subject Area
                    </Label>
                    <select
                      id="subject-filter"
                      className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <option value="">All Subjects</option>
                      <option value="cs">Computer Science</option>
                      <option value="bio">Biology</option>
                      <option value="physics">Physics</option>
                      <option value="medicine">Medicine</option>
                      <option value="climate">Climate Science</option>
                    </select>
                  </div>

                  {/* Topics */}
                  <div className="space-y-2">
                    <Label htmlFor="topic-input" className="text-sm font-medium">
                      Topics
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="topic-input"
                        type="text"
                        placeholder="Search topics..."
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Keywords */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Active Keywords</Label>
                  <div className="flex flex-wrap gap-2">
                    {trendKeywords.map((keyword) => (
                      <button
                        key={keyword.id}
                        onClick={() => toggleKeyword(keyword.dataKey)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 max-w-xs ${
                          selectedKeywords.includes(keyword.dataKey)
                            ? "text-white shadow-sm"
                            : "bg-surface-raised text-muted-foreground hover:bg-gray-200"
                        }`}
                        style={
                          selectedKeywords.includes(keyword.dataKey)
                            ? { backgroundColor: keyword.color }
                            : {}
                        }
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: keyword.color }}
                        ></div>
                        <span className="truncate">{keyword.label}</span>
                        {selectedKeywords.includes(keyword.dataKey) && (
                          <X className="w-3 h-3 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-6">
              <Card className="p-6 border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <span className="px-2 py-1 bg-teal/10 text-teal text-xs font-semibold rounded">
                    +18.4%
                  </span>
                </div>
                <p className="font-heading text-3xl text-foreground mb-1">23,450</p>
                <p className="text-sm text-muted-foreground truncate">Total Publications</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">Last 6 months</p>
              </Card>

              <Card className="p-6 border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <span className="px-2 py-1 bg-teal/10 text-teal text-xs font-semibold rounded">
                    +12.7%
                  </span>
                </div>
                <p className="font-heading text-3xl text-foreground mb-1">580</p>
                <p className="text-sm text-muted-foreground truncate">Weekly Velocity</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">Publications/week</p>
              </Card>

              <Card className="p-6 border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-orange-600" strokeWidth={1.75} />
                  </div>
                  <span className="px-2 py-1 bg-teal/10 text-teal text-xs font-semibold rounded">
                    +156.3%
                  </span>
                </div>
                <p className="font-heading text-3xl text-foreground mb-1">8</p>
                <p className="text-sm text-muted-foreground truncate">Emerging Topics</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">High momentum</p>
              </Card>

              <Card className="p-6 border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-teal" strokeWidth={1.75} />
                  </div>
                  <span className="px-2 py-1 bg-teal/10 text-teal text-xs font-semibold rounded">
                    +69.2%
                  </span>
                </div>
                <p className="font-heading text-3xl text-foreground mb-1">AI</p>
                <p className="text-sm text-muted-foreground truncate">Top Trending Keyword</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">8,800 publications</p>
              </Card>
            </div>

            {/* Main Trend Chart */}
            <Card className="p-6 border-border bg-card">
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-lg text-foreground truncate">Publication Trends</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">Multi-keyword comparison over time</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    <LineChartIcon className="w-3.5 h-3.5 mr-1.5" />
                    Line
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-3">
                    Area
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-3">
                    Bar
                  </Button>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={multiTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                    iconType="line"
                  />
                  {selectedKeywords.includes("ai") && (
                    <Line type="monotone" dataKey="ai" stroke="#D3AB9E" strokeWidth={2} dot={false} name="Artificial Intelligence" />
                  )}
                  {selectedKeywords.includes("ml") && (
                    <Line type="monotone" dataKey="ml" stroke="#3AC9C1" strokeWidth={2} dot={false} name="Machine Learning" />
                  )}
                  {selectedKeywords.includes("quantum") && (
                    <Line type="monotone" dataKey="quantum" stroke="#8AAFA8" strokeWidth={2} dot={false} name="Quantum Computing" />
                  )}
                  {selectedKeywords.includes("crispr") && (
                    <Line type="monotone" dataKey="crispr" stroke="#C4B5A8" strokeWidth={2} dot={false} name="CRISPR Technology" />
                  )}
                  {selectedKeywords.includes("climate") && (
                    <Line type="monotone" dataKey="climate" stroke="#5C534E" strokeWidth={2} dot={false} name="Climate Science" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Growth Comparison & Velocity */}
            <div className="grid grid-cols-2 gap-6">
              {/* Growth Comparison */}
              <Card className="p-6 border-border bg-card">
                <div className="mb-6 min-w-0">
                  <h2 className="font-heading text-lg text-foreground truncate">Growth Comparison</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">6-month period-over-period analysis</p>
                </div>

                <div className="space-y-4">
                  {growthComparisonData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm font-medium text-foreground truncate">{item.keyword}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {item.previous.toLocaleString()} → {item.current.toLocaleString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 whitespace-nowrap ${
                              item.growth > 50
                                ? "bg-teal/10 text-teal"
                                : item.growth > 25
                                ? "bg-accent text-tag"
                                : "bg-surface-raised text-muted-foreground"
                            }`}
                          >
                            <ArrowUp className="w-3 h-3" />
                            {item.growth}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(item.growth, 100)}%`,
                            backgroundColor: item.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Publication Velocity */}
              <Card className="p-6 border-border bg-card">
                <div className="mb-6 min-w-0">
                  <h2 className="font-heading text-lg text-foreground truncate">Publication Velocity</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">Weekly publication rate vs. average</p>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="week"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                    />
                    <Bar dataKey="velocity" fill="#3AC9C1" radius={[4, 4, 0, 0]} name="Weekly Publications" />
                    <Line type="monotone" dataKey="avg" stroke="#D3AB9E" strokeWidth={1.75} strokeDasharray="5 5" dot={false} name="Average" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Emerging Topics & Top Journals */}
            <div className="grid grid-cols-3 gap-6">
              {/* Emerging Topics */}
              <Card className="col-span-2 p-6 border-border bg-card">
                <div className="flex items-center justify-between mb-6 gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading text-lg text-foreground truncate">Emerging Topics</h2>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">High-momentum research areas</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    View All
                  </Button>
                </div>

                <div className="space-y-3">
                  {emergingTopics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-background hover:bg-accent rounded-lg border border-border transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{topic.topic}</h3>
                          {getMomentumBadge(topic.momentum)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <FileText className="w-3.5 h-3.5" />
                            {topic.publications.toLocaleString()} publications
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <User className="w-3.5 h-3.5" />
                            {topic.followers.toLocaleString()} followers
                          </span>
                          <span
                            className={`flex items-center gap-1 font-semibold whitespace-nowrap ${
                              topic.growth > 100 ? "text-red-600" : "text-teal"
                            }`}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                            {topic.growth}% growth
                          </span>
                        </div>
                      </div>
                      <Can permission="follow">
                        <Button
                          variant={followedTopics.includes(topic.topic) ? "default" : "outline"}
                          size="sm"
                          className="h-8 px-3 ml-4"
                          onClick={() => toggleFollowTopic(topic.topic)}
                        >
                          {followedTopics.includes(topic.topic) ? (
                            <>
                              <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
                              Following
                            </>
                          ) : (
                            <>
                              <StarOff className="w-3.5 h-3.5 mr-1.5" />
                              Follow
                            </>
                          )}
                        </Button>
                      </Can>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Journals */}
              <Card className="p-6 border-border bg-card">
                <div className="mb-6 min-w-0">
                  <h2 className="font-heading text-lg text-foreground truncate">Top Journals</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">Publication share</p>
                </div>

                <div className="space-y-4">
                  {topJournals.map((journal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm font-semibold text-foreground flex-shrink-0">
                            {index + 1}.
                          </span>
                          <span className="text-sm font-medium text-foreground truncate">{journal.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {journal.trend === "up" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-teal" />
                          ) : journal.trend === "down" ? (
                            <ArrowDown className="w-3.5 h-3.5 text-red-600" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className="text-sm font-semibold text-foreground">
                            {journal.share}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal rounded-full"
                            style={{ width: `${journal.share * 5}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {journal.publications}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </PageContainer>
      </main>
    </>
  );
}
