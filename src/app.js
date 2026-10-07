const express = require("express");
const cookieParser = require("cookie-parser");
const ApiError = require("./utils/apiError");
const ApiResponse = require("./utils/apiResponse");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// CORS & Security Headers Middleware (Supports Cookies & Idempotency-Key)
app.use((req, res, next) => {
  const allowedOrigin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Idempotency-Key"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Health Check Endpoint
app.get("/health", (req, res) => {
  return ApiResponse.success(
    res,
    {
      status: "OK",
      service: "Banking Backend API",
      timestamp: new Date().toISOString()
    },
    "Banking API is healthy and operational"
  );
});

// API v1 Routes
const apiRoutes = require("./routes");
app.use("/api/v1", apiRoutes);

// 404 Not Found Handler for Unmatched Routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// Centralized Global Error Handling Boundary
app.use(errorHandler);

module.exports = app;
