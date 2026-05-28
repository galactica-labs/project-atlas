import { Module } from "@nestjs/common";
import { TechnicianAssistController } from "./technician-assist.controller";
import { TechnicianAssistService } from "./technician-assist.service";

@Module({
  controllers: [TechnicianAssistController],
  providers: [TechnicianAssistService],
})
export class TechnicianAssistModule {}
