import { Body, Controller, Delete, Post, Req, Res, UseGuards, NotFoundException } from "@nestjs/common";
import { DoctorAuthGuard } from "../guards/doctor.guard";
import { SignInDto } from "../dto/sign-in.dto";
import { Response } from "express";
import { DoctorAuthService } from "../services/doctor.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";


@ApiTags('DOCTOR AUTH')
@Controller('doctor')
export class DoctorAuthController {
    constructor(
        private readonly authService: DoctorAuthService
    ) { }

    @UseGuards(DoctorAuthGuard)
    @ApiOperation({ summary: 'Đăng nhập dành cho bác sĩ', description: 'Khi đăng nhập thành công sẽ tạo doctor_token ở trên cookies dùng để lấy access_token mới cho bác sĩ (khi access_token cũ hết hạn)' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 401, description: 'Sai thông tin đăng nhập của bác sĩ' })
    @ApiResponse({ status: 404, description: 'Tài khoản không tồn tại' })
    @Post('auth')
    async signin(
        @Req() req,
        @Body() dto: SignInDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<any> {
        const { metadata, refresh } = await this.authService.signin(req.user)
        const expires = 7
        await this.authService.saveRefreshTokenToCookies(refresh, res, expires)

        return metadata
    }

    @ApiOperation({ summary: 'Tạo mới access_token và doctor_token cho bác sĩ khi access_token cũ hết hạn', description: 'Thời gian sống của doctor_token sẽ dài hơn thời gian sống của access_token và doctor_token chỉ xài được duy nhất 1 lần' })
    @ApiResponse({ status: 201, description: 'Tạo mới access_token thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy doctor_token ở trên cookies' })
    @Post('refresh')
    async refresh(
        @Req() req,
        @Res({ passthrough: true }) res: Response
    ) {
        const { metadata, refresh } = await this.authService.refreshTokenInCookies(req.cookies.doctor_token, res)
        const expires = 7

        await this.authService.saveRefreshTokenToCookies(refresh, res, expires)

        return metadata
    }

    @ApiOperation({ summary: 'Đăng xuất', description: 'Set thời gian của doctor_token bằng 0, client sẽ kiểm tra thời gian sống của doctor_token và đăng xuất' })
    @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
    @ApiResponse({ status: 404, description: 'Đã đăng xuất' })
    @Delete('logout')
    async logout(
        @Req() req,
        @Res({ passthrough: true }) res: Response
    ) {
        if (!req.cookies.doctor_token) {
            throw new NotFoundException('logged_out')
        }

        await this.authService.deleteStolenToken(req.cookies.doctor_token)
        await this.authService.saveRefreshTokenToCookies('', res, 0)
        return {
            message: 'Logged out successfully'
        }
    }
}
