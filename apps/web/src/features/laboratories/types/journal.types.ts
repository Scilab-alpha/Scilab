export interface Journal {
  id: string;
  name: string;
  issn: string;
  publisher: string;
  subjects: string[];
  ranking: {
    metric: string;
    value: string;
    quartile: "Q1" | "Q2" | "Q3" | "Q4";
  };
  openAccess: boolean;
  oaDiamond: boolean;
  country: string;
  citations: number;
  articles: number;
}

export const subjectAreas = [
  "Artificial Intelligence",
  "Machine Learning",
  "Climate Science",
  "Computational Biology",
  "Quantum Computing",
  "Genomics",
  "Environmental Science",
  "Materials Science",
];
export const countries = [
  "United States",
  "United Kingdom",
  "Netherlands",
  "Germany",
  "China",
  "Japan",
];
export const publishers = [
  "Nature Publishing Group",
  "Elsevier",
  "Springer",
  "Wiley",
  "Public Library of Science",
  "IOP Publishing",
  "BioMed Central",
];
export const rankingMetrics = ["Impact Factor", "CiteScore", "h-Index", "SJR"];

export interface JournalSearchProps {
  onNavigate?: (view: string) => void;
  onViewJournal?: (journalId: string) => void;
}
