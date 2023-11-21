import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local"
import { AdminAuthService } from "../services/admin.service";

@Injectable()
export class AdminStrategy extends PassportStrategy(Strategy, 'admin') {
    constructor(private readonly authService: AdminAuthService) {
        super({ usernameField: 'username' })
    }

    async validate(phone: string, password: string) {
        const doctor = await this.authService.validateAdmin(phone, password)
        if (!doctor)
            throw new UnauthorizedException("unauthorized")
        return doctor
    }
}