import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from "typeorm";
import { nanoid } from "nanoid";
import { Specialty } from "../../config/enum.constants";
import { Min } from "class-validator";
import { Token } from "./token.entity";

@Entity({ name: 'Doctors' })
export class Doctor {
    constructor() {
        this.id = nanoid()
    }

    @PrimaryColumn()
    id: string

    @Column()
    phone: string

    @Column()
    password: string

    @Column({ nullable: true })
    email: string

    @Column({ default: true })
    isActive: boolean

    @Column({ name: 'full_name' })
    full_name: string

    @Column({ nullable: true })
    avatar: string

    @Column({ nullable: true })
    biography: string

    @Column({ type: 'enum', enum: Specialty })
    specialty: string

    @Column({ name: 'account_balance', default: 0 })
    @Min(0)
    accout_balance: number

    @Column()
    experience: number

    @Column({ name: 'fee_per_minutes', default: 0 })
    @Min(0)
    fee_per_minutes: number

    @Column({ name: 'fixed_times', nullable: true })
    fixed_times: string

    @OneToMany(() => Token, token => token.doctor)
    token: Token

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date

    @Column({ type: 'timestamp', name: 'update_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}