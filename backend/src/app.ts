import express from "express";
import cors from "cors";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { isDevelopment } from "./config/env";
import {
  globalRateLimiter,
  helmetMiddleware,
} from "./config/security";
import {
  httpParameterPollutionProtection,
  sanitizeRequestInput,
  secureHeaders,
} from "./middleware/security";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmetMiddleware);
app.use(secureHeaders);
app.use(cors(corsOptions));
app.use(globalRateLimiter);
app.use(httpParameterPollutionProtection);

if (isDevelopment) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(sanitizeRequestInput);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
