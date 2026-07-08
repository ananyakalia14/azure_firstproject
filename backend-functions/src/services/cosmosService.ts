import { Container, CosmosClient, ItemResponse } from "@azure/cosmos";

const DEFAULT_DATABASE_NAME = "studymate";
const DEFAULT_CONTAINER_NAME = "study-notes";

export type StudyNoteStatus = "uploaded" | "summarizing" | "completed" | "failed";

export interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

export interface Flashcard {
    front: string;
    back: string;
}

export interface StudyNoteDocument {
    id: string;
    filename: string;
    blobUrl: string;
    uploadTime: string;
    summary: string | null;
    quiz: QuizQuestion[];
    flashcards: Flashcard[];
    status: StudyNoteStatus;
}

export interface StudyStateDocument {
    id: string;
    notes: unknown[];
    summaries: Record<string, unknown>;
    flashcards: Record<string, unknown[]>;
    quizzes: Record<string, unknown[]>;
    quizAttempts: unknown[];
    flashcardReviews: unknown[];
    updatedAt: string;
}

export interface CreateStudyNoteInput {
    id: string;
    filename: string;
    blobUrl: string;
    uploadTime?: string;
    status?: StudyNoteStatus;
}

export interface UpdateStudyNoteContentInput {
    id: string;
    summary?: string | null;
    quiz?: QuizQuestion[];
    flashcards?: Flashcard[];
    status?: StudyNoteStatus;
}

export interface CosmosStudyNoteService {
    create(input: CreateStudyNoteInput): Promise<StudyNoteDocument>;
    getById(id: string): Promise<StudyNoteDocument | null>;
    getByBlobUrl(blobUrl: string): Promise<StudyNoteDocument | null>;
    updateContent(input: UpdateStudyNoteContentInput): Promise<StudyNoteDocument>;
}

export interface CosmosStudyStateService {
    load(): Promise<StudyStateDocument>;
    save(state: Omit<StudyStateDocument, "id" | "updatedAt">): Promise<StudyStateDocument>;
    clear(): Promise<StudyStateDocument>;
}

let cachedContainer: Container | null = null;
const STUDY_STATE_ID = "study-state-default";

function getRequiredSetting(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} environment variable is missing.`);
    }

    return value;
}

function getDatabaseName(): string {
    return process.env.COSMOS_DATABASE_NAME || DEFAULT_DATABASE_NAME;
}

function getContainerName(): string {
    return process.env.COSMOS_CONTAINER_NAME || DEFAULT_CONTAINER_NAME;
}

function getContainer(): Container {
    if (cachedContainer) {
        return cachedContainer;
    }

    const client = new CosmosClient(getRequiredSetting("COSMOS_CONNECTION_STRING"));
    cachedContainer = client.database(getDatabaseName()).container(getContainerName());
    return cachedContainer;
}

function toStudyNoteDocument(input: CreateStudyNoteInput): StudyNoteDocument {
    return {
        id: input.id,
        filename: input.filename,
        blobUrl: input.blobUrl,
        uploadTime: input.uploadTime || new Date().toISOString(),
        summary: null,
        quiz: [],
        flashcards: [],
        status: input.status || "uploaded"
    };
}

function emptyStudyStateDocument(): StudyStateDocument {
    return {
        id: STUDY_STATE_ID,
        notes: [],
        summaries: {},
        flashcards: {},
        quizzes: {},
        quizAttempts: [],
        flashcardReviews: [],
        updatedAt: new Date().toISOString()
    };
}

class AzureCosmosStudyNoteService implements CosmosStudyNoteService {
    async create(input: CreateStudyNoteInput): Promise<StudyNoteDocument> {
        const document = toStudyNoteDocument(input);
        const response: ItemResponse<StudyNoteDocument> = await getContainer().items.create(document);
        return response.resource || document;
    }

    async getById(id: string): Promise<StudyNoteDocument | null> {
        try {
            const response = await getContainer().item(id, id).read<StudyNoteDocument>();
            return response.resource || null;
        } catch (error: any) {
            if (error.code === 404) return null;
            throw error;
        }
    }

    async getByBlobUrl(blobUrl: string): Promise<StudyNoteDocument | null> {
        const query = {
            query: "SELECT * FROM c WHERE c.blobUrl = @blobUrl OFFSET 0 LIMIT 1",
            parameters: [{ name: "@blobUrl", value: blobUrl }]
        };
        const { resources } = await getContainer().items.query<StudyNoteDocument>(query).fetchAll();
        return resources[0] || null;
    }

    async updateContent(input: UpdateStudyNoteContentInput): Promise<StudyNoteDocument> {
        const existingDocument = await this.getById(input.id);

        if (!existingDocument) {
            throw new Error(`Study note document ${input.id} was not found.`);
        }

        const updatedDocument: StudyNoteDocument = {
            ...existingDocument,
            summary: input.summary ?? existingDocument.summary,
            quiz: input.quiz ?? existingDocument.quiz,
            flashcards: input.flashcards ?? existingDocument.flashcards,
            status: input.status ?? existingDocument.status
        };

        const response = await getContainer().item(input.id, input.id).replace(updatedDocument);
        return response.resource || updatedDocument;
    }
}

export const cosmosStudyNoteService: CosmosStudyNoteService = new AzureCosmosStudyNoteService();

class AzureCosmosStudyStateService implements CosmosStudyStateService {
    async load(): Promise<StudyStateDocument> {
        try {
            const response = await getContainer().item(STUDY_STATE_ID, STUDY_STATE_ID).read<StudyStateDocument>();
            return response.resource || emptyStudyStateDocument();
        } catch (error: any) {
            if (error.code === 404) return emptyStudyStateDocument();
            throw error;
        }
    }

    async save(state: Omit<StudyStateDocument, "id" | "updatedAt">): Promise<StudyStateDocument> {
        const document: StudyStateDocument = {
            id: STUDY_STATE_ID,
            notes: state.notes || [],
            summaries: state.summaries || {},
            flashcards: state.flashcards || {},
            quizzes: state.quizzes || {},
            quizAttempts: state.quizAttempts || [],
            flashcardReviews: state.flashcardReviews || [],
            updatedAt: new Date().toISOString()
        };
        const response = await getContainer().items.upsert<StudyStateDocument>(document);
        return response.resource || document;
    }

    async clear(): Promise<StudyStateDocument> {
        const document = emptyStudyStateDocument();
        const response = await getContainer().items.upsert<StudyStateDocument>(document);
        return response.resource || document;
    }
}

export const cosmosStudyStateService: CosmosStudyStateService = new AzureCosmosStudyStateService();
