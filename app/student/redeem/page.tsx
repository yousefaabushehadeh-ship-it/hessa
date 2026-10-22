import { TopBar } from "@/components/dash-shell";
import { DEMO_MODE } from "@/lib/env";
import { getT } from "@/lib/i18n-server";
import { requireRole } from "@/lib/session";
import { RedeemForm } from "./redeem-form";

export default async function Redeem() {
  const t = await getT();
  const s = await requireRole("student");
  const first = s.fullName.split(" ")[0];
  return (
    <>
      <TopBar
        title={t("Activate a subscription")}
        sub={t("Enter the code your teacher gave you after you paid.")}
        who={first}
        initial={first[0] ?? "S"}
        color="var(--orange)"
      />
      <div className="card panel" style={{ maxWidth: 520 }}>
        <RedeemForm />
        {DEMO_MODE && (
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            {t("To try it: use the code")} <b dir="ltr">HS-KHALED-02</b>
          </p>
        )}
      </div>
    </>
  );
}
