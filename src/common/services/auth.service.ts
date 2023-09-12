import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../config/base.service';
import { Token } from '../entities/token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { Response } from 'express';
import * as dotenv from 'dotenv'
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

dotenv.config()

@Injectable()
export class AuthService extends BaseService<Token> {
    constructor(
        @InjectRepository(Token) private readonly tokenRepository: Repository<Token>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) {
        super(tokenRepository)
    }

    async validateUser(phone: string, password: string): Promise<any> {
        const user = await this.userService.findUserByPhone(phone)
        if (user && (await this.isMatch(password, user.password)))
            return {
                id: user.id,
                phone: user.phone,
                role: user.role
            }
        return null
    }

    async saveRefreshTokenToCookies(refresh: string, res: Response, time: number): Promise<void> {
        const cookieOptions = {
            httpOnly: true,
            expires: this.VNTime(time),
            secure: process.env.NODE_ENV === 'production'
        }

        res.cookie('refresh_token', refresh, {
            path: '/',
            sameSite: 'none',
            domain: '.healthline.vn',
            httpOnly: cookieOptions.httpOnly,
            expires: cookieOptions.expires,
            secure: cookieOptions.secure
        })
    }

    async saveToken(parent = null, accessToken: string, refresh: Token, phone: string): Promise<Token> {
        const user = await this.userService.findUserByPhone(phone)

        refresh.user = user
        refresh.access_token = accessToken
        refresh.parent = parent
        refresh.expiration_date = this.VNTime(45)

        return await this.tokenRepository.save(refresh)
    }

    async signin(user: User): Promise<any> {
        const payload = {
            phone: user.phone,
            sub: {
                name: user.full_name
            }
        }

        const accessToken = this.jwtService.sign(payload)
        const refresh = new Token()

        this.saveToken(null, accessToken, refresh, user.phone)

        return {
            metadata: {
                data: {
                    id: user.id,
                    full_name: user.full_name,
                    role: user.role,
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

        const user = await this.userService.findUserByPhone(usedToken.user.phone)

        const payload = {
            phone: user.phone,
            sub: {
                name: user.full_name
            }
        }

        const accessToken = this.jwtService.sign(payload)
        const refresh = new Token()

        const parentToken = usedToken?.parent ? usedToken.parent : usedToken

        await this.saveToken(parentToken, accessToken, refresh, usedToken.user.phone)

        return {
            metadata: {
                data: {
                    phone: user.phone,
                    full_name: user.full_name,
                    role: user.role,
                    jwtToken: accessToken
                },
                success: true
            },
            refresh: refresh.refresh_token
        }
    }
}
