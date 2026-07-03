import crypto from "crypto";
import os from "os";

import { env } from "../config/env.js";
import { updateMetrics, getMetrics } from "../monitoring/metricsManager.js";
import { incrementRequestCounter } from "../monitoring/applicationMetrics.js";
import { httpErrorsTotal,httpRequestDuration,httpRequestsTotal } from "../monitoring/prometheus.js";

const monitoringMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  // Unique request ID
  req.requestId = crypto.randomUUID();

  // Request Size
  const requestSize = req.headers["content-length"] || 0;

  res.on("finish", () => {
    const end = process.hrtime.bigint();

    const duration = Number(end - start) / 1_000_000;

    // Better route name
   const route =
  req.baseUrl + (req.route?.path || req.path);
    

    // Routes to ignore
const ignoredRoutes = [
  "/metrics",
  "/application-metrics",
  "/favicon.ico",
];

// Ignore monitoring and browser-generated requests
const isMonitoringRoute =
  ignoredRoutes.includes(route) ||
  route.startsWith("/.well-known/");

//custom monitoring 
    if (!isMonitoringRoute) {
      updateMetrics(
        `${req.method} ${route}`,
        res.statusCode,
        duration
      );

      incrementRequestCounter();

      // prometheus metrics 
       // Total HTTP Requests
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status: res.statusCode,
      });

      // Total HTTP Errors
      if (res.statusCode >= 400) {
        httpErrorsTotal.inc({
          method: req.method,
          route,
          status: res.statusCode,
        });
      }

      // HTTP Response Time Histogram
      httpRequestDuration.observe(
        {
          method: req.method,
          route,
          status: res.statusCode,
        },
        duration / 1000 // Histogram expects seconds
      );
      

      // if (env.nodeEnv === "development") {
      //   console.log("\n========== API METRICS ==========");
      //   console.table(getMetrics());
      // }
    }

    const responseSize =
      res.getHeader("content-length") || 0;

    const userId =
      req.user?._id ||
      req.user?.id ||
      "Anonymous";

    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    const userAgent =
      req.headers["user-agent"];

    const serverName = os.hostname();
    
   // committted the api monitoring 
    // console.log({
    //   timestamp: new Date().toISOString(),

    //   requestId: req.requestId,

    //   method: req.method,

    //   route,

    //   status: res.statusCode,

    //   duration: `${duration.toFixed(2)} ms`,

    //   ip,

    //   userId,

    //   requestSize: `${requestSize} Bytes`,

    //   responseSize: `${responseSize} Bytes`,

    //   userAgent,

    //   environment: env.nodeEnv,

    //   serverName,
    // });
  });

  next();
};

export default monitoringMiddleware;