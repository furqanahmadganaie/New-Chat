
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);


import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js'
import { connectDB } from './lib/db.js';
import { app,server} from "./lib/socket.js";
import { env } from "./config/env.js";
import monitoringMiddleware from "./middleware/monitoring.Middleware.js";
import { getApplicationMetrics } from "./monitoring/applicationMetrics.js";
import applicationMetricsRoutes from "./routes/applicationMetrics.route.js";
import metricsRoutes from "./routes/metrics.route.js";
import prometheusRoutes from "./routes/prometheus.route.js";
import logger from "./config/logger.js";
import httpLogger from "./middleware/logger.middleware.js";
import requestId from "./middleware/requestId.middleware.js";

const PORT = env.port;
app.use(requestId);
app.use(httpLogger);
app.use(express.json({limit:"10mb"})); 
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser()); 


app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
// Monitoring
app.use(monitoringMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/messages",messageRoutes);
app.use("/application-metrics", applicationMetricsRoutes);
app.use("/metrics", metricsRoutes);
app.use("/prometheus", prometheusRoutes);

connectDB()
  .then(() => {
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the existing backend process before starting another one.`
        );
        process.exit(1);
      }

      throw error;
    });

    server.listen(PORT, () => {

      // console.log(`server running on ${PORT}`);

      logger.info(`Server running on ${PORT}`);

  // console.log(getApplicationMetrics());  now we see those matrics on http://localhost:4000/application-metrics in json form 
  //http://localhost:4000/metrics and on this 


  // setInterval(() => {
  //   console.clear(); // Optional
  //   console.log(getApplicationMetrics());
  // }, 3000);
    });   //this will print the application metrics after every 3 second so it no good approch 
    
  })
  .catch((error) => {
    logger.error("Failed to start server:", error.message);
    process.exit(1);
  });
