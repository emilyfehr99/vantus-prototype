import { AnalysisRequest, AnalysisResponse } from "@/types";

export const analyzeScope = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error("Failed to analyze scope");
    }

    return response.json();
};
