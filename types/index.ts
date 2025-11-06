export type UserRole = 'participant' | 'judge' | 'organizer';

export interface User {
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    profilePicUrl?: string;
    bio?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export type SubmissionStatus = 'pending' | 'under_review' | 'shortlisted' | 'selected' | 'not_selected';

export interface ProblemSubmission {
    id: string;
    title: string;
    description: string;
    significance: string;
    highlights: string;
    status: SubmissionStatus;
    teamId: string;
    teamName: string;
    assignedJudge?: string;
    assignedJudgeName?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Evaluation {
    id: string;
    submissionId: string;
    judgeId: string;
    judgeName: string;
    score: number;
    feedback: string;
    shortlistRecommendation: boolean;
    createdAt: Date;
}

export type HackathonMode = 'online' | 'offline' | 'hybrid';

export interface HackathonTrack {
    id: string;
    name: string;
    description: string;
    prizePool?: number;
}

export interface Hackathon {
    id: string;
    organizerId: string;
    organizerName: string;
    title: string;
    description: string;
    posterUrl?: string;
    prizePool: number;
    teamSize: {
        min: number;
        max: number;
    };
    mode: HackathonMode;
    venue?: string; // Required if offline or hybrid
    schedule: {
        registrationStart: Date;
        registrationEnd: Date;
        eventStart: Date;
        eventEnd: Date;
    };
    tracks: HackathonTrack[];
    createdAt: Date;
    updatedAt: Date;
}
