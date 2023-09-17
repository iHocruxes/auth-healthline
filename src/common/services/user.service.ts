import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "../../config/base.service";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { SignUpDto } from "../dto/sign-up.dto";
import { UpdateProfile } from "../dto/update-profile.dto";

@Injectable()
export class UserService extends BaseService<User>{
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) {
        super(userRepository)
    }

    async signup(dto: SignUpDto): Promise<any> {
        const check = await this.findUserByPhone(dto.phone)

        if (check)
            throw new ConflictException('Số điện thoại đã được đăng kí')

        const user = new User()
        user.full_name = dto.full_name
        user.phone = dto.phone
        user.password = await this.hashing(dto.password)
        user.created_at = this.VNTime()
        user.updated_at = user.created_at

        await this.userRepository.save(user)

        return {
            data: {
                full_name: user.full_name,
                phone: user.phone,
                notification: user.email_notification
            },
            role: user.role
        }
    }

    async updateProfile(dto: UpdateProfile): Promise<any> {
        const user = await this.findUserByPhone(dto.phone)

        user.full_name = dto.full_name
        user.email_notification = dto.email_notification

        await this.userRepository.save(user)

        return {
            data: {
                full_name: user.full_name,
                email_notification: user.email_notification
            },
            role: user.role
        }
    }

    async findUserByPhone(phone: string) {
        return await this.userRepository.findOneBy({ phone: phone })
    }

    async findUserWithId(user_id: string) {
        try {
            return await this.userRepository.findOne({
                relations: { token: true },
                where: { id: user_id }
            })
        } catch (error) {
            throw new NotFoundException()
        }
    }

    // async findUserInRange(start: number, end: number) {
    //     return await this.userRepository.find({
    //         select: ["phone", "full_name", "role", "email_notification"],
    //         order: { updated_at: 'DESC' },
    //         skip: start - 1,
    //         take: end - start + 1
    //     })
    // }
}