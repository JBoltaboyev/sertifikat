import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextRequest } from "next/server";

const handler = async (req: NextRequest, ctx: any) => {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host && !host.includes("localhost")) {
    process.env.NEXTAUTH_URL = `${proto}://${host}`;
  }
  return (NextAuth as any)(req, ctx, authOptions);
};

export { handler as GET, handler as POST };
