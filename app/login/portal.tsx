import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site";
import { Icon } from "@/components/ui";
import { GRADES, SUBJECT_LIST, TEACHER_GRADES } from "@/lib/catalog";
import { DEMO_MODE } from "@/lib/env";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import { getSession, homeFor } from "@/lib/session";
import { LoginFlow } from "./login-flow";

export type Who = "student" | "teacher" | "school" | "admin";

/** Sign-in or sign-up for one side of the platform. Signed-in people go straight to their own dashboard. */
export async function Portal({ as, signup, next }: { as: Who; signup?: boolean; next?: string }) {
  const s = await getSession();
  // Signed in but never finished the profile step: pick up from there.
  const unfinished = s?.role === "student" && !s.fullName;
  if (s && !unfinished) redirect(homeFor(s.role));
  const lang = await getLang();
  const opts = (list: string[]) => list.map((v) => [v, dataLabel(lang, v)] as [string, string]);
  return (
    <>
      <SiteNav />
      <div className="gut">
        <LoginFlow key={`${as}-${signup ? "up" : "in"}`} as={as} next={next} demo={DEMO_MODE} startAtProfile={unfinished} signup={signup}
          subjects={opts(SUBJECT_LIST)}
          grades={opts(GRADES)}
          teacherGrades={opts(TEACHER_GRADES)}
        />
      </div>
    </>
  );
}

/** "Who are you?" screen in front of the two portals. */
export async function PortalChooser({ signup, next }: { signup?: boolean; next?: string }) {
  const t = await getT();
  const base = signup ? "/signup" : "/login";
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <>
      <SiteNav />
      <div className="gut">
        <div className="wrap portal-pick">
          <h1>{signup ? t("Create your free account") : t("Sign in to Hessa")}</h1>
          <p className="muted">{t("Choose who you are. Each one has its own space.")}</p>
          <div className="who">
            <Link className="card who-card main" href={`${base}/student${q}`}>
              <span className="ic">
                <Icon name="book" />
              </span>
              <b>{t("I'm a student")}</b>
              <span>{t("Study with your teachers, watch lessons, take quizzes and track your progress.")}</span>
              <span className="btn btn-pri">{signup ? t("Create a student account") : t("Student sign in")}</span>
            </Link>
            <Link className="card who-card" href={`${base}/teacher`}>
              <span className="ic">
                <Icon name="users" />
              </span>
              <b>{t("I'm a teacher")}</b>
              <span>{t("Open your own page, upload your lessons and give access codes to your students.")}</span>
              <span className="btn btn-ghost">{signup ? t("Create a teacher account") : t("Teacher sign in")}</span>
            </Link>
            <Link className="card who-card" href={`${base}/school`}>
              <span className="ic">
                <Icon name="bank" />
              </span>
              <b>{t("We're a school or center")}</b>
              <span>{t("Add your teachers in one place and follow their students.")}</span>
              <span className="btn btn-ghost">{signup ? t("Create a school account") : t("School sign in")}</span>
            </Link>
          </div>
          <Link className="link" href={signup ? `/login${q}` : `/signup${q}`}>
            {signup ? t("Already have an account? Sign in") : t("New here? Create an account")}
          </Link>
        </div>
      </div>
    </>
  );
}
