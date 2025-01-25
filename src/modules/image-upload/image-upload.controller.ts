import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express'
// import { BufferedFile } from '../minio-client/file.model';
import { ImageUploadService } from './image-upload.service'

@Controller('image-upload')
export class ImageUploadController {

    constructor( 
        private imageUploadService: ImageUploadService
      ) {}
    
      // @Post('single')
      // @UseInterceptors(FileInterceptor('image'))
      // async uploadSingle(@UploadedFile() image: BufferedFile) { 

      //   return await this.imageUploadService.uploadSingle(image)
      // }

}
