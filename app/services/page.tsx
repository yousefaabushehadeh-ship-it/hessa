import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/site";
import { Icon } from "@/components/ui";
import { DEMO_MODE } from "@/lib/env";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("Services") };
}

export default async function Services() {
  const t = await getT();
  const SERVICES: [string, string][] = [
    [t("Video lessons"), t("Watch your teacher explain each chapter, at your own pace. Rewind as often as you need.")],
    [t("Live classes"), t("Join your teacher's live sessions and ask questions as they happen. Missed one? Watch the recording.")],
    [t("Practice quizzes"), t("Test yourself after every chapter. Quizzes are graded instantly and show the correct answers.")],
    [t("Notes and past papers"), t("Notes and worked solutions, opened from any device.")],
    [t("Progress tracking"), t("See which lessons you have finished and where you need more practice.")],
    [t("Teacher pages"), t("Every teacher has a page with their subjects, prices, reviews and free trial lessons.")],
  ];
  const STEPS: [string, string][] = [
    [t("Create your account"), t("Sign up with your mobile number. We send a one-time code by SMS.")],
    [t("Get an access code"), t("Agree on a plan with your teacher. They give you an access code.")],
    [t("Start learning"), t("Enter the code and all of that teacher's lessons open right away.")],
  ];
  return (
    <>
      <SiteNav />
      <section className="hero gut">
        <div className="wrap">
          <div>
            <h1>{t("Services")}</h1>
            <p className="lead">
              {t("Hessa connects you with your own teacher for Jordan's Tawjihi exams. Everything you need is in one place.")}
            </p>
            <div className="ctas">
              <Link className="btn btn-pri" href="/signup">
                {t("Create account")}
              </Link>
              <Link className="btn btn-ghost" href="/teachers">
                <Icon name="search" sm /> {t("Browse teachers")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sec gut" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-h">
            <div>
              <h2>{t("What you get")}</h2>
            </div>
          </div>
          <div className="tgrid">
            {SERVICES.map(([title, body]) => (
              <div className="card step" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec gut" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-h">
            <div>
              <h2>{t("How it works")}</h2>
            </div>
          </div>
          <div className="steps">
            {STEPS.map(([title, body], i) => (
              <div className="card step" key={title}>
                <div className="n">{i + 1}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
          {DEMO_MODE && <p className="muted" style={{ marginTop: 18 }}>{t("Demo version: the code is")} 482913</p>}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
