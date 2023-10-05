import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt'

export abstract class BaseService<T> {
    constructor(protected readonly repository: Repository<T>,
    ) { }

    VNTime(n = 0) {
        const now = new Date()
        const time = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + n,
            now.getUTCHours() + 7,
            now.getUTCMinutes(),
            now.getUTCSeconds(),
            now.getUTCMilliseconds()
        ))
        return time
    }

    async hashing(password: string): Promise<string> {
        const salt = await bcrypt.genSalt()
        const hash = await bcrypt.hash(password, salt)
        return hash
    }

    async isMatch(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash)
    }

}