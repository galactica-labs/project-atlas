import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import express from "express";
import { AppModule } from "./app.module";
import { DocsService } from "./docs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("Porject ATLAS Backend API")
    .setDescription("The API used to power the Project ATLAS' backend.")
    .setVersion("0.0.1")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  app.get(DocsService).setDocument(document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port", 3001);
  await app.listen(port, "0.0.0.0");

  Logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  Logger.log(`📚 OpenAPI at http://localhost:${port}/api/openapi`);
  Logger.log(`📚 API Reference at http://localhost:${port}/api/reference`);
}

bootstrap();
