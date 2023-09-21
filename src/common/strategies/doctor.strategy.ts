import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local"
import { DoctorAuthService } from "../services/doctor.service";

@Injectable()
export class DoctorStrategy extends PassportStrategy(Strategy, 'doctor') {
    constructor(private readonly authService: DoctorAuthService) {
        super({ usernameField: 'phone' })
    }

    async validate(phone: string, password: string) {
        const doctor = await this.authService.validateDoctor(phone, password)
        if (!doctor)
            throw new UnauthorizedException()
        return doctor
    }
}