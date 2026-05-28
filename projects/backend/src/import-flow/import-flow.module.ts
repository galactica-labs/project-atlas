import { Module } from "@nestjs/common";
import { ImportFlowController } from "./import-flow.controller";
import { ImportFlowService } from "./import-flow.service";
import { ImportMatchingService } from "./import-matching.service";
import { IngressControllerService } from "./ingress-controller.service";

@Module({
  controllers: [ImportFlowController],
  providers: [ImportFlowService, ImportMatchingService, IngressControllerService],
})
export class ImportFlowModule {}
