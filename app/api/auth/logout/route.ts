import { NextResponse } from "next/server";
import { logout } from "@riverpen/auth";

export async function POST(request: Request) {
  await logout();

  return NextResponse.redirect(
    new URL("/signin", request.url),
    { status: 303 }
  );
}
