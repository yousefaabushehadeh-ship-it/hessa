import type { Teacher, Lesson, LessonType, Review } from "./types";

// Sample data used in demo mode (no Supabase keys). Mirrors supabase/seed.sql.
type RawItem = [string, LessonType, string, number?];
type RawTeacher = {
  id: string; name: string; ini: string; subject: string; grade: string; city: string; years: number;
  rating: number; reviews: number; students: number; price: number; term: number; color: string; badge: string;
  headline: string; edu: string; live: string; bio: string; units: { name: string; items: RawItem[] }[];
};

const RAW: RawTeacher[] = [
{id:'khaled',name:'خالد العمري',ini:'خ',subject:'رياضيات',grade:'توجيهي علمي',city:'عمّان',years:14,rating:4.9,reviews:312,students:1240,price:25,term:65,color:'#0f4c45',badge:'الأكثر اشتراكًا',
 headline:'رياضيات التوجيهي العلمي من الأساس للعلامة الكاملة، بشرح مرتّب وحلّ أوراق وزارية.',
 edu:'ماجستير رياضيات تطبيقية، الجامعة الأردنية',live:'السبت والثلاثاء · 7:00 مساءً',
 bio:'بدرّس رياضيات التوجيهي من 14 سنة بمدارس عمّان ومراكزها. بقسّم كل وحدة لدروس قصيرة، وبعد كل درس في ورقة عمل واختبار قصير بيصحّح لحاله، وكل أسبوعين حصة مباشرة لحل أسئلة الطلاب والأوراق الوزارية.',
 units:[
  {name:'الوحدة الأولى: التفاضل',items:[['قواعد الاشتقاق','video','31 دقيقة',1],['مشتقات الاقترانات المثلثية','video','38 دقيقة'],['قاعدة السلسلة','video','42 دقيقة'],['ورقة عمل: الاشتقاق','pdf','8 صفحات'],['اختبار قصير: قواعد الاشتقاق','quiz','3 أسئلة']]},
  {name:'الوحدة الثانية: تطبيقات التفاضل',items:[['القيم القصوى','video','45 دقيقة'],['التقعّر ونقاط الانعطاف','video','40 دقيقة'],['اختبار النهايات والاتصال','quiz','20 سؤال']]},
  {name:'الوحدة الثالثة: التكامل',items:[['التكامل غير المحدود','video','36 دقيقة'],['التكامل بالتعويض','live','السبت 7:00 م'],['حل ورقة وزارية 2024','video','45 دقيقة']]}
 ]},
{id:'sami',name:'سامي النجار',ini:'س',subject:'فيزياء',grade:'توجيهي علمي',city:'إربد',years:11,rating:4.8,reviews:198,students:860,price:22,term:58,color:'#d97706',badge:'',
 headline:'فيزياء التوجيهي بالتجربة والرسم، وملخصات بتختصر عليك الوحدة بصفحات قليلة.',
 edu:'بكالوريوس فيزياء، جامعة اليرموك',live:'الأربعاء · 6:30 مساءً',
 bio:'بشرح الفيزياء من الفكرة قبل القانون. كل وحدة إلها ملخص PDF وبنك أسئلة مرتب حسب نمط الوزارة، ومراجعة مكثفة قبل كل امتحان.',
 units:[
  {name:'الزخم الخطي والتصادمات',items:[['الزخم والدفع','video','34 دقيقة',1],['حفظ الزخم الخطي','video','41 دقيقة'],['التصادمات المرنة وغير المرنة','pdf','10 صفحات']]},
  {name:'الحركة الدورانية',items:[['ملخص الحركة الدائرية','pdf','12 صفحة'],['عزم القصور الذاتي','video','39 دقيقة'],['اختبار قصير: العزم','quiz','15 سؤال']]},
  {name:'التيار الكهربائي',items:[['المقاومة وقانون أوم','video','33 دقيقة'],['قاعدتا كيرشوف','live','الأربعاء 6:30 م']]}
 ]},
{id:'rana',name:'رنا الحوراني',ini:'ر',subject:'كيمياء',grade:'توجيهي علمي',city:'الزرقاء',years:9,rating:4.9,reviews:156,students:640,price:20,term:54,color:'#7c3aed',badge:'تقييم ممتاز',
 headline:'كيمياء بلا حفظ أعمى: بنفهم ليش بصير التفاعل، وبعدين بنحل عليه.',
 edu:'ماجستير كيمياء تحليلية، الجامعة الهاشمية',live:'الاثنين · 5:00 مساءً',
 bio:'بدرّس كيمياء التوجيهي أونلاين ووجاهي من 9 سنين. بركّز على المسائل الحسابية وخرائط المفاهيم اللي بتسهّل المراجعة.',
 units:[
  {name:'الحموض والقواعد',items:[['مفهوم أرهينيوس وبرونستد-لوري','video','29 دقيقة',1],['الرقم الهيدروجيني pH','video','37 دقيقة'],['ملخص المحاليل المنظِّمة','pdf','9 صفحات']]},
  {name:'الكيمياء الكهربائية',items:[['الخلايا الجلفانية','video','44 دقيقة'],['التحليل الكهربائي','video','40 دقيقة'],['اختبار: جهود الاختزال','quiz','25 سؤال']]}
 ]},
{id:'laith',name:'ليث المومني',ini:'ل',subject:'اللغة الإنجليزية',grade:'جميع الفروع',city:'عمّان',years:8,rating:4.7,reviews:241,students:1050,price:18,term:48,color:'#0369a1',badge:'',
 headline:'English for Tawjihi: قراءة وكتابة وقواعد بأسلوب امتحان الوزارة.',
 edu:'بكالوريوس أدب إنجليزي، الجامعة الأردنية',live:'الأحد · 8:00 مساءً',
 bio:'بساعد الطلاب يكتبوا مقال مرتب ويفهموا القطعة من أول قراءة. عندي بنك مفردات لكل وحدة واختبارات على نمط الأسئلة الوزارية.',
 units:[
  {name:'Unit 1: Reading & Grammar',items:[['Reading strategies for Tawjihi','video','27 دقيقة',1],['Grammar: The passive voice','video','32 دقيقة'],['Writing: The opinion essay','pdf','6 صفحات']]},
  {name:'Unit 2: Exam practice',items:[['Vocabulary builder 1','pdf','14 صفحة'],['Past papers 2023–2024','quiz','40 سؤال']]}
 ]},
{id:'hiba',name:'هبة الزعبي',ini:'ه',subject:'علوم حياتية',grade:'توجيهي علمي',city:'السلط',years:10,rating:4.8,reviews:133,students:520,price:20,term:54,color:'#be185d',badge:'',
 headline:'العلوم الحياتية بالرسومات والخرائط الذهنية، وكل درس بملخص صفحة وحدة.',
 edu:'ماجستير علوم حياتية، جامعة العلوم والتكنولوجيا',live:'الخميس · 6:00 مساءً',
 bio:'بحوّل الدرس الطويل لخريطة ذهنية ورسومات واضحة، وبتابع مع الطلاب بأسئلة يومية قصيرة على المجموعة.',
 units:[
  {name:'الجهاز العصبي',items:[['تركيب العصبون','video','28 دقيقة',1],['السيال العصبي','video','35 دقيقة'],['خريطة ذهنية للوحدة','pdf','4 صفحات']]},
  {name:'الوراثة',items:[['قوانين مندل','video','38 دقيقة'],['اختبار: مسائل الوراثة','quiz','20 سؤال']]}
 ]},
{id:'omar',name:'عمر الخطيب',ini:'ع',subject:'اللغة العربية',grade:'جميع الفروع',city:'الكرك',years:16,rating:4.9,reviews:287,students:1480,price:15,term:40,color:'#15803d',badge:'خبرة 16 سنة',
 headline:'نحو وبلاغة وعروض وأدب، بأسلوب سهل وأمثلة من أسئلة الوزارة.',
 edu:'ماجستير لغة عربية، جامعة مؤتة',live:'الجمعة · 4:00 عصرًا',
 bio:'بدرّس العربي للتوجيهي من 16 سنة. بركّز على القواعد اللي بتتكرر بالامتحان وبعطي تدريب أسبوعي على الإعراب والتقطيع العروضي.',
 units:[
  {name:'النحو والصرف',items:[['المشتقات: اسم الفاعل واسم المفعول','video','35 دقيقة',1],['أسلوب الشرط','video','30 دقيقة'],['تدريبات إعراب','pdf','10 صفحات']]},
  {name:'البلاغة والعروض',items:[['التشبيه والاستعارة','video','28 دقيقة'],['بحرا البسيط والكامل','pdf','11 صفحة']]}
 ]},
{id:'dana',name:'دانا القضاة',ini:'د',subject:'تاريخ الأردن',grade:'جميع الفروع',city:'عجلون',years:7,rating:4.6,reviews:94,students:380,price:12,term:32,color:'#9a3412',badge:'',
 headline:'تاريخ الأردن بقصة مترابطة وخرائط وتواريخ مهمة بتثبت بالذاكرة.',
 edu:'بكالوريوس تاريخ، جامعة آل البيت',live:'الثلاثاء · 5:30 مساءً',
 bio:'بحكي التاريخ كقصة، وبعطي جداول للتواريخ والشخصيات قبل كل امتحان.',
 units:[
  {name:'تأسيس الدولة',items:[['الثورة العربية الكبرى','video','31 دقيقة',1],['تأسيس الإمارة 1921','video','26 دقيقة'],['خرائط وتواريخ مهمة','pdf','7 صفحات']]}
 ]},
{id:'yazan',name:'يزن الطراونة',ini:'ي',subject:'رياضيات',grade:'الصفوف 9 لـ 11',city:'العقبة',years:6,rating:4.7,reviews:76,students:290,price:14,term:38,color:'#0e7490',badge:'',
 headline:'تأسيس قوي بالرياضيات للصفوف 9 لـ 11 قبل ما توصل التوجيهي.',
 edu:'بكالوريوس رياضيات، جامعة الحسين بن طلال',live:'الاثنين · 7:00 مساءً',
 bio:'بشتغل على التأسيس: الاقترانات والمعادلات والمتباينات، مع واجب أسبوعي ومتابعة لولي الأمر.',
 units:[
  {name:'الاقترانات والمعادلات',items:[['الاقترانات وتمثيلها البياني','video','25 دقيقة',1],['المعادلات التربيعية','video','30 دقيقة'],['ورقة عمل: المتباينات','pdf','5 صفحات']]}
 ]}
];

