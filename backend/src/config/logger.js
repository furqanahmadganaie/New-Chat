import pino from "pino";

const logger = pino({
  level: "info",
// transport where logs should go  terminal  or loki  or file or cloud  and are pretty logs 
//   transport: {
//     target: "pino-pretty",  // terminal
 
//     options: {
//       colorize: true,
//       translateTime: "yyyy-mm-dd HH:MM:ss",
//       ignore: "pid,hostname"
//     }
//   },
 // strucutured logs 
 base: {
    service: "pingme-backend",
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0"
  }
});

export default logger;