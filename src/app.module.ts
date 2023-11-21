import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresOption } from './config/database.config';
import { UserAuthModule } from './common/modules/user.module';
import { DoctorAuthModule } from './common/modules/doctor.module';
import { AdminAuthModule } from './common/modules/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...postgresOption,
      autoLoadEntities: true
    }),
    UserAuthModule,
    DoctorAuthModule,
    AdminAuthModule
  ],
})
export class AppModule { }
