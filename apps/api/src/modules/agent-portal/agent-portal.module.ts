import { Module } from '@nestjs/common';
import { AgentPortalService } from './agent-portal.service';
import { AgentPortalController } from './agent-portal.controller';

@Module({
  controllers: [AgentPortalController],
  providers: [AgentPortalService],
  exports: [AgentPortalService],
})
export class AgentPortalModule {}
