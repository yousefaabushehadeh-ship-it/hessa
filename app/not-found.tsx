import Link from "next/link";
import { SiteNav } from "@/components/site";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <div className="gut">
        <div className="card center-card">
          <h1 style={{ fontSize: 24 }}>الصفحة مش موجودة</h1>
          <p className="muted">يمكن الرابط غلط أو الصفحة انشالت.</p>
          <Link className="btn btn-pri" href="/teachers">
            تصفّح الأساتذة
          </Link>
        </div>
      </div>
    </>
  );
}
