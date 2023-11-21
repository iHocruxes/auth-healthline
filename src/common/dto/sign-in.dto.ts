import { ApiProperty } from "@nestjs/swagger";
import { IsMobilePhone, IsNotEmpty, IsString } from "class-validator";

export class SignInDto {
    @IsNotEmpty()
    @IsMobilePhone()
    @ApiProperty({ example: '+84917068366' })
    phone: string

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'Healthline@123' })
    password: string
}

export class AdminDto {
    @IsString()
    username: string

    @IsString()
    password: string
}