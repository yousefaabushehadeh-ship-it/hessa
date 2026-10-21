import type { Metadata } from "next";
import { SiteNav } from "@/components/site";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "موافقة ولي الأمر", robots: { index: false } };

export default async function Consent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <SiteNav />
      <div className="gut">
        <div className="card center-card">
          <h1 style={{ fontSize: 24 }}>موافقة ولي الأمر</h1>
          <p>
            ابنكم أو بنتكم بدّه يفتح حساب على منصة حِصّة عشان يدرس مع أساتذته. بنحفظ اسمه ورقم موبايله وصفّه وتقدّمه بالدروس بس، وما
            بنشارك بياناته مع أي جهة إعلانية.
          </p>
          <ul className="ul">
            <li>بتقدر تسحب الموافقة وتحذف الحساب وقت ما بدك، بإيميل لـ support@hessa.jo.</li>
            <li>الأستاذ بيشوف اسم الطالب وتقدّمه بموادّه بس.</li>
          </ul>
          <ConsentForm token={token} />
        </div>
      </div>
    </>
  );
}
