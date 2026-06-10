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

export const mockJournals: Journal[] = [
  {
    id: "1",
    name: "Nature Machine Intelligence",
    issn: "2522-5839",
    publisher: "Nature Publishing Group",
    subjects: ["Artificial Intelligence", "Machine Learning", "Computer Science"],
    ranking: { metric: "Impact Factor", value: "25.898", quartile: "Q1" },
    openAccess: false,
    oaDiamond: false,
    country: "United Kingdom",
    citations: 12543,
    articles: 234,
  },
  {
    id: "2",
    name: "PLOS Computational Biology",
    issn: "1553-7358",
    publisher: "Public Library of Science",
    subjects: ["Computational Biology", "Bioinformatics", "Systems Biology"],
    ranking: { metric: "Impact Factor", value: "4.428", quartile: "Q1" },
    openAccess: true,
    oaDiamond: true,
    country: "United States",
    citations: 9876,
    articles: 456,
  },
  {
    id: "3",
    name: "Journal of Climate Science",
    issn: "0894-8755",
    publisher: "American Meteorological Society",
    subjects: ["Climate Science", "Meteorology", "Environmental Science"],
    ranking: { metric: "Impact Factor", value: "5.215", quartile: "Q1" },
    openAccess: false,
    oaDiamond: false,
    country: "United States",
    citations: 8234,
    articles: 389,
  },
  {
    id: "4",
    name: "Quantum Science and Technology",
    issn: "2058-9565",
    publisher: "IOP Publishing",
    subjects: ["Quantum Computing", "Quantum Physics", "Applied Physics"],
    ranking: { metric: "Impact Factor", value: "6.568", quartile: "Q1" },
    openAccess: true,
    oaDiamond: false,
    country: "United Kingdom",
    citations: 7456,
    articles: 178,
  },
  {
    id: "5",
    name: "Genome Biology",
    issn: "1474-760X",
    publisher: "BioMed Central",
    subjects: ["Genomics", "Molecular Biology", "Genetics"],
    ranking: { metric: "Impact Factor", value: "17.906", quartile: "Q1" },
    openAccess: true,
    oaDiamond: false,
    country: "United Kingdom",
    citations: 6789,
    articles: 312,
  },
  {
    id: "6",
    name: "Neural Networks",
    issn: "0893-6080",
    publisher: "Elsevier",
    subjects: ["Neural Networks", "Deep Learning", "Artificial Intelligence"],
    ranking: { metric: "Impact Factor", value: "9.657", quartile: "Q1" },
    openAccess: false,
    oaDiamond: false,
    country: "Netherlands",
    citations: 5678,
    articles: 267,
  },
  {
    id: "7",
    name: "Environmental Research Letters",
    issn: "1748-9326",
    publisher: "IOP Publishing",
    subjects: ["Environmental Science", "Climate Change", "Sustainability"],
    ranking: { metric: "Impact Factor", value: "6.793", quartile: "Q2" },
    openAccess: true,
    oaDiamond: false,
    country: "United Kingdom",
    citations: 4892,
    articles: 523,
  },
  {
    id: "8",
    name: "Materials Science and Engineering",
    issn: "0921-5093",
    publisher: "Elsevier",
    subjects: ["Materials Science", "Engineering", "Nanotechnology"],
    ranking: { metric: "Impact Factor", value: "6.044", quartile: "Q2" },
    openAccess: false,
    oaDiamond: false,
    country: "Netherlands",
    citations: 3456,
    articles: 678,
  },
];

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

export const countries = ["United States", "United Kingdom", "Netherlands", "Germany", "China", "Japan"];

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

interface JournalSearchProps {
  onNavigate?: (view: string) => void;
  onViewJournal?: (journalId: string) => void;
}
