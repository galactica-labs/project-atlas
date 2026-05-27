import { Injectable } from "@nestjs/common";
import type { OpenAPIObject } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import type { RequestHandler } from "express";

@Injectable()
export class DocsService {
  private document: OpenAPIObject | null = null;
  private readonly referenceHandler: RequestHandler = apiReference({
    url: "/api/openapi",
  });

  setDocument(document: OpenAPIObject) {
    this.document = document;
  }

  getDocument() {
    return this.document;
  }

  getReferenceHandler(): RequestHandler {
    return this.referenceHandler;
  }
}
