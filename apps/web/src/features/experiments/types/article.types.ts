export interface Article {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string;
  keywords: string[];
  abstract: string;
  citations: number;
  isBookmarked: boolean;
}

export const mockArticles: Article[] = [
  {
    id: "1",
    title: "Deep Learning Approaches for Protein Structure Prediction: AlphaFold and Beyond",
    authors: ["Zhang, L.", "Kumar, R.", "Smith, J.", "Anderson, M."],
    journal: "Nature Machine Intelligence",
    year: 2024,
    doi: "10.1038/s42256-024-00789-1",
    keywords: ["Deep Learning", "Protein Structure", "AlphaFold", "Structural Biology"],
    abstract: "Recent advances in deep learning have revolutionized protein structure prediction. We present a comprehensive review of state-of-the-art methods, focusing on AlphaFold2 and its successors. Our analysis covers the architectural innovations, training methodologies, and practical applications that have enabled near-atomic accuracy in structure prediction. We also discuss the limitations of current approaches and propose future directions for improving prediction accuracy and computational efficiency.",
    citations: 245,
    isBookmarked: false,
  },
  {
    id: "2",
    title: "Machine Learning Applications in Genomic Data Analysis: A Systematic Review",
    authors: ["Chen, Y.", "Williams, K.", "Martinez, E."],
    journal: "PLOS Computational Biology",
    year: 2024,
    doi: "10.1371/journal.pcbi.1011234",
    keywords: ["Machine Learning", "Genomics", "Bioinformatics", "Data Analysis"],
    abstract: "The exponential growth of genomic data has necessitated the development of sophisticated computational tools for analysis and interpretation. This systematic review examines machine learning applications across various domains of genomic research, including variant calling, gene expression analysis, and genome assembly. We evaluate the performance of different ML algorithms and provide recommendations for practitioners seeking to apply these methods to their own datasets.",
    citations: 189,
    isBookmarked: true,
  },
  {
    id: "3",
    title: "CRISPR-Cas9 Gene Editing: Recent Advances and Clinical Applications",
    authors: ["Brown, A.", "Taylor, J.", "Davis, R.", "Wilson, C.", "Thompson, L."],
    journal: "Cell Reports",
    year: 2023,
    doi: "10.1016/j.celrep.2023.112456",
    keywords: ["CRISPR", "Gene Editing", "Therapeutics", "Clinical Trials"],
    abstract: "CRISPR-Cas9 technology has transformed the landscape of genetic engineering and therapeutic development. This review discusses recent technological improvements, including base editing and prime editing, as well as the current state of clinical trials employing CRISPR-based therapies. We highlight successes in treating genetic disorders and discuss the challenges that remain in translating this technology to widespread clinical use.",
    citations: 567,
    isBookmarked: false,
  },
  {
    id: "4",
    title: "Computational Methods for Drug Discovery: From Virtual Screening to Clinical Trials",
    authors: ["Lee, S.", "Robinson, P.", "Garcia, M."],
    journal: "Journal of Medicinal Chemistry",
    year: 2023,
    doi: "10.1021/acs.jmedchem.3c00123",
    keywords: ["Drug Discovery", "Virtual Screening", "Computational Chemistry", "Clinical Trials"],
    abstract: "Modern drug discovery increasingly relies on computational methods to identify and optimize therapeutic candidates. This comprehensive review covers the full pipeline from virtual screening and molecular docking to pharmacokinetic modeling and clinical trial design. We present case studies of successful computational drug discovery projects and discuss best practices for integrating computational and experimental approaches.",
    citations: 423,
    isBookmarked: false,
  },
  {
    id: "5",
    title: "Single-Cell RNA Sequencing: Technologies, Analysis Methods, and Applications",
    authors: ["Anderson, M.", "White, K.", "Harris, J."],
    journal: "Nature Biotechnology",
    year: 2023,
    doi: "10.1038/s41587-023-01234-5",
    keywords: ["Single-Cell", "RNA-Seq", "Transcriptomics", "Cell Biology"],
    abstract: "Single-cell RNA sequencing has emerged as a powerful tool for understanding cellular heterogeneity and function. This review discusses the latest technological platforms, computational analysis pipelines, and biological applications of scRNA-seq. We provide guidance on experimental design, quality control, and data interpretation, along with examples of how scRNA-seq has advanced our understanding of development, disease, and therapeutic responses.",
    citations: 834,
    isBookmarked: true,
  },
  {
    id: "6",
    title: "Artificial Intelligence in Medical Imaging: Opportunities and Challenges",
    authors: ["Johnson, R.", "Miller, S.", "Clark, D.", "Lewis, A."],
    journal: "Radiology",
    year: 2024,
    doi: "10.1148/radiol.2024231234",
    keywords: ["AI", "Medical Imaging", "Deep Learning", "Diagnostics"],
    abstract: "Artificial intelligence is transforming medical imaging through improved detection, diagnosis, and treatment planning. This article reviews the current state of AI in radiology, pathology, and other imaging modalities. We examine successful clinical implementations, discuss regulatory considerations, and address the challenges of bias, interpretability, and integration into clinical workflows.",
    citations: 312,
    isBookmarked: false,
  },
];

export const yearOptions = ["2024", "2023", "2022", "2021", "2020", "2019"];

interface ArticleSearchProps {
  onNavigate?: (view: string) => void;
  onViewArticle?: (articleId: string) => void;
}
