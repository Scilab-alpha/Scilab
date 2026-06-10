

// Mock data for multi-keyword trends
export const multiTrendData = [
  { month: "Jan 2024", ml: 4500, ai: 5200, quantum: 1800, crispr: 2100, climate: 3400 },
  { month: "Feb 2024", ml: 4800, ai: 5800, quantum: 1950, crispr: 2050, climate: 3600 },
  { month: "Mar 2024", ml: 5200, ai: 6400, quantum: 2100, crispr: 2200, climate: 3900 },
  { month: "Apr 2024", ml: 5600, ai: 7100, quantum: 2300, crispr: 2150, climate: 4200 },
  { month: "May 2024", ml: 6100, ai: 7900, quantum: 2600, crispr: 2300, climate: 4500 },
  { month: "Jun 2024", ml: 6800, ai: 8800, quantum: 2900, crispr: 2280, climate: 4900 },
];

export const growthComparisonData = [
  { keyword: "Artificial Intelligence", current: 8800, previous: 5200, growth: 69.2, color: "#3b82f6" },
  { keyword: "Machine Learning", current: 6800, previous: 4500, growth: 51.1, color: "#8b5cf6" },
  { keyword: "Climate Science", current: 4900, previous: 3400, growth: 44.1, color: "#10b981" },
  { keyword: "Quantum Computing", current: 2900, previous: 1800, growth: 61.1, color: "#f59e0b" },
  { keyword: "CRISPR Technology", current: 2280, previous: 2100, growth: 8.6, color: "#ef4444" },
];

export const velocityData = [
  { week: "Week 1", velocity: 420, avg: 380 },
  { week: "Week 2", velocity: 450, avg: 380 },
  { week: "Week 3", velocity: 380, avg: 380 },
  { week: "Week 4", velocity: 520, avg: 380 },
  { week: "Week 5", velocity: 490, avg: 380 },
  { week: "Week 6", velocity: 580, avg: 380 },
  { week: "Week 7", velocity: 620, avg: 380 },
  { week: "Week 8", velocity: 560, avg: 380 },
];

export const emergingTopics = [
  { topic: "AI Safety & Alignment", publications: 1240, growth: 156.3, momentum: "explosive", followers: 2340 },
  { topic: "mRNA Therapeutics", publications: 980, growth: 124.7, momentum: "explosive", followers: 1890 },
  { topic: "Quantum Error Correction", publications: 760, growth: 98.4, momentum: "strong", followers: 1230 },
  { topic: "Fusion Energy", publications: 650, growth: 87.2, momentum: "strong", followers: 1560 },
  { topic: "Neuromorphic Computing", publications: 540, growth: 72.8, momentum: "strong", followers: 890 },
  { topic: "Carbon Capture", publications: 890, growth: 56.4, momentum: "growing", followers: 1670 },
  { topic: "Liquid Biopsies", publications: 720, growth: 48.9, momentum: "growing", followers: 1120 },
  { topic: "Perovskite Solar Cells", publications: 680, growth: 42.1, momentum: "growing", followers: 950 },
];

export const topJournals = [
  { name: "Nature", share: 18.4, trend: "up", publications: 2340 },
  { name: "Science", share: 16.2, trend: "up", publications: 2060 },
  { name: "Cell", share: 12.8, trend: "stable", publications: 1630 },
  { name: "PNAS", share: 10.5, trend: "up", publications: 1340 },
  { name: "Nature Communications", share: 8.9, trend: "up", publications: 1130 },
];

export const trendKeywords = [
  { id: "1", label: "Artificial Intelligence", color: "#3b82f6", dataKey: "ai" },
  { id: "2", label: "Machine Learning", color: "#8b5cf6", dataKey: "ml" },
  { id: "3", label: "Quantum Computing", color: "#f59e0b", dataKey: "quantum" },
  { id: "4", label: "CRISPR Technology", color: "#ef4444", dataKey: "crispr" },
  { id: "5", label: "Climate Science", color: "#10b981", dataKey: "climate" },
];
