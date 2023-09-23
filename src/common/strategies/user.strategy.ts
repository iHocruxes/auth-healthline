import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local"
import { UserAuthService } from "../services/user.service";

@Injectable()
export class UserStrategy extends PassportStrategy(Strategy, 'user') {
    constructor(private readonly authService: UserAuthService) {
        super({ usernameField: 'phone' })
    }

    async validate(phone: string, password: string) {
        const user = await this.authService.validateUser(phone, password)
        if (!user)
            throw new UnauthorizedException("unauthrorized")
        return user
    }
}