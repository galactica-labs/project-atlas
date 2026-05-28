/**
 * Static OpenAPI schema generation script.
 *
 * This script generates the OpenAPI spec WITHOUT running the server.
 * It bootstraps only the NestJS application context, extracts the schema,
 * and writes it to disk.
 *
 * NOTE: This file must be compiled with SWC before running because
 * bun doesn't handle class-transformer decorators properly.
 *
 * Usage (via nx target):
 *   nx run @atlas/backend:openapi:generate
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _nodefs = require("node:fs");
const _core = require("@nestjs/core");
const _swagger = require("@nestjs/swagger");
const _appmodule = require("./app.module");
async function generateOpenApiSpec() {
    console.log("🔨 Generating OpenAPI schema statically...");
    // Create application context without starting the server
    const app = await _core.NestFactory.create(_appmodule.AppModule, {
        logger: false
    });
    // Set the same global prefix as main.ts
    app.setGlobalPrefix("api");
    // Build the same OpenAPI config as main.ts
    const config = new _swagger.DocumentBuilder().setTitle("Porject ATLAS Backend API").setDescription("The API used to power the Project ATLAS' backend.").setVersion("0.0.1").build();
    // Generate the document
    const document = _swagger.SwaggerModule.createDocument(app, config);
    // Write to file (relative to cwd, which is projects/backend)
    const outputPath = "./openapi.json";
    (0, _nodefs.writeFileSync)(outputPath, JSON.stringify(document, null, 2));
    console.log(`✅ OpenAPI schema exported to ${outputPath}`);
    console.log(`   Found ${Object.keys(document.paths || {}).length} paths`);
    // Clean up
    await app.close();
    process.exit(0);
}
generateOpenApiSpec().catch((error)=>{
    console.error("❌ Failed to generate OpenAPI schema:", error);
    process.exit(1);
});
