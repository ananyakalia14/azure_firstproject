import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { aiSummaryService } from "../services/aiService";
import { downloadStudyNoteBlob } from "../services/blobService";
import { cosmosStudyNoteService } from "../services/cosmosService";

interface GenerateSummaryRequest {
    blobUrl?: string;
}

class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

function corsHeaders(): Record<string, string> {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
    };
}

function json(status: number, body: object): HttpResponseInit {
    return {
        status,
        jsonBody: body,
        headers: { "Content-Type": "application/json", ...corsHeaders() }
    };
}

function emptyResponse(status: number): HttpResponseInit {
    return { status, headers: corsHeaders() };
}

function validateBlobUrl(blobUrl?: string): string {
    if (!blobUrl || typeof blobUrl !== "string") {
        throw new HttpError(400, "blobUrl is required.");
    }

    try {
        return new URL(blobUrl).toString();
    } catch {
        throw new HttpError(400, "blobUrl must be a valid URL.");
    }
}

async function readJsonBody(request: HttpRequest): Promise<GenerateSummaryRequest> {
    try {
        return await request.json() as GenerateSummaryRequest;
    } catch {
        throw new HttpError(400, "Request body must be valid JSON.");
    }
}

function extractTextFromPdf(buffer: Buffer): string {
    // This lightweight extractor keeps the pipeline working until a full PDF parser is introduced.
    return buffer
        .toString("latin1")
        .replace(/[^\x20-\x7E\n\r\t]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export async function GenerateSummary(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === "OPTIONS") {
        return emptyResponse(204);
    }

    try {
        const body = await readJsonBody(request);
        const blobUrl = validateBlobUrl(body.blobUrl);
        const downloadedPdf = await downloadStudyNoteBlob({ blobUrl });
        const extractedText = extractTextFromPdf(downloadedPdf.buffer);
        const summary = await aiSummaryService.generateSummary({ text: extractedText, sourceBlobUrl: blobUrl });
        const studyNote = await cosmosStudyNoteService.getByBlobUrl(blobUrl);

        if (studyNote) {
            await cosmosStudyNoteService.updateContent({
                id: studyNote.id,
                summary: summary.summary,
                status: "completed"
            });
        }

        return json(200, {
            success: true,
            id: studyNote?.id,
            blobUrl,
            summary: summary.summary,
            provider: summary.provider,
            extractedCharacters: summary.sourceCharacters
        });
    } catch (error) {
        if (error instanceof HttpError) {
            return json(error.status, { success: false, error: error.message });
        }

        context.error("GenerateSummary failed", error);
        return json(500, { success: false, error: "Summary generation failed." });
    }
}

app.http("GenerateSummary", {
    methods: ["POST", "OPTIONS"],
    authLevel: "anonymous",
    handler: GenerateSummary
});
