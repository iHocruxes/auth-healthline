import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class DoctorAuthGuard extends AuthGuard('doctor') { }