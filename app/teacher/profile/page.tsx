import Link from "next/link";
import { TopBar } from "@/components/dash-shell";
import { getT } from "@/lib/i18n-server";
import { myTeacher } from "@/lib/teacher-context";
import { ProfileForm } from "./profile-form";

export default async function TeacherProfile() {
  const t = await getT();
  const x = await myTeacher();
  const first = x.name.split(" ")[0];
  return (
    <>
      <TopBar
        title={t("My public page")}
        sub={t("This is what students see before they subscribe.")}
        who={`${t("Teacher")} ${first}`}
        initial={x.initial}
        color={x.color}
      />
      <div className="card panel" style={{ maxWidth: 720 }}>
        <ProfileForm
          t={{ headline: x.headline, bio: x.bio, education: x.education, liveSchedule: x.liveSchedule, priceMonth: x.priceMonth, priceTerm: x.priceTerm }}
        />
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
          {t("Your name, subject and verification are changed by the Hessa team.")}{" "}
          <Link className="link" href={`/${x.slug}`}>
            {t("View your page")}
          </Link>
        </p>
      </div>
    </>
  );
}
