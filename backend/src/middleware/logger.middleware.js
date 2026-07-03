import pinoHttp from "pino-http";
import logger from "../config/logger.js";

const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.method === "OPTIONS",
  },

  serializers: {
   req(req) {
  return {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
  };
},


    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export default httpLogger;