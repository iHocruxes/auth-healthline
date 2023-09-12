import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsMobilePhone } from "class-validator";
import { SignInDto } from "./sign-in.dto";

export class SignUpDto {
    @IsNotEmpty()
    @IsMobilePhone()
    @ApiProperty({ example: '0917068366' })
    phone: string

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'customer' })
    password: string

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'Customer Name' })
    full_name!: string
}