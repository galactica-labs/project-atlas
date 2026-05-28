import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configurations from "./config";
import { DatabaseModule } from "./db";
import { DocsModule } from "./docs";
import { ImportFlowModule } from "./import-flow";
import { PipelineModule } from "./pipeline";
import { TechnicianAssistModule } from "./technician-assist";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [...configurations],
      isGlobal: true,
      cache: true,
    }),
    DatabaseModule,
    DocsModule,
    ImportFlowModule,
    PipelineModule,
    TechnicianAssistModule,
    PipelineModule,
    TechnicianAssistModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
