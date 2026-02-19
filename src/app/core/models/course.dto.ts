export interface LessonDTO {
    id: string;
    title: string;
    duration: number;
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

export interface CourseResponseDTO {
    id: string; // UUID
    title: string;
    slug?: string;
    subtitle: string;
    description: string;

    price: number; // BigDecimal
    thumbnailUrl: string;
    level: string;
    language: string;
    status: string;

    categoryId: string;
    categoryName: string;

    instructorId: string;
    instructorName: string;

    createdAt: string; // LocalDateTime
    updatedAt: string;
    publishedAt: string;

    sections: SectionDTO[];
}