export interface LessonDTO {
    id: string;
    title: string;
    duration: number; // En secondes selon le backend
    orderIndex: number;
    sectionId: string;
    mediaUrl: string;
    isCompleted: boolean;
}

export interface SectionDTO {
    id: string;
    title: string;
    orderIndex: number;
    courseId: string;
    lessons: LessonDTO[];
}

export interface CourseDetailDTO {
    id: string;
    title: string;
    description: string;
    price: number;
    status: string;
    createdAt: string;
    publishedAt: string;
    instructorId: string;
    instructorEmail: string;
    instructorName?: string; // Optionnel : souvent utile pour l'UI
    sections: SectionDTO[];
    totalSections: number;
    totalLessons: number;
    totalDuration: number; // En secondes
    thumbnailUrl: string;
}