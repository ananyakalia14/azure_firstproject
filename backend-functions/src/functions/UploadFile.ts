import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import Busboy from "busboy";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { uploadStudyNoteBlob } from "../services/blobService";
import { cosmosStudyNoteService } from "../services/cosmosService";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PDF_CONTENT_TYPE = "application/pdf";
interface ParsedFile { buffer: Buffer; contentType: string; size: number; }
class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}
function json(status: number, body: object): HttpResponseInit {
    return { status, jsonBody: body, headers: { "Content-Type": "application/json" } };
}
function createUniquePdfFileName(): string {
    // The storage name is deterministic enough for operations and unique enough for concurrent uploads.
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `notes-${datePart}-${randomUUID()}.pdf`;
}
function isPdf(buffer: Buffer): boolean {
    // MIME type is client supplied, so the PDF magic bytes add a server-side content check.
    return buffer.subarray(0, 4).toString("utf8") === "%PDF";
}
async function parseMultipartPdf(request: HttpRequest): Promise<ParsedFile> {
    const contentType = request.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("multipart/form-data")) {
        throw new HttpError(400, "Request must be multipart/form-data.");
    }

    const requestBody = Buffer.from(await request.arrayBuffer());
    return new Promise((resolve, reject) => {
        let foundFile = false;
        let settled = false;
        const fail = (error: Error) => {
            if (settled) return;
            settled = true;
            reject(error);
        };

        const busboy = Busboy({
            headers: { "content-type": contentType },
            limits: { files: 1, fileSize: MAX_FILE_SIZE_BYTES }
        });

        busboy.on("file", (_fieldName, file, info) => {
            foundFile = true;
            if (info.mimeType !== PDF_CONTENT_TYPE || !info.filename.toLowerCase().endsWith(".pdf")) {
                file.resume();
                fail(new HttpError(415, "Only PDF files are supported."));
                return;
            }

            const chunks: Buffer[] = [];
            let fileTooLarge = false;
            file.on("limit", () => {
                fileTooLarge = true;
                file.resume();
            });
            file.on("data", (chunk: Buffer) => chunks.push(chunk));
            file.on("error", fail);
            file.on("end", () => {
                if (fileTooLarge) {
                    fail(new HttpError(400, "PDF file must be 10 MB or smaller."));
                    return;
                }

                const buffer = Buffer.concat(chunks);
                if (!isPdf(buffer)) {
                    fail(new HttpError(415, "Uploaded file content is not a valid PDF."));
                    return;
                }
                if (!settled) {
                    settled = true;
                    resolve({ buffer, contentType: PDF_CONTENT_TYPE, size: buffer.length });
                }
            });
        });

        busboy.on("filesLimit", () => fail(new HttpError(400, "Upload exactly one PDF file.")));
        busboy.on("error", fail);
        busboy.on("finish", () => {
            if (!foundFile) {
                fail(new HttpError(400, "No PDF file was provided."));
            }
        });
        Readable.from(requestBody).pipe(busboy);
    });
}
export async function UploadFile(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // The function validates HTTP input, then delegates all Azure Blob operations to the service layer.
        const parsedFile = await parseMultipartPdf(request);
        const fileName = createUniquePdfFileName();
        const { blobUrl } = await uploadStudyNoteBlob({
            fileName,
            buffer: parsedFile.buffer,
            contentType: parsedFile.contentType
        });
        const studyNote = await cosmosStudyNoteService.create({
            id: randomUUID(),
            filename: fileName,
            blobUrl,
            status: "uploaded"
        });

        return json(200, { success: true, id: studyNote.id, fileName, blobUrl, size: parsedFile.size });
    } catch (error) {
        if (error instanceof HttpError) {
            return json(error.status, { success: false, error: error.message });
        }

        context.error("UploadFile failed", error);
        return json(500, { success: false, error: "File upload failed." });
    }
}
app.http("UploadFile", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: UploadFile
});
