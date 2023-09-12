import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresOption } from './config/database.config';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...postgresOption,
      autoLoadEntities: true
    }),
    CommonModule
  ],
})
export class AppModule { }
