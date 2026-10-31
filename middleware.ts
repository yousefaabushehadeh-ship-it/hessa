import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Keeps the Supabase session cookie fresh. Does nothing in demo mode.
export async function middleware(request: NextRequest) {
  if (DEMO_MODE) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ["/student/:path*", "/teacher/:path*", "/school/:path*", "/admin/:path*", "/login", "/api/:path*"] };
