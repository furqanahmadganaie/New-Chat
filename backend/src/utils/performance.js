import {
  functionDuration,
  functionCalls,
} from "../monitoring/functionMetrics.js";

export async function measure(req, operationName, operation) {
  
  // console.log("MEASURE CALLED:", operationName);
  const start = process.hrtime.bigint();

  try {
    const result = await operation();

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000;

    // Prometheus Metrics
    functionDuration.labels(operationName, "SUCCESS").observe(duration / 1000);
    functionCalls.labels(operationName, "SUCCESS").inc();

    // console.log("PROMETHEUS UPDATED:", operationName);
  
    // commenting out the console log for function monitoring to reduce noise in production

    // console.log({
    //   type: "FUNCTION_MONITOR",

    //   requestId: req.requestId,

    //   userId:
    //     req.user?._id?.toString() || "Anonymous",

    //   method: req.method,

    //   route: req.originalUrl,

    //   operation: operationName,

    //   duration: `${duration.toFixed(2)} ms`,

    //   timestamp: new Date().toISOString(),

    //   status: "SUCCESS",
    // });

    return result;
  } catch (error) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000;

    // Prometheus Metrics
    functionDuration.labels(operationName, "FAILED").observe(duration / 1000);
    functionCalls.labels(operationName, "FAILED").inc();

 // commenting out the console log for function monitoring to reduce noise in production
    // console.log({
    //   type: "FUNCTION_MONITOR",

    //   requestId: req.requestId,

    //   userId:
    //     req.user?._id?.toString() || "Anonymous",

    //   method: req.method,

    //   route: req.originalUrl,

    //   operation: operationName,

    //   duration: `${duration.toFixed(2)} ms`,

    //   timestamp: new Date().toISOString(),

    //   status: "FAILED",

    //   error: error.message,
    // });

    throw error;
  }
}