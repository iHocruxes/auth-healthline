import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from "typeorm";
import { nanoid } from "nanoid";
import { Token } from "./token.entity";

@Entity({ name: 'Admins' })
export class Admin {
    constructor() {
        this.id = nanoid()
    }

    @PrimaryColumn()
    id: string

    @Column()
    username: string

    @Column()
    password: string

    @Column({ nullable: true })
    email: string

    @OneToMany(() => Token, token => token.admin)
    token: Token

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date
}