import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(json({ limit: '500kb' }));
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(3001);
}
bootstrap();
