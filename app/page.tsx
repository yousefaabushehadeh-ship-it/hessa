import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/site";
import { Avatar, Icon, TeacherCard } from "@/components/ui";
import { SUBJECTS } from "@/lib/demo-data";
import { listTeachers } from "@/lib/data";

const FAQ: [string, string][] = [
  ["كيف بشترك مع أستاذ؟", "بتتفق مع الأستاذ وبتدفعله، وهو بيعطيك كود تفعيل. بتدخل الكود بحسابك وبتنفتح كل موادّه فورًا. الدفع الإلكتروني (CliQ والمحافظ) جاي قريبًا."],
  ["ليش بتطلبوا موافقة ولي الأمر؟", "لأن أغلب طلابنا تحت 18 سنة، وقانون حماية البيانات الشخصية الأردني رقم 24 لسنة 2023 بيطلب موافقة واضحة. بنبعت لولي الأمر رابط، وبيوافق بكبسة."],
  ["كيف بتحموا مواد الأستاذ؟", "الملفات محفوظة بشكل خاص وبتنفتح برابط مؤقت للمشترك بس، وعليها علامة مائية باسم الطالب."],
  ["مين الأساتذة على حِصّة؟", "كل أستاذ بيمر بتوثيق للهوية والمؤهل قبل ما تنزل صفحته للعامة، وبتشوف جنب اسمه شارة موثّق."],
  ["أنا أستاذ، قديش بتاخذوا؟", "أول 3 شهور مجاني، وبعدها 10% ثابتة من كل اشتراك. إنت بتحدد سعرك، وطلابك بضلوا إلك."],
];