const SLUGS: Record<string, string> = {khaled:'khaled-omari',sami:'sami-najjar',rana:'rana-hourani',laith:'laith-momani',hiba:'hiba-zoubi',omar:'omar-khatib',dana:'dana-qudah',yazan:'yazan-tarawneh'};

// Demo edits (prices, new lessons) mutate this list. It lives on globalThis because
// Next.js can load this module more than once (one copy per route bundle).
const g = globalThis as unknown as { __hessaTeachers?: Teacher[] };

export const TEACHERS: Teacher[] = (g.__hessaTeachers ??= RAW.map((t) => ({
  id: t.id,
  slug: SLUGS[t.id],
  name: t.name,
  initial: t.ini,
  subject: t.subject,
  grade: t.grade,
  city: t.city,
  years: t.years,
  rating: t.rating,
  reviewCount: t.reviews,
  studentCount: t.students,
  priceMonth: t.price,
  priceTerm: t.term,
  color: t.color,
  badge: t.badge || null,
  headline: t.headline,
  education: t.edu,
  liveSchedule: t.live,
  bio: t.bio,
  verified: true,
  units: t.units.map((u, ui) => ({
    id: `${t.id}-u${ui}`,
    title: u.name,
    position: ui,
    lessons: u.items.map((it, li): Lesson => ({
      id: `${t.id}-u${ui}-l${li}`,
      title: it[0],
      type: it[1],
      meta: it[2],
      isFree: Boolean(it[3]),
      position: li,
    })),
  })),
})));

