import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { Readable } from "stream";

const STUDY_NOTES_CONTAINER = "study-notes";

export interface UploadBlobInput {
    fileName: string;
    buffer: Buffer;
    contentType: string;
}

export interface UploadBlobResult {
    blobUrl: string;
}

export interface DownloadBlobInput {
    blobUrl: string;
}

export interface DownloadBlobResult {
    buffer: Buffer;
    contentType?: string;
}

function getStorageConnectionString(): string {
    const connectionString = process.env.AzureWebJobsStorage;

    if (!connectionString) {
        throw new Error("AzureWebJobsStorage environment variable is missing.");
    }

    return connectionString;
}

function getStudyNotesContainerClient(): ContainerClient {
    // The SDK client is created from environment configuration, keeping secrets out of source code.
    const blobServiceClient = BlobServiceClient.fromConnectionString(getStorageConnectionString());
    return blobServiceClient.getContainerClient(STUDY_NOTES_CONTAINER);
}

function getBlobNameFromUrl(blobUrl: string): string {
    const url = new URL(blobUrl);
    const [, containerName, ...blobPathParts] = url.pathname.split("/");

    if (containerName !== STUDY_NOTES_CONTAINER || blobPathParts.length === 0) {
        throw new Error("Blob URL must point to the study-notes container.");
    }

    return decodeURIComponent(blobPathParts.join("/"));
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of stream as Readable) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
}

export async function uploadStudyNoteBlob(input: UploadBlobInput): Promise<UploadBlobResult> {
    const containerClient = getStudyNotesContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(input.fileName);

    // The container already exists in Azure; this call makes local/dev environments forgiving.
    await containerClient.createIfNotExists();

    // uploadData is the current Azure SDK API for uploading an in-memory Buffer.
    await blockBlobClient.uploadData(input.buffer, {
        blobHTTPHeaders: {
            blobContentType: input.contentType
        }
    });

    return {
        blobUrl: blockBlobClient.url
    };
}

export async function downloadStudyNoteBlob(input: DownloadBlobInput): Promise<DownloadBlobResult> {
    const blobName = getBlobNameFromUrl(input.blobUrl);
    const containerClient = getStudyNotesContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();

    if (!downloadResponse.readableStreamBody) {
        throw new Error("Blob download returned an empty stream.");
    }

    return {
        buffer: await streamToBuffer(downloadResponse.readableStreamBody),
        contentType: downloadResponse.contentType
    };
}
