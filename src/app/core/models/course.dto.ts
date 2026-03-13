export interface CategoryDTO {
    id: string;
    name: string;
    description?: string;
}

export interface LessonDTO {
    id: string;
    sectionId: string;
    title: string;
    description?: string;
    orderIndex: number;
    type: string;
    mediaUrl: string;
    duration: number; // en secondes
    freePreview: boolean;
    processingStatus?: string;
    completed: boolean;
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
    trailerUrl: string;
    level: string;
    language: string;
    status: string;
    categoryId: string;
    categoryName: string;
    instructorId: string;
    instructorName: string;
    instructorHeadline?: string;
    instructorPictureUrl?: string;

    studentsCount?: number;
    totalDuration?: string;
    averageRating?: number;
    reviewCount?: number;

    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    sections: SectionDTO[];
}

// Interface pour gérer la pagination renvoyée par Spring Boot
export interface PageCourseResponseDTO {
    content: CourseResponseDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number; // Page actuelle
    first: boolean;
    last: boolean;
    empty: boolean;
}