import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosStudyStateService } from "../services/cosmosService";

function json(status: number, body: object): HttpResponseInit {
    return { status, jsonBody: body, headers: { "Content-Type": "application/json" } };
}

function stripMetadata(document: any) {
    const { id: _id, updatedAt: _updatedAt, ...state } = document;
    return state;
}

async function readStateBody(request: HttpRequest) {
    try {
        return await request.json() as any;
    } catch {
        return null;
    }
}

export async function StudyState(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        if (request.method === "GET") {
            return json(200, stripMetadata(await cosmosStudyStateService.load()));
        }

        if (request.method === "PUT") {
            const body = await readStateBody(request);
            if (!body) return json(400, { success: false, error: "Request body must be valid JSON." });
            return json(200, stripMetadata(await cosmosStudyStateService.save(body)));
        }

        if (request.method === "DELETE") {
            return json(200, stripMetadata(await cosmosStudyStateService.clear()));
        }

        return json(405, { success: false, error: "Method not allowed." });
    } catch (error) {
        context.error("StudyState failed", error);
        return json(500, { success: false, error: "Study state request failed." });
    }
}

app.http("StudyState", {
    methods: ["GET", "PUT", "DELETE"],
    authLevel: "anonymous",
    handler: StudyState
});
