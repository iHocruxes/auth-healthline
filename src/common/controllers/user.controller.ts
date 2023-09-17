import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { SignUpDto } from "../dto/sign-up.dto";
import { User } from "../entities/user.entity";
import { UpdateProfile } from "../dto/update-profile.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Post()
    async signup(@Body() dto: SignUpDto): Promise<any> {
        return await this.userService.signup(dto)
    }

    @ApiBearerAuth()
    @Patch()
    async update(@Body() dto: UpdateProfile): Promise<any> {
        return await this.userService.updateProfile(dto)
    }
}