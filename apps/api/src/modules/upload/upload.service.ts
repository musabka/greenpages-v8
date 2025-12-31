import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', ''),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', ''),
    });
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'greenpages');
    this.initBucket();
  }

  private async initBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        // Set bucket policy to public read
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      }
    } catch (error) {
      console.error('MinIO bucket initialization error:', error);
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    if (!file) {
      throw new BadRequestException('لم يتم اختيار ملف');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم');
    }

    const maxSize = parseInt(this.configService.get<string>('MAX_FILE_SIZE', '10485760'));
    if (file.size > maxSize) {
      throw new BadRequestException('حجم الملف كبير جداً');
    }

    const ext = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${ext}`;

    await this.minioClient.putObject(this.bucketName, fileName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<string>('MINIO_PORT', '9000');
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}/${this.bucketName}/${fileName}`;
  }

  async uploadMultiple(files: Express.Multer.File[], folder: string = 'uploads'): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const filePath = url.pathname.replace(`/${this.bucketName}/`, '');
      await this.minioClient.removeObject(this.bucketName, filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