export const SUBJECTS: [string, string, number, string, string][] = [['رياضيات','ر',24,'#d9f6ec','#0d7a58'],['فيزياء','ف',18,'#fdf0d2','#a65c06'],['كيمياء','ك',15,'#ede4fd','#6d28d9'],['علوم حياتية','ع',12,'#fde4ee','#be185d'],['اللغة الإنجليزية','En',21,'#e4eef2','#1f5b70'],['اللغة العربية','ض',16,'#e3f4e6','#15803d'],['تاريخ الأردن','ت',9,'#fbe8dc','#9a3412'],['علوم الأرض والبيئة','أ',6,'#e1f2f4','#0e7490']];

const RAW_REVIEWS: [string, string, number, string][] = [
['ليان الخوالدة','قبل شهرين',5,'الشرح مرتّب جدًا وبيوصل الفكرة من أول مرة. الاختبارات القصيرة بعد كل درس خلّتني أعرف وين ضعفي بالضبط.'],
['عبدالله الرواشدة','قبل 3 أسابيع',5,'الحصص المباشرة ممتازة، بيرد على كل الأسئلة، والتسجيل بنزل بعدها بساعة إذا فاتتني.'],
['تالا العبادي','قبل أسبوع',4,'الملخصات وفّرت عليّ وقت كثير قبل الامتحان. بتمنى لو في أوراق عمل أكثر بالوحدة الأخيرة.']
];

export const REVIEWS: Review[] = RAW_REVIEWS.map(([author, when, stars, body]) => ({ author, when, stars, body }));

export const DEMO_STUDENT = {
  id: "7f3c9a2e-5b41-4d8e-9a6f-2c1e8b7d4a90",
  fullName: "محمد الشريف",
  firstName: "محمد",
  grade: "توجيهي علمي · جيل 2009",
  subscriptions: [
    { teacherId: "khaled", plan: "monthly" as const, endsOn: "2026-11-12", progress: 68 },
    { teacherId: "sami", plan: "monthly" as const, endsOn: "2026-10-24", progress: 45 },
  ],
};

export const DEMO_TEACHER_ID = "khaled";
