export const keywordComparisonSeries = [
  { month: "Jan", ai: 5200, ml: 4500, quantum: 1800, climate: 3400 },
  { month: "Feb", ai: 5800, ml: 4800, quantum: 1950, climate: 3600 },
  { month: "Mar", ai: 6400, ml: 5200, quantum: 2100, climate: 3900 },
  { month: "Apr", ai: 7100, ml: 5600, quantum: 2300, climate: 4200 },
  { month: "May", ai: 7900, ml: 6100, quantum: 2600, climate: 4500 },
  { month: "Jun", ai: 8800, ml: 6800, quantum: 2900, climate: 4900 },
];

export const keywordLines = [
  { key: "ai", label: "Artificial Intelligence", color: "#D3AB9E" },
  { key: "ml", label: "Machine Learning", color: "#3AC9C1" },
  { key: "quantum", label: "Quantum Computing", color: "#8AAFA8" },
  { key: "climate", label: "Climate Science", color: "#C4B5A8" },
] as const;

export const heatmapColumns = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export const heatmapRows = [
  {
    label: "Artificial Intelligence",
    values: [72, 78, 81, 86, 91, 95],
  },
  {
    label: "Machine Learning",
    values: [68, 71, 74, 79, 83, 88],
  },
  {
    label: "Quantum Computing",
    values: [41, 45, 49, 55, 62, 68],
  },
  {
    label: "Climate Science",
    values: [58, 60, 63, 67, 71, 76],
  },
  {
    label: "CRISPR Technology",
    values: [52, 51, 53, 54, 55, 57],
  },
];

export const rankingProgress = [
  {
    journal: "Nature Machine Intelligence",
    currentRank: 1,
    previousRank: 4,
    timeline: [
      { period: "2023 Q1", rank: 4 },
      { period: "2023 Q3", rank: 3 },
      { period: "2024 Q1", rank: 2 },
      { period: "2024 Q2", rank: 1 },
    ],
  },
  {
    journal: "PLOS Computational Biology",
    currentRank: 2,
    previousRank: 5,
    timeline: [
      { period: "2023 Q1", rank: 5 },
      { period: "2023 Q3", rank: 4 },
      { period: "2024 Q1", rank: 3 },
      { period: "2024 Q2", rank: 2 },
    ],
  },
  {
    journal: "Quantum Science and Technology",
    currentRank: 3,
    previousRank: 7,
    timeline: [
      { period: "2023 Q1", rank: 7 },
      { period: "2023 Q3", rank: 5 },
      { period: "2024 Q1", rank: 4 },
      { period: "2024 Q2", rank: 3 },
    ],
  },
];

export function heatmapCellClass(value: number): string {
  if (value >= 90) return "bg-primary text-primary-foreground";
  if (value >= 80) return "bg-primary/80 text-primary-foreground";
  if (value >= 70) return "bg-primary/60 text-foreground";
  if (value >= 60) return "bg-primary/40 text-foreground";
  if (value >= 50) return "bg-primary/25 text-foreground";
  return "bg-surface-raised text-muted-foreground";
}
