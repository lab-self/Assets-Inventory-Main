import pino, { type LoggerOptions } from "pino";
import { env } from "../config/env.js";

export const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL,

  ...(env.LOG_FORMAT === "pretty"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            singleLine: false,
          },
        },
      }
    : {}),
};

export const logger = pino(loggerOptions);