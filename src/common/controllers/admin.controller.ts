import { Body, Controller, Delete, Post, Req, Res, UseGuards, NotFoundException } from "@nestjs/common";
import { AdminDto, SignInDto } from "../dto/sign-in.dto";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AdminAuthService } from "../services/admin.service";
import { AdminAuthGuard } from "../guards/admin.guard";


@ApiTags('ADMIN AUTH')
@Controller('admin')
export class AdminAuthController {
    constructor(
        private readonly authService: AdminAuthService
    ) { }

    // @Post()
    // async signup(
    //     @Body() dto: AdminDto
    // ) {
    //     return await this.authService.signupAdmin(dto.username, dto.password)
    // }

    @UseGuards(AdminAuthGuard)
    @ApiOperation({ summary: 'Đăng nhập dành cho admin', description: 'Khi đăng nhập thành công sẽ tạo admin_token ở trên cookies dùng để lấy access_token mới cho admin (khi access_token cũ hết hạn)' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 401, description: 'Sai thông tin đăng nhập của bác sĩ' })
    @ApiResponse({ status: 404, description: 'Tài khoản không tồn tại' })
    @Post('auth')
    async signin(
        @Req() req,
        @Body() dto: AdminDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<any> {
        const { metadata, refresh } = await this.authService.signin(req.user)
        const expires = 7
        await this.authService.saveRefreshTokenToCookies(refresh, res, expires)

        return metadata
    }

    @ApiOperation({ summary: 'Tạo mới access_token và adminT-oken cho admin khi access_token cũ hết hạn', description: 'Thời gian sống của admin_token sẽ dài hơn thời gian sống của access_token và admin_token chỉ xài được duy nhất 1 lần' })
    @ApiResponse({ status: 201, description: 'Tạo mới admin_token thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy admin_token ở trên cookies' })
    @Post('refresh')
    async refresh(
        @Req() req,
        @Res({ passthrough: true }) res: Response
    ) {
        const { metadata, refresh } = await this.authService.refreshTokenInCookies(req.cookies.admin_token, res)
        const expires = 7

        await this.authService.saveRefreshTokenToCookies(refresh, res, expires)

        return metadata
    }

    @ApiOperation({ summary: 'Đăng xuất', description: 'Set thời gian của admin_token bằng 0, client sẽ kiểm tra thời gian sống của admin_token và đăng xuất' })
    @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
    @ApiResponse({ status: 404, description: 'Đã đăng xuất' })
    @Delete('logout')
    async logout(
        @Req() req,
        @Res({ passthrough: true }) res: Response
    ) {
        if (!req.cookies.admin_token) {
            throw new NotFoundException('logged_out')
        }

        await this.authService.deleteStolenToken(req.cookies.admin_token)
        await this.authService.saveRefreshTokenToCookies('', res, 0)
        return {
            message: 'Logged out successfully'
        }
    }
}
