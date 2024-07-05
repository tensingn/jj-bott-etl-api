import { Module } from '@nestjs/common';
import { WeeklyService } from './weekly.service';
import { WeeklyController } from './weekly.controller';

@Module({
  controllers: [WeeklyController],
  providers: [WeeklyService],
})
export class WeeklyModule {}
