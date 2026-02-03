import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function start() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
 
    const PORT = configService.get<number>('PORT', 5000); 
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new HttpExceptionFilter());
    const config = new DocumentBuilder()
        .setTitle('Мой первый проект на Nest')
        .setDescription('Учиться, учиться и еще раз учиться')
        .setVersion('1.0')
        .addTag('programer')
        .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/api/docs', app, document);

    await app.listen(PORT, () => console.log(`Server started on port = ${PORT}`));
}

start();