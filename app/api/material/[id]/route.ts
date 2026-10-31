import { NextResponse, type NextRequest } from "next/server";
import { DEMO_MODE } from "@/lib/env";
import { findLesson, getMySubscriptions } from "@/lib/data";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { samplePdf, stampPdf } from "@/lib/watermark";

// Serves a lesson PDF after checking access, stamped with the viewer's number and account id.
// ?dl=1 downloads it; otherwise it opens in the page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return new NextResponse("Sign in first", { status: 401 });
  const { id } = await params;
  const found = await findLesson(id);
  if (!found || !["pdf", "worksheet"].includes(found.lesson.type)) return new NextResponse("Not found", { status: 404 });
  const { teacher, lesson, storagePath } = found;

  const own = s.role === "teacher" && s.teacherId === teacher.id;
  let allowed = own || s.role === "admin";
  if (!allowed && s.role === "student" && s.consent !== "pending")
    allowed = lesson.isFree || (await getMySubscriptions(s.userId)).some((x) => x.teacherId === teacher.id);
  if (!allowed) return new NextResponse("Subscribers only", { status: 403 });

  let bytes: Uint8Array;
  let phone = "";
  if (DEMO_MODE) bytes = await samplePdf(lesson.title);
  else {
    if (!storagePath) return new NextResponse("No file yet", { status: 404 });
    const db = supabaseAdmin();
    const { data, error } = await db.storage.from("materials").download(storagePath);
    if (error || !data) return new NextResponse("File unavailable", { status: 502 });
    bytes = new Uint8Array(await data.arrayBuffer());
    const { data: p } = await db.from("profiles").select("phone").eq("id", s.userId).maybeSingle();
    phone = p?.phone ? `+${String(p.phone).replace(/^\+/, "")}` : "";
  }

  const mark = `Hessa · ${phone || "demo"} · ${s.userId.slice(0, 8)} · ${new Date().toISOString().slice(0, 10)}`;
  let out: Uint8Array;
  try {
    out = await stampPdf(bytes, mark);
  } catch {
    // A PDF pdf-lib can't open (damaged or unusual) is still served, so the lesson doesn't break.
    out = bytes;
  }
  const name = `hessa-${lesson.id.slice(0, 8)}.pdf`;
  const dl = req.nextUrl.searchParams.get("dl") === "1";
  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${dl ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
