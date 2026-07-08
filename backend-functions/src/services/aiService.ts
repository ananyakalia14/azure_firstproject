export interface GenerateSummaryInput {
    text: string;
    sourceBlobUrl: string;
}

export interface GenerateSummaryResult {
    summary: string;
    provider: "mock";
    sourceCharacters: number;
}

export interface AiSummaryService {
    generateSummary(input: GenerateSummaryInput): Promise<GenerateSummaryResult>;
}

class MockAiSummaryService implements AiSummaryService {
    async generateSummary(input: GenerateSummaryInput): Promise<GenerateSummaryResult> {
        const trimmedText = input.text.trim();

        return {
            summary: trimmedText
                ? "Mock summary: This study note PDF was received and text extraction completed successfully."
                : "Mock summary: This PDF was received, but no readable text was extracted yet.",
            provider: "mock",
            sourceCharacters: trimmedText.length
        };
    }
}

export const aiSummaryService: AiSummaryService = new MockAiSummaryService();
