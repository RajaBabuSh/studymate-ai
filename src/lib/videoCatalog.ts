export interface CuratedVideo {
  id: string;
  course: string; // e.g. "CA Foundation", "CA Intermediate", "CS Executive", "BCA", "B.Com", etc.
  subject_name: string;
  chapter_title: string;
  category: "part_1" | "part_2" | "part_3" | "revision" | "practice" | "mock_test";
  youtube_video_id: string;
  title: string;
  channel_title: string;
  thumbnail_url: string;
  duration_seconds: number;
}

export const CURATED_VIDEOS_DB: CuratedVideo[] = [
  // =========================================================================
  // CA Intermediate & CA Foundation
  // =========================================================================
  {
    id: "vid-ca-acc-1",
    course: "CA Intermediate",
    subject_name: "Advanced Accounting",
    chapter_title: "Amalgamation and Reconstruction of Companies",
    category: "part_1",
    youtube_video_id: "G3q_W98e4fE",
    title: "Accounting for Amalgamation (AS 14) - Purchase Consideration Concepts",
    channel_title: "Grooming Education Academy",
    thumbnail_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 2400,
  },
  {
    id: "vid-ca-acc-2",
    course: "CA Intermediate",
    subject_name: "Advanced Accounting",
    chapter_title: "Amalgamation and Reconstruction of Companies",
    category: "part_2",
    youtube_video_id: "7tq7t_Tz1G8",
    title: "Amalgamation in the Nature of Merger vs Purchase (Practical Problems)",
    channel_title: "CA Anand Bhanggariya",
    thumbnail_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 3100,
  },
  {
    id: "vid-ca-acc-3",
    course: "CA Intermediate",
    subject_name: "Advanced Accounting",
    chapter_title: "Financial Statements of Companies (Schedule III)",
    category: "revision",
    youtube_video_id: "kS6H_kQ1_oE",
    title: "Schedule III Balance Sheet & P&L Complete Marathon Revision",
    channel_title: "Unacademy CA Intermediate",
    thumbnail_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 5400,
  },
  {
    id: "vid-ca-acc-4",
    course: "CA Intermediate",
    subject_name: "Advanced Accounting",
    chapter_title: "Accounting Standards",
    category: "practice",
    youtube_video_id: "mYj1r_g2U8o",
    title: "AS 10, AS 11 & AS 16 Past Exam Question Practice & ICAI Study Material",
    channel_title: "Study At Home",
    thumbnail_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 2700,
  },
  {
    id: "vid-ca-tax-1",
    course: "CA Intermediate",
    subject_name: "Taxation (Direct & Indirect Tax)",
    chapter_title: "Heads of Income: Profits & Gains of Business/Profession (PGBP)",
    category: "part_1",
    youtube_video_id: "uKq19mP6vW8",
    title: "PGBP Complete Concept & Inadmissible Deductions under Section 40, 40A & 43B",
    channel_title: "CA Bhanwar Borana",
    thumbnail_url: "https://images.unsplash.com/photo-1586486855514-8c633cc6fd38?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 3600,
  },
  {
    id: "vid-ca-tax-2",
    course: "CA Intermediate",
    subject_name: "Taxation (Direct & Indirect Tax)",
    chapter_title: "GST: Input Tax Credit (ITC)",
    category: "part_2",
    youtube_video_id: "pT7v_kQ_eL0",
    title: "GST Input Tax Credit (Section 16, 17, 18) In-Depth with Amendments",
    channel_title: "CA Vishal Bhattad",
    thumbnail_url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 4200,
  },
  {
    id: "vid-ca-law-1",
    course: "CA Intermediate",
    subject_name: "Corporate and Other Laws",
    chapter_title: "The Companies Act, 2013 - Board of Directors & Meetings",
    category: "part_1",
    youtube_video_id: "WdG1_h6sN98",
    title: "Company Law: General Meetings, Quorum, Voting & Postal Ballot (Sec 96-122)",
    channel_title: "CA Ankita Patni",
    thumbnail_url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 2900,
  },
  {
    id: "vid-ca-audit-1",
    course: "CA Intermediate",
    subject_name: "Auditing and Ethics",
    chapter_title: "Audit Strategy, Audit Planning and Audit Programme",
    category: "revision",
    youtube_video_id: "nB8d1v_kU7M",
    title: "SA 210, SA 220, SA 300 & SA 315 Master Revision in One Shot",
    channel_title: "CA Shubham Keswani",
    thumbnail_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 4800,
  },

  // =========================================================================
  // CS Executive & CS Professional
  // =========================================================================
  {
    id: "vid-cs-law-1",
    course: "CS Executive",
    subject_name: "Company Law and Practice",
    chapter_title: "Incorporation and Conversion of Companies",
    category: "part_1",
    youtube_video_id: "kJq9_w0L2_Y",
    title: "Company Law: Types of Companies, MoA & AoA Clauses Explained",
    channel_title: "CS Anoop Jain Classes",
    thumbnail_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 2600,
  },
  {
    id: "vid-cs-sec-1",
    course: "CS Executive",
    subject_name: "Capital Markets & Securities Laws",
    chapter_title: "SEBI (ICDR) Regulations - IPO, FPO",
    category: "part_2",
    youtube_video_id: "8jT_Q8r_0L4",
    title: "SEBI ICDR Regulations: IPO Process, Book Building & Eligibility Criteria",
    channel_title: "Unique Academy for Commerce",
    thumbnail_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 3200,
  },
  {
    id: "vid-cs-jur-1",
    course: "CS Executive",
    subject_name: "Jurisprudence, Interpretation & General Laws",
    chapter_title: "Interpretation of Statutes",
    category: "revision",
    youtube_video_id: "vC7m_dK9_x0",
    title: "Interpretation of Statutes: Primary and Secondary Rules of Interpretation",
    channel_title: "Inspire Academy CS",
    thumbnail_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 2800,
  },

  // =========================================================================
  // B.Com & BBA
  // =========================================================================
  {
    id: "vid-bcom-acc-1",
    course: "B.Com",
    subject_name: "Financial Accounting",
    chapter_title: "Consignment and Joint Ventures",
    category: "part_1",
    youtube_video_id: "yT1v_vQ9m0A",
    title: "Consignment Accounts: Valuation of Unsold Stock & Normal/Abnormal Loss",
    channel_title: "CA Naresh Aggarwal",
    thumbnail_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 2200,
  },
  {
    id: "vid-bcom-tax-1",
    course: "B.Com",
    subject_name: "Income Tax Law & Practice",
    chapter_title: "Basic Concepts & Residential Status",
    category: "part_1",
    youtube_video_id: "jM7m_sK8v_0",
    title: "Income Tax: How to Determine Residential Status under Section 6",
    channel_title: "Commerce Wallah",
    thumbnail_url: "https://images.unsplash.com/photo-1586486855514-8c633cc6fd38?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 1800,
  },

  // =========================================================================
  // BCA & Computer Science
  // =========================================================================
  {
    id: "vid-bca-dsa-1",
    course: "BCA",
    subject_name: "Data Structures & Algorithms",
    chapter_title: "Graph Algorithms: BFS, DFS, Dijkstra",
    category: "part_1",
    youtube_video_id: "pcKY4hjDrxk",
    title: "Graph Theory Complete Course: BFS, DFS, Dijkstra and Bellman-Ford",
    channel_title: "FreeCodeCamp.org",
    thumbnail_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 7200,
  },
  {
    id: "vid-bca-dsa-2",
    course: "BCA",
    subject_name: "Data Structures & Algorithms",
    chapter_title: "Dynamic Programming Foundations",
    category: "part_2",
    youtube_video_id: "oBt53YbR9Kk",
    title: "Dynamic Programming - Learn to Solve Any DP Problem (Memoization & Tabulation)",
    channel_title: "FreeCodeCamp.org",
    thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 9000,
  },
  {
    id: "vid-bca-dbms-1",
    course: "BCA",
    subject_name: "Database Management Systems (DBMS)",
    chapter_title: "Database Normalization (1NF, 2NF, 3NF, BCNF)",
    category: "revision",
    youtube_video_id: "UrYLYV7WSHM",
    title: "Database Normalization Made Simple (1NF to BCNF with Examples)",
    channel_title: "Fireship",
    thumbnail_url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 600,
  },
  {
    id: "vid-bca-os-1",
    course: "BCA",
    subject_name: "Operating Systems",
    chapter_title: "Memory Management & Virtual Memory Paging",
    category: "practice",
    youtube_video_id: "2qukyP44iio",
    title: "Paging and Page Replacement Algorithms (FIFO, LRU, Optimal)",
    channel_title: "Neso Academy",
    thumbnail_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 1200,
  },

  // =========================================================================
  // Class 10 & Class 12
  // =========================================================================
  {
    id: "vid-c10-math-1",
    course: "Class 10",
    subject_name: "Mathematics",
    chapter_title: "Real Numbers & Fundamental Theorem of Arithmetic",
    category: "part_1",
    youtube_video_id: "bU96v5pQ8sY",
    title: "Real Numbers Class 10 Full Chapter One Shot Revision",
    channel_title: "Physics Wallah Foundation",
    thumbnail_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 3600,
  },
  {
    id: "vid-c12-acc-1",
    course: "Class 12",
    subject_name: "Accountancy",
    chapter_title: "Accounting for Share Capital & Debentures",
    category: "part_1",
    youtube_video_id: "eK9q_v1T_4A",
    title: "Issue of Shares Class 12: Pro-rata Allotment & Forfeiture Entries",
    channel_title: "Rajat Arora",
    thumbnail_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
    duration_seconds: 2800,
  },
];

export function getCuratedVideos(course?: string, subjectName?: string): CuratedVideo[] {
  if (!course && !subjectName) return CURATED_VIDEOS_DB;

  const filtered = CURATED_VIDEOS_DB.filter((v) => {
    const courseMatches =
      !course || v.course.toLowerCase() === course.toLowerCase();
    const subjectMatches =
      !subjectName ||
      v.subject_name.toLowerCase().includes(subjectName.toLowerCase()) ||
      subjectName.toLowerCase().includes(v.subject_name.toLowerCase());

    return courseMatches && subjectMatches;
  });

  if (filtered.length > 0) return filtered;

  // Fallback: match by course
  const courseOnly = CURATED_VIDEOS_DB.filter(
    (v) => !course || v.course.toLowerCase() === course.toLowerCase()
  );
  if (courseOnly.length > 0) return courseOnly;

  return CURATED_VIDEOS_DB;
}
