import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/site";
import { Avatar, Icon, TeacherCard } from "@/components/ui";
import { SUBJECTS } from "@/lib/demo-data";
import { DEMO_MODE } from "@/lib/env";
import { listTeachers } from "@/lib/data";
import { dataLabel } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";

export default async function Home() {
  const t = await getT();
  const lang = await getLang();
  const teachers = await listTeachers();
  const featured = teachers.slice(0, 4);
  const k = teachers[0];
  const FAQ: [string, string][] = [
    [
      t("How do I subscribe to a teacher?"),
      t("Agree on a plan with the teacher and pay them directly. They give you an access code, and all their lessons open as soon as you enter it. Online payments (CliQ and wallets) are coming soon."),
    ],
    [
      t("Why do you ask for a parent's approval?"),
      t("Most of our students are under 18, and Jordan's personal data protection law (No. 24 of 2023) requires clear consent. We send your parent a link, and they approve it in one tap."),
    ],
    [
      t("How do you protect the teachers' study materials?"),
      t("Files are stored privately and open through a temporary link for subscribers only. Every file carries a watermark with the student's name."),
    ],
    [
      t("Who are the teachers on Hessa?"),
      t("Every teacher is checked for identity and qualifications before their page goes public, and you will see a verified badge next to their name."),
    ],
    [
      t("I'm a teacher. How much do you take?"),
      t("The first 3 months are free. After that it is a flat 10% of each subscription. Free trial lessons carry no commission. You set your own prices, and your students stay yours."),
    ],
  ];
  return (
    <>
      <SiteNav />
      <section className="hero gut">
        <div className="wrap">
          <div>
            <span className="eyebrow">
              <Icon name="check" sm /> {t("Built for students preparing for Jordan's Tawjihi national exam")}
            </span>
            <h1>
              {t("Your favorite teacher,")}
              <br />
              <em>{t("all their lessons in one place.")}</em>
            </h1>
            <p className="lead">
              {t("Videos, notes, quizzes and live classes with your own teacher. Subscribe with a code from your teacher and track your progress as you go.")}
            </p>
            <div className="ctas">
              <Link className="btn btn-pri" href="/teachers">
                <Icon name="search" sm /> {t("Browse teachers")}
              </Link>
              {!DEMO_MODE && (
                <Link className="btn btn-ghost" href="/login?as=teacher">
                  {t("I'm a teacher. Open my page")}
                </Link>
              )}
            </div>
            <div className="facts">
              <div>
                <b className="num">{teachers.length}</b>
                <span>{t("teachers")}</span>
              </div>
              <div>
                <b className="num">{SUBJECTS.length}</b>
                <span>{t("Tawjihi subjects")}</span>
              </div>
              <div>
                <b className="num">{t("Free")}</b>
                <span>{t("trial lesson with every teacher")}</span>
              </div>
            </div>
          </div>
          {k && (
            <div className="hv" aria-hidden="true">
              <div className="next">
                <div>
                  <div className="k">{t("Your next class · Saturday")}</div>
                  <h3>
                    {t("Substitution integrals with Teacher {name}", { name: k.name })}
                  </h3>
                  <div className="k">{t("7:00 PM · Live")}</div>
                </div>
                <span className="btn btn-sm">{t("Remind me")}</span>
              </div>
              <div className="mini">
                <div className="card stat">
                  <div className="lbl">{t("Your math progress")}</div>
                  <div className="v">68%</div>
                  <div className="bar">
                    <i style={{ width: "68%" }} />
                  </div>
                </div>
                <div className="card stat">
                  <div className="lbl">{t("Quiz average")}</div>
                  <div className="v">
                    87<small>/100</small>
                  </div>
                  <div className="sub">{t("Last 5 quizzes")}</div>
                </div>
              </div>
              <div className="card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar t={k} size={46} />
                <div style={{ flex: 1 }}>
                  <b style={{ fontFamily: "var(--f-display)" }}>{t("New material posted")}</b>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {t("Teacher {name}", { name: k.name })} · {t("Past paper 2024 solutions")}
                  </div>
                </div>
                <span className="pill p-warn">{t("New")}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="sec gut">
        <div className="wrap">
          <div className="sec-h">
            <div>
              <h2>{t("Subjects")}</h2>
              <p>{t("Start with the subject you want to get better at.")}</p>
            </div>
          </div>
          <div className="subs">
            {SUBJECTS.map(([name, ini, , bg, fg]) => (
              <Link key={name} className="subj" href={`/teachers?subject=${encodeURIComponent(name)}`}>
                <span className="ic" style={{ background: bg, color: fg }}>
                  {ini}
                </span>
                <span>
                  <b>{dataLabel(lang, name)}</b>
                  <span>{t("{n} teachers", { n: teachers.filter((x) => x.subject === name).length })}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec gut" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-h">
            <div>
              <h2>{t("Featured teachers this semester")}</h2>
              <p>{t("Every teacher is verified for identity and qualifications.")}</p>
            </div>
            <Link className="link" href="/teachers">
              {t("All teachers")} <Icon name="arrow" sm />
            </Link>
          </div>
          <div className="tgrid">
            {featured.map((x) => (
              <TeacherCard key={x.id} t={x} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      <section className="sec gut" id="how" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-h">
            <div>
              <h2>{t("How Hessa works")}</h2>
              <p>{t("Three steps and you're in your first lesson.")}</p>
            </div>
          </div>
          <div className="steps">
            <div className="card step">
              <div className="n num">1</div>
              <h3>{t("Choose your teacher")}</h3>
              <p>{t("Look at the teacher's page and their subjects, and try the free lessons before you decide.")}</p>
            </div>
            <div className="card step">
              <div className="n num">2</div>
              <h3>{t("Activate with a code")}</h3>
              <p>{t("Your teacher gives you a monthly or term code. Enter it in your account and everything opens right away.")}</p>
            </div>
            <div className="card step">
              <div className="n num">3</div>
              <h3>{t("Study and track progress")}</h3>
              <p>{t("All your lessons from all your teachers in one dashboard, so you always know what's done and what's left.")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec gut" id="teachers-band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="forT">
            <div>
              <h2>{t("A teacher? Your page, your students, your name.")}</h2>
              <p>
                {t("Hessa isn't a marketplace that sells your content. You own your page, and we give you the tools: easy uploads, access codes for your students, and watermarked files that protect your work.")}
              </p>
              <ul>
                <li>
                  <Icon name="check" sm />
                  <span>{t("A public page with a short link you can share with your students")}</span>
                </li>
                <li>
                  <Icon name="check" sm />
                  <span>{t("Organize your lessons into chapters and pick which ones are free to try")}</span>
                </li>
                <li>
                  <Icon name="check" sm />
                  <span>{t("Create monthly or term access codes in one click")}</span>
                </li>
              </ul>
              <div style={{ marginTop: 26 }}>
                <Link className="btn btn-mint" href="/login?as=teacher">
                  {t("Sign in to your teacher dashboard")}
                </Link>
              </div>
            </div>
            <div className="plan">
              <div style={{ opacity: 0.8, fontSize: 14 }}>{t("Pricing for teachers")}</div>
              <div className="big" style={{ marginBlock: "10px 6px" }}>
                {t("Free")}
              </div>
              <div style={{ opacity: 0.85, marginBottom: 18 }}>{t("First 3 months free, then a 10% commission on each subscription.")}</div>
              <div className="row">
                <span>{t("Trial lessons")}</span>
                <b>{t("Free, no commission")}</b>
              </div>
              <div className="row">
                <span>{t("Price and discounts")}</span>
                <b>{t("You decide")}</b>
              </div>
              <div className="row">
                <span>{t("Monthly fee")}</span>
                <b>{t("None")}</b>
              </div>
              <div className="row">
                <span>{t("Number of students")}</span>
                <b>{t("Unlimited")}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec gut" style={{ paddingTop: 0 }} id="faq">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="sec-h">
            <div>
              <h2>{t("Frequently asked questions")}</h2>
            </div>
          </div>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
