import { Module } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { ImageUploadController } from './image-upload.controller';

@Module({
  imports : [],
  providers: [ImageUploadService],
  controllers: [ImageUploadController]
})
export class ImageUploadModule {}
