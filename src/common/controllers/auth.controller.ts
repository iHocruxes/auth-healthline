import { Body, Controller, Delete, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { LocalAuthGuard } from "../guards/local.guard";
import { SignInDto } from "../dto/sign-in.dto";
import { Response } from "express";

@Controller()
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @UseGuards(LocalAuthGuard)
    @Post('auth')
    async signin(
        @Req() req,
        @Body() dto: SignInDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<any> {
        const { metadata, refresh } = await this.authService.signin(req.user)
        const expires = 45
        await this.authService.saveRefreshTokenToCookies(refresh, res, expires)

        return metadata
    }

    @Post('refresh')
    async refresh(
        @Req() req,
        @Res({ passthrough: true }) res: Response
    ) {
        const { metadata, refresh } = await this.authService.refreshTokenInCookies(req.cookies.refresh_token, res)
        const expires = 45 //day

        await this.authService.saveRefreshTokenToCookies(refresh, res, expires)

        return metadata
    }

    @Delete('auth/logout')
    async logout(
        @Req() req,
        @Res({ passthrough: true }) res: Response
    ) {
        await this.authService.deleteStolenToken(req.cookies.refresh_token)
        await this.authService.saveRefreshTokenToCookies('', res, 0)
        return {
            message: 'Logged out successfully'
        }
    }
}