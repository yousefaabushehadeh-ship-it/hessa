import Link from "next/link";
import { AdminTop } from "@/components/admin-top";
import { PaymentsTable } from "@/components/payments-table";
import { getLang, getT } from "@/lib/i18n-server";
import { listAllPayments } from "@/lib/platform";

export default async function AdminPayments({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const sp = await searchParams;
  const all = await listAllPayments();
  const status = ["pending", "approved", "rejected"].includes(sp.status ?? "") ? sp.status : "";
  const list = status ? all.filter((p) => p.status === status) : all;
  const tabs: [string, string][] = [["", t("All")], ["pending", t("Waiting")], ["approved", t("Confirmed")], ["rejected", t("Rejected")]];
  return (
    <>
      <AdminTop title={t("Payments")} sub={t("Every transfer students sent. Teachers confirm their own; you can step in when there's a problem.")} />
      <div className="admin-tabs">
        {tabs.map(([v, label]) => (
          <Link key={v} className="chip" aria-pressed={status === v} href={v ? `/admin/payments?status=${v}` : "/admin/payments"}>
            {label} <span className="num">({v ? all.filter((p) => p.status === v).length : all.length})</span>
          </Link>
        ))}
      </div>
      <div className="card panel">
        <PaymentsTable list={list} lang={lang} showTeacher />
      </div>
    </>
  );
}
