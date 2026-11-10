import { proxy } from "@riverpen/auth";

export default proxy({
  publicRoutes: ["/signin", "/signup", "/api/auth", "/api/entries", "/api/attachments", "/api/transcription"],
  loginUrl: "/signin"
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
