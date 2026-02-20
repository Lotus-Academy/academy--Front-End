export interface LessonDTO {
    id: string;
    title: string;
    duration: number; // en secondes
    orderIndex: number;
    sectionId: string;
    freePreview: boolean; // Ajouté depuis le JSON
    type: string;         // Ajouté depuis le JSON
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

export interface CourseResponseDTO {
    id: string;
    title: string;
    slug: string;
    subtitle: string;
    description: string;
    price: number;
    thumbnailUrl: string;
    level: string;
    language: string;
    status: string;
    categoryId: string;
    categoryName: string;
    instructorId: string;
    instructorName: string;

    studentsCount?: number;
    totalDuration?: string;
    rating?: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    sections: SectionDTO[];
}