import { MELI_ERROR_MESSAGES, type MeliErrorCode } from "./types";

export class MeliError extends Error {
  constructor(
    public readonly code: MeliErrorCode,
    message: string = MELI_ERROR_MESSAGES[code],
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MeliError";
  }

  /** Código HTTP con el que respondemos al cliente. */
  get httpStatus(): number {
    switch (this.code) {
      case "NOT_CONFIGURED":
      case "NOT_CONNECTED":
      case "UNAUTHORIZED":
        return 401;
      case "FORBIDDEN":
        return 403;
      case "NOT_FOUND":
        return 404;
      case "RATE_LIMIT":
        return 429;
      case "INVALID_INPUT":
        return 400;
      default:
        return 502;
    }
  }

  toBody() {
    return { error: { code: this.code, message: this.message } };
  }
}

export function statusToMeliCode(status: number, hasToken: boolean): MeliErrorCode {
  if (status === 401) return hasToken ? "UNAUTHORIZED" : "NOT_CONNECTED";
  if (status === 403) return hasToken ? "FORBIDDEN" : "NOT_CONNECTED";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMIT";
  return "UNKNOWN";
}
