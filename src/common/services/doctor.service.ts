import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../config/base.service';
import { Token } from '../entities/token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as dotenv from 'dotenv'
import { JwtService } from '@nestjs/jwt';
import { Doctor } from '../entities/doctor.entity';

dotenv.config()

@Injectable()
export class DoctorAuthService extends BaseService<Token> {
    constructor(
        @InjectRepository(Token) private readonly tokenRepository: Repository<Token>,
        @InjectRepository(Doctor) private readonly doctorRepository: Repository<Doctor>,
        private readonly jwtService: JwtService
    ) {
        super(tokenRepository)
    }

    async findDoctorByPhone(phone: string): Promise<Doctor> {
        const doctor = await this.doctorRepository.findOneBy({ phone: phone })
        if (!doctor)
            throw new NotFoundException('doctor_not_found')

        return doctor
    }

    async validateDoctor(phone: string, password: string): Promise<any> {
        const doctor = await this.findDoctorByPhone(phone)

        if (!doctor) {
            throw new NotFoundException("doctor_not_found")
        }

        if (doctor && (await this.isMatch(password, doctor.password)))
            return {
                id: doctor.id,
                phone: doctor.phone,
            }
        return null
    }

    async saveRefreshTokenToCookies(refresh: string, res: Response, time: number): Promise<void> {
        const cookieOptions = {
            httpOnly: true,
            expires: this.VNTime(time),
            secure: process.env.NODE_ENV === 'production'
        }

        res.cookie('doctor_token', refresh, {
            path: '/',
            sameSite: 'none',
            domain: '.healthline.vn',
            httpOnly: cookieOptions.httpOnly,
            expires: cookieOptions.expires,
            secure: cookieOptions.secure
        })
    }

    async saveToken(parent = null, refresh: Token, phone: string): Promise<Token> {
        const doctor = await this.findDoctorByPhone(phone)

        refresh.doctor = doctor
        refresh.parent = parent

        return await this.tokenRepository.save(refresh)
    }

    async signin(doctor: Doctor): Promise<any> {
        const payload = {
            phone: doctor.phone,
            id: doctor.id
        }

        const accessToken = this.jwtService.sign(payload)
        const refresh = new Token()

        this.saveToken(null, refresh, doctor.phone)

        return {
            metadata: {
                data: {
                    id: doctor.id,
                    full_name: doctor.full_name,
                    jwt_token: accessToken
                },
            },
            refresh: refresh.refresh_token
        }
    }

    async deleteStolenToken(stolenToken: string): Promise<any> {
        const stolen = await this.tokenRepository.findOne({
            relations: { parent: true },
            where: { refresh_token: stolenToken }
        })
        if (!stolen)
            throw new NotFoundException('logged_out')


        if (!stolen.parent)
            await this.tokenRepository.delete({ refresh_token: stolen.refresh_token })
        else
            await this.tokenRepository.delete({ refresh_token: stolen.parent.refresh_token })

        return {
            message: "NEVER TRY AGAIN"
        }
    }

    async refreshTokenInCookies(req: string, res: Response): Promise<any> {
        if (!req) {
            throw new NotFoundException('doctor_token_not_found')
        }

        const usedToken = await this.tokenRepository.findOne({
            relations: { doctor: true, parent: true },
            where: { refresh_token: req }
        })

        if (!usedToken) {
            throw new NotFoundException('used_token_not_found')
        }

        if (usedToken.check_valid) {
            usedToken.check_valid = false
            await this.tokenRepository.save(usedToken)
        } else {
            await this.saveRefreshTokenToCookies('', res, 0)
            return this.deleteStolenToken(req)
        }

        const doctor = await this.findDoctorByPhone(usedToken.doctor.phone)

        const payload = {
            phone: doctor.phone,
            id: doctor.id
        }

        const accessToken = this.jwtService.sign(payload)
        const refresh = new Token()

        const parentToken = usedToken?.parent ? usedToken.parent : usedToken

        await this.saveToken(parentToken, refresh, usedToken.doctor.phone)

        return {
            metadata: {
                data: {
                    phone: doctor.phone,
                    jwtToken: accessToken
                },
            },
            refresh: refresh.refresh_token
        }
    }
}
