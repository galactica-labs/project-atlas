import { Controller, Get, InternalServerErrorException, Next, Req, Res } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { DocsService } from "./docs.service";

@Controller()
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get("openapi")
  getOpenApi() {
    const document = this.docsService.getDocument();

    if (!document) {
      throw new InternalServerErrorException("OpenAPI document not initialized");
    }

    return document;
  }

  @Get("reference")
  getReference(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return this.docsService.getReferenceHandler()(req, res, next);
  }
}
