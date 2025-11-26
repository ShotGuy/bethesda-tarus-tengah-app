import { NextResponse } from "next/server";
import { z } from "zod";

import { createResponse } from "@/lib/api-response";
import { attachSessionCookie, createSession } from "@/lib/session.server";

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
});

export const POST = async (request: Request) => {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      createResponse(false, null, "Invalid credentials", {
        username: errors.username?.[0] ?? "",
        password: errors.password?.[0] ?? "",
      }),
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me";

  if (username !== adminUsername || password !== adminPassword) {
    return NextResponse.json(
      createResponse(false, null, "Username atau password salah"),
      { status: 401 },
    );
  }

  const { token, expires } = await createSession(username);
  await attachSessionCookie(token, expires);

  return NextResponse.json(
    createResponse(true, { username }, "Login berhasil"),
  );
};

