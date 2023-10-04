import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresOption } from './config/database.config';
import { UserAuthModule } from './common/modules/user.module';
import { DoctorAuthModule } from './common/modules/doctor.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...postgresOption,
      autoLoadEntities: true
    }),
    UserAuthModule,
    DoctorAuthModule,
  ],
})
export class AppModule { }
