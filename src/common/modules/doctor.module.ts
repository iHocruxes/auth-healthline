import { Module } from '@nestjs/common';
import { DoctorAuthService } from '../services/doctor.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from '../entities/token.entity';
import { DoctorStrategy } from '../strategies/doctor.strategy';
import { DoctorAuthController } from '../controllers/doctor.controller';
import { Doctor } from '../entities/doctor.entity';
import { PassportModule } from '@nestjs/passport';
import * as dotenv from 'dotenv'

dotenv.config()

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'doctor' }),
        JwtModule.register({
            global: true,
            secret: process.env.DOCTOR_SECRET,
            signOptions: { expiresIn: '4d' }
        }),
        TypeOrmModule.forFeature([Token, Doctor]),
    ],
    providers: [
        DoctorAuthService,
        DoctorStrategy,
    ],
    controllers: [
        DoctorAuthController
    ]
})
export class DoctorAuthModule { }
