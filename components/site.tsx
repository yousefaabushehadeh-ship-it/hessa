import Link from "next/link";
import { DEMO_MODE } from "@/lib/env";
import { getSession } from "@/lib/session";

export async function SiteNav({ active }: { active?: "browse" }) {
  const s = await getSession();
  const home = s?.role === "teacher" ? "/teacher" : "/student";
  return (
    <>
      {DEMO_MODE && (
        <div className="demo gut">
          <div className="wrap">
            <span className="tag">نسخة تجريبية ببيانات نموذجية. كود الدخول لأي رقم: 482913</span>
          </div>
        </div>
      )}
      <header className="nav gut">
        <div className="wrap">
          <Link href="/" className="logo" aria-label="حِصّة، الصفحة الرئيسية">
            <span className="mk">ح</span>حِصّة
          </Link>
          <nav className="nav-links">
            <Link href="/teachers" className={active === "browse" ? "on" : ""}>
              الأساتذة
            </Link>
            <Link href="/#how">كيف بتشتغل</Link>
            <Link href="/#teachers-band">للأساتذة</Link>
          </nav>
          <span className="sp" />
          {s ? (
            <Link href={home} className="btn btn-pri btn-sm">
              حسابي
            </Link>
          ) : (
            <>
              <Link href="/login?as=teacher" className="btn btn-ghost btn-sm">
                دخول الأساتذة
              </Link>
              <Link href="/login" className="btn btn-pri btn-sm">
                دخول الطلاب
              </Link>
            </>
          )}
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site gut">
      <div className="wrap">
        <div style={{ maxWidth: 300, display: "grid", gap: 10 }}>
          <span className="logo" style={{ fontSize: 22 }}>
            <span className="mk" style={{ width: 34, height: 34, fontSize: 18 }}>
              ح
            </span>
            حِصّة
          </span>
          <p>منصة بتجمع الأستاذ وطلابه بمكان واحد: مواد، حصص مباشرة، اختبارات، واشتراكات.</p>
        </div>
        <div className="cols">
          <div>
            <h4>للطلاب</h4>
            <Link href="/teachers">تصفّح الأساتذة</Link>
            <Link href="/#faq">الأسئلة الشائعة</Link>
          </div>
          <div>
            <h4>للأساتذة</h4>
            <Link href="/login?as=teacher">ادخل على لوحتك</Link>
            <Link href="/#teachers-band">الأسعار والعمولة</Link>
          </div>
          <div>
            <h4>قانوني</h4>
            <Link href="/privacy">سياسة الخصوصية</Link>
            <Link href="/terms">شروط الاستخدام</Link>
          </div>
          <div>
            <h4>تواصل</h4>
            <span>عمّان، الأردن</span>
            <span>support@hessa.jo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
