import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Token } from "./token.entity";
import { nanoid } from "nanoid";
import { Role } from "../../config/enum.constants"

@Entity({ name: 'Users' })
export class User {
    constructor() {
        this.id = nanoid()
    }

    @PrimaryColumn()
    id: string

    @Column()
    phone: string

    @Column({ nullable: true })
    email: string

    @Column()
    password: string

    @Column({ name: 'full_name' })
    full_name: string

    @Column({ nullable: true })
    address: string

    @Column({ nullable: true })
    avatar: string

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role

    @Column({ name: 'email_notification', default: false })
    email_notification: boolean

    @OneToMany(() => Token, token => token.user)
    token: Token

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date

    @Column({ type: 'timestamp', name: 'update_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}