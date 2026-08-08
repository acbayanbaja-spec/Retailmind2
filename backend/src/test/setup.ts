process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??=
  "postgresql://test:test@localhost:5432/retailmind_test?schema=public";
process.env.JWT_SECRET ??= "test-jwt-secret-min-32-characters-long!!";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-min-32-chars!!";
process.env.CORS_ORIGIN ??= "http://localhost:3000";
