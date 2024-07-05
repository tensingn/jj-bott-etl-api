import { Module } from '@nestjs/common';
import { WeeklyModule } from './routes/weekly/weekly.module';

@Module({
  imports: [WeeklyModule],
})
export class AppModule {}
