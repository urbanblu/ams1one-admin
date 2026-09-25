import AppConstants from "./app_constants";

// NEXT_PUBLIC_* values are inlined at build time, so the reads below must stay
// literal (`process.env.NEXT_PUBLIC_X`) — a dynamic lookup is not inlined.
function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Add it to .env.local (see .env.example) and rebuild.`,
    );
  }

  return value;
}

export default class EnvConstants {
  static readonly PORT = Number(process.env.PORT ?? 3000);
  static readonly APP_ENV =
    process.env.NEXT_PUBLIC_APP_ENV ?? AppConstants.DEVELOPMENT;

  static readonly API_BASE_URL = requireEnv(
    "NEXT_PUBLIC_API_BASE_URL",
    process.env.NEXT_PUBLIC_API_BASE_URL,
  );

  static isDev() {
    return EnvConstants.APP_ENV === AppConstants.DEVELOPMENT;
  }

  static isProd() {
    return EnvConstants.APP_ENV === AppConstants.PRODUCTION;
  }

  static isStage() {
    return EnvConstants.APP_ENV === AppConstants.STAGE;
  }
}
