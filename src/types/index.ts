// ============================================================
// Domain Types — Medical Notes Admin Panel
// ============================================================

/** One device per user. Populated on first login, cleared by admin to allow re-registration. */
export interface DeviceInfo {
  model: string; // e.g. "iPhone 14 Pro"
  os: string; // e.g. "iOS 17.4"
  platform: "iOS" | "Android";
  registeredAt: string; // ISO date of first login from this device
  lastSeen: string; // ISO date of most recent login
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  mbbsYear: number;
  assignedBlocks: string[];
  status: "Enabled" | "Disabled";
  accessStart: string;
  accessEnd: string;
  createdAt: string;
  /** Registered device. null = no device yet (or admin cleared it). */
  deviceInfo?: DeviceInfo | null;
}

export interface Block {
  id: string;
  name: string;
  year: number;
}

export interface Subject {
  id: string;
  name: string;
  blockId: string;
  blockName: string;
}

export interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  blockId: string;
  blockName: string;
}

export interface Note {
  id: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  blockId: string;
  blockName: string;
  pdfFileName: string;
  pdfFileKey?: string;
  fileSize?: string;
  uploadDate: string;
}

export interface Activity {
  id: string;
  userName: string;
  action: string;
  courseBlock: string;
  date: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  totalBlocks: number;
  totalSubjects: number;
  totalChapters: number;
  totalNotes: number;
}

// ============================================================
// Form state types
// ============================================================

export type UserFormData = {
  name: string;
  email: string;
  phone: string;
  university: string;
  mbbsYear: string;
  accessStart: string;
  accessEnd: string;
  selectedBlocks: string[];
};

export type BlockFormData = { name: string; year: string };

export type SubjectFormData = { name: string; blockId: string };

export type ChapterFormData = {
  name: string;
  subjectId: string;
  blockId: string;
};

export type NoteFormData = {
  year: string;
  blockId: string;
  subjectId: string;
  chapterId: string;
};
