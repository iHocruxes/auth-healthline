import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import * as dotenv from 'dotenv'
import { Token } from '../entities/token.entity';
import { AdminAuthService } from '../services/admin.service';
import { AdminStrategy } from '../strategies/admin.strategy';
import { AdminAuthController } from '../controllers/admin.controller';
import { Admin } from '../entities/admin.entity';

dotenv.config()

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'admin' }),
        JwtModule.register({
            global: true,
            secret: process.env.ADMIN_SECRET,
            signOptions: { expiresIn: '4d' }
        }),
        TypeOrmModule.forFeature([Token, Admin]),
    ],
    providers: [
        AdminAuthService,
        AdminStrategy,
    ],
    controllers: [
        AdminAuthController
    ]
})
export class AdminAuthModule { }