export default async function Home() {
  const teachers = await listTeachers();
  const featured = teachers.slice(0, 4);
  const k = teachers[0];
  return (
    <>
      <SiteNav />
      <section className="hero gut">
        <div className="wrap">
          <div>
            <span className="eyebrow">
              <Icon name="check" sm /> مصمّمة لطلاب التوجيهي وأساتذتهم بالأردن
            </span>
            <h1>
              أستاذك المفضّل،
              <br />
              <em>كل موادّه بمكان واحد.</em>
            </h1>
            <p className="lead">
              فيديوهات، ملخصات، اختبارات، وحصص مباشرة من أستاذك نفسه. اشترك بكود من أستاذك، وتابع تقدّمك أول بأول.
            </p>
            <div className="ctas">
              <Link className="btn btn-pri" href="/teachers">
                <Icon name="search" sm /> تصفّح الأساتذة
              </Link>
              <Link className="btn btn-ghost" href="/login?as=teacher">
                أنا أستاذ، بدي أفتح صفحتي
              </Link>
            </div>
            <div className="facts">
              <div>
                <b className="num">{teachers.length}</b>
                <span>أستاذ ومعلمة</span>
              </div>
              <div>
                <b className="num">{SUBJECTS.length}</b>
                <span>مواد توجيهي</span>
              </div>
              <div>
                <b className="num">مجاني</b>
                <span>درس تجريبي عند كل أستاذ</span>
              </div>
            </div>
          </div>
          {k && (
            <div className="hv" aria-hidden="true">
              <div className="next">
                <div>
                  <div className="k">حصتك الجاية · السبت</div>
                  <h3>التكامل بالتعويض مع أ. {k.name}</h3>
                  <div className="k">7:00 مساءً · مباشر</div>
                </div>
                <span className="btn btn-sm">ذكّرني</span>
              </div>
              <div className="mini">
                <div className="card stat">
                  <div className="lbl">تقدّمك بالرياضيات</div>
                  <div className="v">68%</div>
                  <div className="bar">
                    <i style={{ width: "68%" }} />
                  </div>
                </div>
                <div className="card stat">
                  <div className="lbl">معدّل الاختبارات</div>
                  <div className="v">
                    87<small>/100</small>
                  </div>
                  <div className="sub">آخر 5 اختبارات</div>
                </div>
              </div>
              <div className="card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar t={k} size={46} />
                <div style={{ flex: 1 }}>
                  <b style={{ fontFamily: "var(--f-display)" }}>نزلت مادة جديدة</b>
                  <div className="muted" style={{ fontSize: 13 }}>
                    أ. {k.name} · حل ورقة وزارية 2024
                  </div>
                </div>
                <span className="pill p-warn">جديد</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="sec gut">
        <div className="wrap">
          <div className="sec-h">
            <div>
              <h2>المواد</h2>
              <p>ابدأ من المادة اللي بدك تقوّي فيها.</p>
            </div>
          </div>
          <div className="subs">
            {SUBJECTS.map(([name, ini, , bg, fg]) => (
              <Link key={name} className="subj" href={`/teachers?subject=${encodeURIComponent(name)}`}>
                <span className="ic" style={{ background: bg, color: fg }}>
                  {ini}
                </span>
                <span>
                  <b>{name}</b>
                  <span>{teachers.filter((t) => t.subject === name).length} أستاذ</span>
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
              <h2>أساتذة مميزين هالفصل</h2>
              <p>كل أستاذ موثّق الهوية والمؤهل.</p>
            </div>
            <Link className="link" href="/teachers">
              كل الأساتذة <Icon name="arrow" sm />
            </Link>
          </div>
          <div className="tgrid">
            {featured.map((t) => (
              <TeacherCard key={t.id} t={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="sec gut" id="how" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-h">
            <div>
              <h2>كيف بتشتغل حِصّة؟</h2>
              <p>ثلاث خطوات وبتكون بأول درس.</p>
            </div>
          </div>
          <div className="steps">
            <div className="card step">
              <div className="n num">1</div>
              <h3>اختار أستاذك</h3>
              <p>شوف صفحة الأستاذ وموادّه، وجرّب الدروس المجانية قبل ما تقرر.</p>
            </div>
            <div className="card step">
              <div className="n num">2</div>
              <h3>فعّل اشتراكك بكود</h3>
              <p>الأستاذ بيعطيك كود تفعيل شهري أو فصلي، بتدخله بحسابك وبتنفتح المواد فورًا.</p>
            </div>
            <div className="card step">
              <div className="n num">3</div>
              <h3>ادرس وتابع تقدّمك</h3>
              <p>كل موادّك من كل أساتذتك بلوحة وحدة، وبتعرف شو خلّصت وشو ضايلك.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec gut" id="teachers-band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="forT">
            <div>
              <h2>أستاذ؟ صفحتك، طلابك، واسمك.</h2>
              <p>
                حِصّة مش منصة بتبيع محتواها. إنت صاحب الصفحة، وإحنا بنعطيك الأدوات: رفع المواد بسهولة، أكواد تفعيل لطلابك، وحماية
                للملفات بعلامة مائية باسم كل طالب.
              </p>
              <ul>
                <li>
                  <Icon name="check" sm />
                  <span>صفحة عامة باسمك برابط قصير تشاركه مع طلابك</span>
                </li>
                <li>
                  <Icon name="check" sm />
                  <span>رتّب موادّك بوحدات، وحدد الدروس المجانية للتجربة</span>
                </li>
                <li>
                  <Icon name="check" sm />
                  <span>أنشئ أكواد تفعيل شهرية أو فصلية بكبسة</span>
                </li>
              </ul>
              <div style={{ marginTop: 26 }}>
                <Link className="btn btn-mint" href="/login?as=teacher">
                  ادخل على لوحة الأستاذ
                </Link>
              </div>
            </div>
            <div className="plan">
              <div style={{ opacity: 0.8, fontSize: 14 }}>الأسعار للأستاذ</div>
              <div className="big" style={{ marginBlock: "10px 6px" }}>
                مجاني
              </div>
              <div style={{ opacity: 0.85, marginBottom: 18 }}>أول 3 شهور، بعدها عمولة 10% بس من كل اشتراك.</div>
              <div className="row">
                <span>الدروس التجريبية</span>
                <b>مجانية، بدون عمولة</b>
              </div>
              <div className="row">
                <span>السعر والخصومات</span>
                <b>إنت بتحددهم</b>
              </div>
              <div className="row">
                <span>رسوم شهرية ثابتة</span>
                <b>لا يوجد</b>
              </div>
              <div className="row">
                <span>عدد الطلاب</span>
                <b>غير محدود</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec gut" style={{ paddingTop: 0 }} id="faq">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="sec-h">
            <div>
              <h2>أسئلة شائعة</h2>
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
