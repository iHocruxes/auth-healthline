import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

var cookieParser = require('cookie-parser')

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser())
  //Swagger
  const config = new DocumentBuilder()
    .setTitle('auth*')
    .setDescription('HealthLine API description')
    .setVersion('1.0')
    .addTag('auth*')
    // .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('', app, document, {
    customfavIcon: 'https://cdn.icon-icons.com/icons2/2107/PNG/512/file_type_swagger_icon_130134.png',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  })
  //endSwagger

  app.useGlobalPipes(new ValidationPipe())

  app.enableCors({
    origin: 'https://healthline.vn',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  })

  app.setGlobalPrefix('common')

  await app.listen(3000);
}
bootstrap();
