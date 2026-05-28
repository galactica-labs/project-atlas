"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _core = require("@nestjs/core");
const _swagger = require("@nestjs/swagger");
const _express = /*#__PURE__*/ _interop_require_default._(require("express"));
const _appmodule = require("./app.module");
const _docs = require("./docs");
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    app.use(_express.default.json());
    app.use(_express.default.urlencoded({
        extended: true
    }));
    // Enable validation globally
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    }));
    app.setGlobalPrefix("api");
    const config = new _swagger.DocumentBuilder().setTitle("Porject ATLAS Backend API").setDescription("The API used to power the Project ATLAS' backend.").setVersion("0.0.1").build();
    const document = _swagger.SwaggerModule.createDocument(app, config);
    app.get(_docs.DocsService).setDocument(document);
    const configService = app.get(_config.ConfigService);
    const port = configService.get("app.port", 3001);
    await app.listen(port, "0.0.0.0");
    _common.Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
    _common.Logger.log(`📚 OpenAPI at http://localhost:${port}/api/openapi`);
    _common.Logger.log(`📚 API Reference at http://localhost:${port}/api/reference`);
}
bootstrap();
