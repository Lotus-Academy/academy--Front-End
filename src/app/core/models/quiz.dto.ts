export interface QuizRequestDto {
    title: string;
    passingScore: number;
    courseId: string;      // UUID → string côté TS
    questions: QuestionDto[];
}

export interface QuestionDto {
    text: string;
    options: OptionDto[];
}
export interface OptionDto {
    text: string;
    isCorrect: boolean;
}