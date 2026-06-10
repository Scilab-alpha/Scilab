export interface BookmarkedArticle {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  keywords: string[];
  dateBookmarked: string;
  doi: string;
  notes?: string;
}

export const mockBookmarks: BookmarkedArticle[] = [
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

export const journalOptions = ["All Journals", "Nature Machine Intelligence", "PLOS Computational Biology", "Nature Biotechnology", "Cell Reports", "Radiology"];
export const yearOptions = ["All Years", "2024", "2023", "2022", "2021"];
export const topicOptions = ["All Topics", "Machine Learning", "AI", "CRISPR", "Genomics", "Medical Imaging"];

undefined
