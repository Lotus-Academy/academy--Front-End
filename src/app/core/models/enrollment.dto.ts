export interface EnrollmentDTO {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  instructorName: string;
  studentName: string;
  studentEmail: string;
  progress: number;
  enrolledAt: string; // ISO 8601 Date string
  lastAccessedAt: string; // ISO 8601 Date string
  categoryId: string;
  totalLessons: number;
  completedLessons: number;
  completed: boolean;
}

export interface PageEnrollmentDTO {
  totalElements: number;
  totalPages: number;
  pageable: any;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: EnrollmentDTO[];
  number: number;
  sort: any;
  empty: boolean;
}