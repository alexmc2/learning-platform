import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // The ?? '' tells TS to use an empty string if env is missing, stopping the error
    url: process.env.DATABASE_URL ?? '',
  },
});
