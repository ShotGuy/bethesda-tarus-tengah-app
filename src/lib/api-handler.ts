import { NextResponse } from "next/server";

import { createResponse } from "@/lib/api-response";
import { AppError, UnauthorizedError } from "@/lib/errors";
import { readSession } from "@/lib/session.server";

type Handler<TParams extends Record<string, unknown> = never> = (
  request: Request,
  ctx: { params: TParams },
) => Promise<NextResponse>;

export const guardAdmin = async () => {
  const session = await readSession();

  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
};

export const withErrorHandling =
  <TParams extends Record<string, unknown> = never>(
    handler: Handler<TParams>,
    { auth = true } = {},
  ) =>
  async (request: Request, ctx: { params: TParams }) => {
    try {
      if (auth) {
        await guardAdmin();
      }

      return await handler(request, ctx);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : "";
      
      // eslint-disable-next-line no-console
      console.error(`[API Error] ${errorMessage}`, errorStack);

      if (error instanceof AppError) {
        return NextResponse.json(
          createResponse(false, null, error.message, error.details),
          { status: error.status },
        );
      }

      // Include error details in development
      const isDev = process.env.NODE_ENV === "development";
      const details = isDev ? { originalError: errorMessage } : undefined;

      return NextResponse.json(
        createResponse(false, null, `Internal server error: ${errorMessage}`, details),
        { status: 500 },
      );
    }
  };

