import { Module, NestModule,MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {LoggerMiddleware} from './middleware'

import {interceptorProviders} from './helpers/interceptor'
import { AuthModule } from './modules/auth/auth.module';
import { ImageUploadModule } from './modules/image-upload/image-upload.module';
import { SignalModule } from './modules/signal/signal.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    AuthModule,
    ImageUploadModule,
    SignalModule
    
  ],
  controllers: [

  ],
  providers: [

     ...interceptorProviders
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

