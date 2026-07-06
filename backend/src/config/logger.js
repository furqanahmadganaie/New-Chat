import pino from "pino";
const transport = pino.transport({
  targets: [
    // Terminal (Pretty Logs)
    {
      target: "pino-pretty",
      level: process.env.LOG_LEVEL || "info",
      options: {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
      },
    },

    // File (JSON Logs)
    {
      target: "pino/file",
      level: process.env.LOG_LEVEL || "info",
      options: {
        destination: "./logs/backend.log",
        mkdir: true,
      },
    },
  ],
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",

    base: {
      service: "pingme-backend",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    },
  },
  transport
);

export default logger;