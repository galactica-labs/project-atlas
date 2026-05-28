import type { OpenAPIObject } from "@nestjs/swagger";
import type { RequestHandler } from "express";
export declare class DocsService {
    private document;
    private readonly referenceHandler;
    setDocument(document: OpenAPIObject): void;
    getDocument(): OpenAPIObject | null;
    getReferenceHandler(): RequestHandler;
}
//# sourceMappingURL=docs.service.d.ts.map