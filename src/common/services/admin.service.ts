import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../config/base.service';
import { Token } from '../entities/token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as dotenv from 'dotenv'
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../entities/admin.entity';

dotenv.config()

@Injectable()
export class AdminAuthService extends BaseService<Token> {
    constructor(
        @InjectRepository(Token) private readonly tokenRepository: Repository<Token>,
        @InjectRepository(Admin) private readonly adminRepository: Repository<Admin>,
        private readonly jwtService: JwtService
    ) {
        super(tokenRepository)
    }

    async findAdminByUsername(username: string): Promise<Admin> {
        const admin = await this.adminRepository.findOneBy({ username: username })
        if (!admin)
            throw new NotFoundException('admin_not_found')

        return admin
    }

    async validateAdmin(username: string, password: string): Promise<any> {
        const admin = await this.findAdminByUsername(username)

        if (!admin) {
            throw new NotFoundException("admin_not_found")
        }

        if (admin && (await this.isMatch(password, admin.password)))
            return {
                id: admin.id,
                username: admin.username,
            }
        return null
    }

    async saveRefreshTokenToCookies(refresh: string, res: Response, time: number): Promise<void> {
        const cookieOptions = {
            httpOnly: true,
            expires: this.VNTime(time),
            secure: process.env.NODE_ENV === 'production'
        }

        res.cookie('admin_token', refresh, {
            path: '/',
            sameSite: 'none',
            domain: '.admin.healthline.vn',
            httpOnly: cookieOptions.httpOnly,
            expires: cookieOptions.expires,
            secure: cookieOptions.secure
        })
    }

    async saveToken(parent = null, refresh: Token, username: string): Promise<Token> {
        const admin = await this.findAdminByUsername(username)

        refresh.admin = admin
        refresh.parent = parent

        return await this.tokenRepository.save(refresh)
    }

    async signin(admin: Admin): Promise<any> {
        const payload = {
            username: admin.username,
            id: admin.id
        }

        const accessToken = this.jwtService.sign(payload)
        const refresh = new Token()

        this.saveToken(null, refresh, admin.username)

        return {
            metadata: {
                data: {
                    id: admin.id,
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
            throw new NotFoundException('admin_token_not_found')
        }

        const usedToken = await this.tokenRepository.findOne({
            relations: { admin: true, parent: true },
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

        const admin = await this.findAdminByUsername(usedToken.admin.username)

        const payload = {
            username: admin.username,
            id: admin.id
        }

        const accessToken = this.jwtService.sign(payload)
        const refresh = new Token()

        const parentToken = usedToken?.parent ? usedToken.parent : usedToken

        await this.saveToken(parentToken, refresh, usedToken.admin.username)

        return {
            metadata: {
                data: {
                    username: admin.username,
                    jwtToken: accessToken
                },
            },
            refresh: refresh.refresh_token
        }
    }

    async signupAdmin(username: string, password: string) {
        const check = await this.adminRepository.findOne({
            where: { username: username }
        })

        if (check)
            throw new ConflictException('admin_found')

        const admin = new Admin()
        admin.username = username
        admin.password = await this.hashing(password)
        admin.created_at = this.VNTime()

        await this.adminRepository.save(admin)

        return {
            data: {
                id: admin.id,
                username: admin.username,
            },
            message: 'successfully'
        }
    }
}
