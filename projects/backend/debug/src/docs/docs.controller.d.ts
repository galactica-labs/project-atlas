import type { NextFunction, Request, Response } from "express";
import { DocsService } from "./docs.service";
export declare class DocsController {
    private readonly docsService;
    constructor(docsService: DocsService);
    getOpenApi(): import("@nestjs/swagger").OpenAPIObject;
    getReference(req: Request, res: Response, next: NextFunction): unknown;
}
//# sourceMappingURL=docs.controller.d.ts.map