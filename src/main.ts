import 'dotenv/config'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {NestExpressApplication} from '@nestjs/platform-express'
import {expressBind} from 'i18n-2'
import {localize} from './middleware'
import { ValidateInputPipe } from './middleware/validate';
import {AuthModuleGuard} from './middleware/guards'
import {nestwinstonLog, HttpPortLog} from './config/winstonLog'


async function bootstrap() {

  const NestFactoryOptions = {logger:  nestwinstonLog}

  const app = await NestFactory.create<NestExpressApplication>(AppModule,NestFactoryOptions)

  // Increase WebSocket server timeout values
  app.getHttpAdapter().getHttpServer().setTimeout(0);
  
 // global prefix
  app.setGlobalPrefix(process.env.PREFIX)
  
   expressBind(app, {locales: [ 'en' ] })
 
   app.use(localize)

   //handle browser cros..
   app.enableCors()

  // handle all user input validation globally

  app.useGlobalPipes(new ValidateInputPipe());

  //use globally to check auth module from request header
  app.useGlobalGuards(new AuthModuleGuard())

  await app.listen(process.env.PORT || 3000, () => HttpPortLog(process.env.PORT || 3000));

}

bootstrap();
