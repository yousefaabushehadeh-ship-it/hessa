import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/dash-shell";
import { ReportBody } from "@/components/report";
import { Icon } from "@/components/ui";
import { getTeacherStudentReport } from "@/lib/analysis";
import { getLang, getT } from "@/lib/i18n-server";
import { myTeacher } from "@/lib/teacher-context";

export default async function StudentAnalysis({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const lang = await getLang();
  const { id } = await params;
  const x = await myTeacher();
  const r = await getTeacherStudentReport(x, id);
  if (!r) notFound();
  return (
    <>
      <TopBar title={r.name} sub={t("Their analysis in your subject: lessons, quizzes and worksheets.")} who={`${t("Teacher")} ${x.name.split(" ")[0]}`} initial={x.initial} color={x.color} photoUrl={x.photoUrl} />
      <p style={{ marginBottom: 14 }}>
        <Link className="link" href="/teacher/students">
          <Icon name="arrow" sm /> {t("All students")}
        </Link>
      </p>
      <ReportBody r={r} lang={lang} />
      <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
        {t("The parent sees this same analysis, with your name, through their approval link. The school sees totals only.")}
      </p>
    </>
  );
}
