import { IsBoolean } from "class-validator";
import { SignUpDto } from "./sign-up.dto";

export class UpdateProfile extends SignUpDto {
    @IsBoolean()
    email_notification: boolean
}