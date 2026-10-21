import { TopBar } from "@/components/dash-shell";
import { DEMO_MODE } from "@/lib/env";
import { requireRole } from "@/lib/session";
import { RedeemForm } from "./redeem-form";

export default async function Redeem() {
  const s = await requireRole("student");
  const first = s.fullName.split(" ")[0];
  return (
    <>
      <TopBar title="تفعيل اشتراك" sub="دخّل الكود اللي أعطاك ياه أستاذك بعد ما دفعتله." who={first} initial={first[0] ?? "ط"} color="var(--orange)" />
      <div className="card panel" style={{ maxWidth: 520 }}>
        <RedeemForm />
        {DEMO_MODE && (
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            للتجربة: جرّب الكود <b dir="ltr">HS-KHALED-02</b>
          </p>
        )}
      </div>
    </>
  );
}
