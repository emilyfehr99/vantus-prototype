export enum VerdictType {
    IN_SCOPE = 'IN_SCOPE',
    OUT_OF_SCOPE = 'OUT_OF_SCOPE',
    UNCLEAR = 'UNCLEAR',
}

export interface AnalysisResponse {
    verdict: VerdictType;
    reasoning: string;
    suggestedSubject: string;
    emailDraft: string;
    estimatedValue?: string;
}

export interface AnalysisRequest {
    contractText: string;
    clientEmail: string;
    tone: 'soft' | 'firm' | 'hard';
}
