// ============================================================
// Static Mock Data — Medical Notes Admin Panel
// All data is local; replace with API calls when ready.
// ============================================================
import type { User, Block, Subject, Chapter, Note, Activity, DashboardStats } from '@/types';

export const users: User[] = [
  {
    id: '1',
    name: 'Sarah Ahmed',
    email: 'sarah.ahmed@example.com',
    phone: '+92-300-1234567',
    university: 'Aga Khan University',
    mbbsYear: 1,
    assignedBlocks: ['Block 1', 'Block 2', 'Block 3'],
    status: 'Enabled',
    accessStart: '2026-01-15',
    accessEnd: '2026-12-31',
    createdAt: '2026-01-10',
    deviceInfo: { model: 'iPhone 14 Pro', os: 'iOS 17.4', platform: 'iOS', registeredAt: '2026-01-15', lastSeen: '2026-03-10' },
  },
  {
    id: '2',
    name: 'Ali Hassan',
    email: 'ali.hassan@example.com',
    phone: '+92-301-2345678',
    university: 'King Edward Medical University',
    mbbsYear: 2,
    assignedBlocks: ['Block 4', 'Block 5', 'Block 6'],
    status: 'Enabled',
    accessStart: '2026-01-01',
    accessEnd: '2026-06-30',
    createdAt: '2025-12-28',
    deviceInfo: { model: 'Samsung Galaxy S24', os: 'Android 14', platform: 'Android', registeredAt: '2026-01-02', lastSeen: '2026-03-09' },
  },
  {
    id: '3',
    name: 'Fatima Khan',
    email: 'fatima.khan@example.com',
    phone: '+92-302-3456789',
    university: 'Dow University of Health Sciences',
    mbbsYear: 3,
    assignedBlocks: ['Block 7', 'Block 8', 'Block 9'],
    status: 'Disabled',
    accessStart: '2025-09-01',
    accessEnd: '2026-03-31',
    createdAt: '2025-08-15',
    deviceInfo: null,  // No device registered (or admin cleared it)
  },
  {
    id: '4',
    name: 'Ahmed Malik',
    email: 'ahmed.malik@example.com',
    phone: '+92-303-4567890',
    university: 'Allama Iqbal Medical College',
    mbbsYear: 4,
    assignedBlocks: ['Block 10', 'Block 11', 'Block 12'],
    status: 'Enabled',
    accessStart: '2026-02-01',
    accessEnd: '2027-01-31',
    createdAt: '2026-01-25',
    deviceInfo: { model: 'iPhone 15', os: 'iOS 17.3', platform: 'iOS', registeredAt: '2026-02-01', lastSeen: '2026-03-08' },
  },
  {
    id: '5',
    name: 'Aisha Siddiqui',
    email: 'aisha.siddiqui@example.com',
    phone: '+92-304-5678901',
    university: 'Rawalpindi Medical University',
    mbbsYear: 5,
    assignedBlocks: ['Block 13', 'Block 14', 'Block 15'],
    status: 'Enabled',
    accessStart: '2026-01-10',
    accessEnd: '2026-12-20',
    createdAt: '2026-01-05',
    deviceInfo: { model: 'Pixel 8', os: 'Android 14', platform: 'Android', registeredAt: '2026-01-12', lastSeen: '2026-03-07' },
  },
];


export const blocks: Block[] = [
  { id: 'b1',  name: 'Block 1',  year: 1 },
  { id: 'b2',  name: 'Block 2',  year: 1 },
  { id: 'b3',  name: 'Block 3',  year: 1 },
  { id: 'b4',  name: 'Block 4',  year: 2 },
  { id: 'b5',  name: 'Block 5',  year: 2 },
  { id: 'b6',  name: 'Block 6',  year: 2 },
  { id: 'b7',  name: 'Block 7',  year: 3 },
  { id: 'b8',  name: 'Block 8',  year: 3 },
  { id: 'b9',  name: 'Block 9',  year: 3 },
  { id: 'b10', name: 'Block 10', year: 4 },
  { id: 'b11', name: 'Block 11', year: 4 },
  { id: 'b12', name: 'Block 12', year: 4 },
  { id: 'b13', name: 'Block 13', year: 5 },
  { id: 'b14', name: 'Block 14', year: 5 },
  { id: 'b15', name: 'Block 15', year: 5 },
];

export const subjects: Subject[] = [
  { id: 's1',  name: 'General Anatomy',  blockId: 'b1', blockName: 'Block 1' },
  { id: 's2',  name: 'Histology',        blockId: 'b1', blockName: 'Block 1' },
  { id: 's3',  name: 'Embryology',       blockId: 'b1', blockName: 'Block 1' },
  { id: 's4',  name: 'Gross Anatomy',    blockId: 'b2', blockName: 'Block 2' },
  { id: 's5',  name: 'Biochemistry',     blockId: 'b2', blockName: 'Block 2' },
  { id: 's6',  name: 'Physiology',       blockId: 'b3', blockName: 'Block 3' },
  { id: 's7',  name: 'Biochemistry II',  blockId: 'b3', blockName: 'Block 3' },
  { id: 's8',  name: 'Pathology',        blockId: 'b4', blockName: 'Block 4' },
  { id: 's9',  name: 'Pharmacology',     blockId: 'b4', blockName: 'Block 4' },
  { id: 's10', name: 'Microbiology',     blockId: 'b5', blockName: 'Block 5' },
  { id: 's11', name: 'Community Medicine', blockId: 'b5', blockName: 'Block 5' },
];

