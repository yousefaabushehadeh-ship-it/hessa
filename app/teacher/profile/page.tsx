import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { myTeacher } from "@/lib/teacher-context";
import { ProfileForm } from "./profile-form";

export default async function TeacherProfile() {
  const t = await myTeacher();
  const first = t.name.split(" ")[0];
  return (
    <>
      <TopBar title="صفحتي العامة" sub="هاد اللي بيشوفه الطلاب قبل ما يشتركوا." who={`أ. ${first}`} initial={t.initial} color={t.color} />
      <div className="card panel" style={{ maxWidth: 720 }}>
        <ProfileForm
          t={{ headline: t.headline, bio: t.bio, education: t.education, liveSchedule: t.liveSchedule, priceMonth: t.priceMonth, priceTerm: t.priceTerm }}
        />
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
          الاسم والمادة والتوثيق بتتعدّل عن طريق فريق حِصّة.{" "}
          <Link className="link" href={`/${t.slug}`}>
            شوف صفحتك
          </Link>
        </p>
      </div>
    </>
  );
}
