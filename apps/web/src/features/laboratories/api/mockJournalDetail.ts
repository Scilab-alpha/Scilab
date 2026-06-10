

export const publicationTrendData = [
  { year: "2019", publications: 420 },
  { year: "2020", publications: 480 },
  { year: "2021", publications: 550 },
  { year: "2022", publications: 620 },
  { year: "2023", publications: 680 },
  { year: "2024", publications: 720 },
];

export const rankingHistoryData = [
  { year: "2019", impactFactor: 3.2, quartile: 2 },
  { year: "2020", impactFactor: 3.8, quartile: 2 },
  { year: "2021", impactFactor: 4.1, quartile: 1 },
  { year: "2022", impactFactor: 4.3, quartile: 1 },
  { year: "2023", impactFactor: 4.4, quartile: 1 },
  { year: "2024", impactFactor: 4.428, quartile: 1 },
];

export const recentPublications = [
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
  onNavigate?: (view: string) => void;
}
