export interface LiveSessionStudentDTO {
    id: string;
    title: string;
    description: string;
    instructorName: string;
    scheduledAt: string;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    youtubeUrl: string;
    toolType: 'NONE' | 'TRADING_TERMINAL' | 'PYTHON_IDE' | 'JUPYTER_NOTEBOOK' | 'AGENT_INTERFACE';
}

export interface PageLiveSessionStudentDTO {
    content: LiveSessionStudentDTO[];
    totalElements: number;
    totalPages: number;
}