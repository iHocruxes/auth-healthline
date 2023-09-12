import * as dotenv from 'dotenv'

dotenv.config()

let extraOptions = {}
if (process.env.NODE_ENV !== "development") {
    extraOptions = {
        ssl: {
            rejectUnauthorized: false,
        },
    };
}

export const postgresOption: any = {
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: (process.env.NODE_ENV === "development") ? null : true,
    extra: extraOptions,
    synchronize: process.env.NODE_ENV !== "production"
}