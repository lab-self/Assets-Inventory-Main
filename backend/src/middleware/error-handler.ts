import type {
  FastifyError,
  FastifyReply,
  FastifyRequest
} from "fastify";
import { ZodError } from "zod";
import {
  isAppError
} from "../utils/errors.js";
import {
  logger
} from "../utils/logger.js";

export async function errorHandler(
  error: FastifyError | unknown,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (error instanceof ZodError) {
    await reply.status(400).send({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Request validation failed.",
        details: error.issues.map(
          (issue) => ({
            path: issue.path,
            message: issue.message
          })
        )
      }
    });

    return;
  }

  if (isAppError(error)) {
    logger.warn(
      {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: request.id,
        method: request.method,
        url: request.url
      },
      "Application error"
    );

    await reply
      .status(error.statusCode)
      .send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined
            ? {
                details: error.details
              }
            : {})
        }
      });

    return;
  }

  const fastifyError =
    error as FastifyError;

  if (
    fastifyError?.code ===
    "FST_ERR_CTP_INVALID_JSON_BODY"
  ) {
    await reply.status(400).send({
      success: false,
      error: {
        code: "INVALID_JSON",
        message:
          "The request body contains invalid JSON."
      }
    });

    return;
  }

  logger.error(
    {
      error,
      requestId: request.id,
      method: request.method,
      url: request.url,
      ip: request.ip
    },
    "Unhandled application error"
  );

  if (reply.sent) {
    return;
  }

  const statusCode =
    typeof fastifyError?.statusCode ===
    "number" &&
    fastifyError.statusCode >= 400 &&
    fastifyError.statusCode < 500
      ? fastifyError.statusCode
      : 500;

  await reply
    .status(statusCode)
    .send({
      success: false,
      error: {
        code:
          statusCode >= 500
            ? "INTERNAL_SERVER_ERROR"
            : "REQUEST_ERROR",
        message:
          statusCode >= 500
            ? "An internal server error occurred."
            : fastifyError.message ||
              "The request could not be processed."
      }
    });
}