export const chapters: Chapter[] = [
  { id: 'c1',  name: 'Introduction to Anatomy',   subjectId: 's1', subjectName: 'General Anatomy', blockId: 'b1', blockName: 'Block 1' },
  { id: 'c2',  name: 'Anatomical Terminology',    subjectId: 's1', subjectName: 'General Anatomy', blockId: 'b1', blockName: 'Block 1' },
  { id: 'c3',  name: 'Skeletal System',           subjectId: 's1', subjectName: 'General Anatomy', blockId: 'b1', blockName: 'Block 1' },
  { id: 'c4',  name: 'Cell Structure',            subjectId: 's2', subjectName: 'Histology',       blockId: 'b1', blockName: 'Block 1' },
  { id: 'c5',  name: 'Epithelial Tissue',         subjectId: 's2', subjectName: 'Histology',       blockId: 'b1', blockName: 'Block 1' },
  { id: 'c6',  name: 'Gametogenesis',             subjectId: 's3', subjectName: 'Embryology',      blockId: 'b1', blockName: 'Block 1' },
  { id: 'c7',  name: 'Fertilization',             subjectId: 's3', subjectName: 'Embryology',      blockId: 'b1', blockName: 'Block 1' },
  { id: 'c8',  name: 'Upper Limb',                subjectId: 's4', subjectName: 'Gross Anatomy',   blockId: 'b2', blockName: 'Block 2' },
  { id: 'c9',  name: 'Lower Limb',                subjectId: 's4', subjectName: 'Gross Anatomy',   blockId: 'b2', blockName: 'Block 2' },
  { id: 'c10', name: 'Carbohydrate Metabolism',   subjectId: 's5', subjectName: 'Biochemistry',    blockId: 'b2', blockName: 'Block 2' },
];

export const notes: Note[] = [
  { id: 'n1', chapterId: 'c1', chapterName: 'Introduction to Anatomy',  subjectId: 's1', subjectName: 'General Anatomy', blockId: 'b1', blockName: 'Block 1', pdfFileName: 'intro_to_anatomy.pdf',       fileSize: '2.4 MB', uploadDate: '2026-01-15' },
  { id: 'n2', chapterId: 'c2', chapterName: 'Anatomical Terminology',   subjectId: 's1', subjectName: 'General Anatomy', blockId: 'b1', blockName: 'Block 1', pdfFileName: 'anatomical_terminology.pdf',  fileSize: '1.8 MB', uploadDate: '2026-01-20' },
  { id: 'n3', chapterId: 'c3', chapterName: 'Skeletal System',          subjectId: 's1', subjectName: 'General Anatomy', blockId: 'b1', blockName: 'Block 1', pdfFileName: 'skeletal_system.pdf',         fileSize: '3.1 MB', uploadDate: '2026-01-25' },
  { id: 'n4', chapterId: 'c4', chapterName: 'Cell Structure',           subjectId: 's2', subjectName: 'Histology',       blockId: 'b1', blockName: 'Block 1', pdfFileName: 'cell_structure.pdf',          fileSize: '1.5 MB', uploadDate: '2026-02-01' },
  { id: 'n5', chapterId: 'c5', chapterName: 'Epithelial Tissue',        subjectId: 's2', subjectName: 'Histology',       blockId: 'b1', blockName: 'Block 1', pdfFileName: 'epithelial_tissue.pdf',       fileSize: '2.0 MB', uploadDate: '2026-02-05' },
  { id: 'n6', chapterId: 'c8', chapterName: 'Upper Limb',               subjectId: 's4', subjectName: 'Gross Anatomy',   blockId: 'b2', blockName: 'Block 2', pdfFileName: 'upper_limb.pdf',              fileSize: '4.2 MB', uploadDate: '2026-02-10' },
  { id: 'n7', chapterId: 'c10', chapterName: 'Carbohydrate Metabolism', subjectId: 's5', subjectName: 'Biochemistry',    blockId: 'b2', blockName: 'Block 2', pdfFileName: 'carbohydrate_metabolism.pdf', fileSize: '1.9 MB', uploadDate: '2026-02-15' },
];

export const recentActivity: Activity[] = [
  { id: 'a1', userName: 'Sarah Ahmed',   action: 'Accessed notes',    courseBlock: 'Block 1 — General Anatomy',  date: '2026-03-10' },
  { id: 'a2', userName: 'Ali Hassan',    action: 'Account created',   courseBlock: 'Block 4',                    date: '2026-03-09' },
  { id: 'a3', userName: 'Ahmed Malik',   action: 'Block assigned',    courseBlock: 'Block 10',                   date: '2026-03-08' },
  { id: 'a4', userName: 'Aisha Siddiqui', action: 'Access extended',  courseBlock: 'Blocks 13–15',               date: '2026-03-07' },
  { id: 'a5', userName: 'Sarah Ahmed',   action: 'Notes downloaded',  courseBlock: 'Block 2 — Biochemistry',     date: '2026-03-06' },
];

export const dashboardStats: DashboardStats = {
  totalUsers: users.length,
  activeUsers: users.filter(u => u.status === 'Enabled').length,
  disabledUsers: users.filter(u => u.status === 'Disabled').length,
  totalBlocks: blocks.length,
  totalSubjects: subjects.length,
  totalChapters: chapters.length,
  totalNotes: notes.length,
};
