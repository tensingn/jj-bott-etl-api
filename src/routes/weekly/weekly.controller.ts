import { Controller, Post } from '@nestjs/common';
import { WeeklyService } from './weekly.service';

@Controller('weekly')
export class WeeklyController {
    constructor(private readonly weeklyService: WeeklyService) {}

    @Post('postGame')
    postGame() {
        return this.weeklyService.runPostGame();
    }

    @Post('preGame')
    preGame() {
        return this.weeklyService.runPreGame();
    }
}
