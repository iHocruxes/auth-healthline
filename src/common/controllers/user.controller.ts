import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { SignUpDto } from "../dto/sign-up.dto";
import { User } from "../entities/user.entity";
import { UpdateProfile } from "../dto/update-profile.dto";

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) { }

    @Post()
    async signup(@Body() dto: SignUpDto): Promise<any> {
        return await this.userService.signup(dto)
    }

    @Patch()
    async update(@Body() dto: UpdateProfile): Promise<any> {
        return await this.userService.updateProfile(dto)
    }

    @Post('/:start/to/:end')
    async findUserInRange(
        @Param('start') start: number,
        @Param('end') end: number
    ): Promise<any> {
        return await this.userService.findUserInRange(start, end)
    }
}