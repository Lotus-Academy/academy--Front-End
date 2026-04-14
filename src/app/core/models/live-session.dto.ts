export interface LiveSessionStudentDTO {
    id: string;
    title: string;
    description: string;
    instructorName: string;
    scheduledAt: string;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    whepUrl: string;
    toolType: 'NONE' | 'TRADING_TERMINAL' | 'PYTHON_IDE' | 'JUPYTER_NOTEBOOK' | 'AGENT_INTERFACE';
    isRegistered?: boolean;
}

export interface LiveSessionInstructorDTO {
    id: string;
    title: string;
    description?: string;
    instructorName?: string;
    scheduledAt: string;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    whepUrl?: string;
    toolType: 'NONE' | 'TRADING_TERMINAL' | 'PYTHON_IDE' | 'JUPYTER_NOTEBOOK' | 'AGENT_INTERFACE';

    // --- Spécifique à l'instructeur pour configurer OBS ---
    streamPath?: string;
    streamKey?: string;
    serUrlForObs?: string;
    whipUrl?: string;
}

export interface PageLiveSessionStudentDTO {
    content: LiveSessionStudentDTO[];
    totalElements: number;
    totalPages: number;
}

export interface PageLiveSessionInstructorDTO {
    content: LiveSessionInstructorDTO[];
    totalElements: number;
    totalPages: number;
}