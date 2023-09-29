import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../config/base.service';
import { Token } from '../entities/token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as dotenv from 'dotenv'
import { Cron, CronExpression } from '@nestjs/schedule'
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

dotenv.config()

@Injectable()
export class UserAuthService extends BaseService<Token> {
    constructor(
        @InjectRepository(Token) private readonly tokenRepository: Repository<Token>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService
    ) {
        super(tokenRepository)
    }

    @Cron(CronExpression.EVERY_WEEKEND)
    async deleteToken() {
        return await this.tokenRepository.delete({
            check_valid: false,
            refresh_token: null
        })
    }

    async findUserByPhone(phone: string) {
        return await this.userRepository.findOneBy({ phone: phone })
    }

    async findUserWithId(user_id: string) {
        try {
            return await this.userRepository.findOne({
                relations: { token: true },
                where: { id: user_id }
            })
        } catch (error) {
            throw new NotFoundException("user_not_found")
        }
    }

    async validateUser(phone: string, password: string): Promise<any> {
        const user = await this.findUserByPhone(phone)

        if (!user) {
            throw new NotFoundException("user_not_found")
        }

        if (user && (await this.isMatch(password, user.password)))
            return {
                id: user.id,
                phone: user.phone,
            }
        return null
    }

    async saveRefreshTokenToCookies(refresh: string, res: Response, time: number): Promise<void> {
        const cookieOptions = {
            httpOnly: true,
            expires: this.VNTime(time),
            secure: process.env.NODE_ENV === 'production'
        }

        res.cookie('user_token', refresh, {
            path: '/',
            sameSite: 'none',
            domain: '.healthline.vn',
            httpOnly: cookieOptions.httpOnly,
            expires: cookieOptions.expires,
            secure: cookieOptions.secure
        })
    }

    async saveToken(parent = null, refresh: Token, phone: string): Promise<Token> {
        const user = await this.findUserByPhone(phone)

        refresh.user = user
        refresh.parent = parent
        refresh.expiration_date = this.VNTime(45)

        return await this.tokenRepository.save(refresh)
    }

    async signin(user: User): Promise<any> {
        const payload = {
            phone: user.phone,
            id: user.id
        }

        const accessToken = this.jwtService.sign(payload)
        const refresh = new Token()

        this.saveToken(null, refresh, user.phone)

        return {
            metadata: {
                data: {
                    id: user.id,
                    jwt_token: accessToken
                },
                success: true
            },
            refresh: refresh.refresh_token
        }
    }

    async deleteStolenToken(stolenToken: string): Promise<any> {
        const stolen = await this.tokenRepository.findOne({
            relations: { parent: true },
            where: { refresh_token: stolenToken }
        })

        if (!stolen.parent)
            await this.tokenRepository.delete({ refresh_token: stolen.refresh_token })
        else
            await this.tokenRepository.delete({ refresh_token: stolen.parent.refresh_token })

        return "NEVER TRY AGAIN"
    }

    async refreshTokenInCookies(req: string, res: Response): Promise<any> {
        if (!req) {
            throw new NotFoundException()
        }

        const usedToken = await this.tokenRepository.findOne({
            relations: { user: true, parent: true },
            where: { refresh_token: req }
        })

        if (!usedToken) {
            throw new NotFoundException()
        }

        if (usedToken.check_valid) {
            usedToken.check_valid = false
            await this.tokenRepository.save(usedToken)
        } else {
            await this.saveRefreshTokenToCookies('', res, 0)
            return this.deleteStolenToken(req)
        }

        const user = await this.findUserByPhone(usedToken.user.phone)

        const payload = {
            phone: user.phone,
            id: user.id
        }

        const accessToken = this.jwtService.sign(payload)
        const refresh = new Token()

        const parentToken = usedToken?.parent ? usedToken.parent : usedToken

        await this.saveToken(parentToken, refresh, usedToken.user.phone)

        return {
            metadata: {
                data: {
                    phone: user.phone,
                    jwtToken: accessToken
                },
                success: true
            },
            refresh: refresh.refresh_token
        }
    }
}
