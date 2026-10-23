import 'dotenv/config';
import type { Knex } from "knex";

const toCamelCase = (str: string): string => {
  return str.replace(/(_\w)/g, (match) => match[1].toUpperCase());
};

const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const dbConfig: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST ?? "localhost",
      ssl: false,
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "example",
      database: process.env.DB_NAME ?? "seetickets",
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./database/migrations",
    },
    seeds: {
      directory: "./database/seeds",
    },
    wrapIdentifier: (value: string, origImpl: (value: string) => string) => {
      return origImpl(toSnakeCase(value));
    },
    postProcessResponse: (result: any) => {
      if (Array.isArray(result)) {
        return result.map((row) => {
          const newRow: Record<string, any> = {};
          for (const key of Object.keys(row)) {
            newRow[toCamelCase(key)] = row[key];
          }
          return newRow;
        });
      }
      const newResult: Record<string, any> = {};
      for (const key of Object.keys(result)) {
        newResult[toCamelCase(key)] = result[key];
      }
      return newResult;
    },
  },
};

module.exports = dbConfig;

export default dbConfig;
