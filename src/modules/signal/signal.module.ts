import { Module } from '@nestjs/common';
import { SignalGateway } from './signal.service';
import { RedisModule } from '../../config/redis/redis.module'
import { DatabaseModule } from '../../config/database/database.module'
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ RedisModule, DatabaseModule, ScheduleModule.forRoot()],
  providers: [SignalGateway]
})
export class SignalModule {}
