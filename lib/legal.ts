// Privacy policy and terms of use, in English. Arabic lives in lib/i18n/ar-legal.ts, keyed by the same text.

export type LegalSection = { h: string; p: string[] };

export const LEGAL_UPDATED = "2026-10-28";

export const PRIVACY: LegalSection[] = [
  {
    h: "Who we are",
    p: [
      "Hessa is an online platform, based in Amman, Jordan, that connects teachers with their students. This policy explains what personal data we collect, why, who can see it, and the rights you have over it. It applies to students, parents and teachers who use Hessa.",
      "We process personal data in line with Jordan's Personal Data Protection Law No. 24 of 2023. For any question about your data, write to support@hessa.jo.",
    ],
  },
  {
    h: "What data we collect",
    p: [
      "From students: your mobile number, full name, grade, whether you are under 18, your parent's mobile number if you are under 18, your subscriptions, the lessons you complete, your quiz answers and scores, and any review you write.",
      "From teachers: your mobile number, full name, the subject you teach, your photo, the content of your public page, and the documents you upload for verification, such as your ID card or passport, degrees, teaching licenses and experience letters.",
      "Technical data: cookies that keep you signed in and remember your language, and basic security logs such as IP address, device type and time of access.",
      "We do not collect payment card data at this stage. Students pay their teacher directly and receive an access code.",
    ],
  },
  {
    h: "Why we use it",
    p: [
      "To create your account and sign you in with a code sent by SMS.",
      "To open the study materials of the teachers you subscribe to, track your progress, and grade your quizzes.",
      "To verify every teacher's identity and qualifications before their page goes public.",
      "To protect teachers' content: every file and video carries a watermark with the student's name.",
      "To keep the platform safe, prevent fraud and account sharing, and improve the service using overall statistics that do not identify you.",
      "We process your data to provide the service you asked for, on the basis of your consent (or your parent's consent if you are under 18), and where the law requires it.",
    ],
  },
  {
    h: "Who can see your data",
    p: [
      "Your teacher sees your name, grade, progress and quiz scores in their own subjects only. They do not see your subscriptions with other teachers.",
      "Your public review shows your name. Teachers' public pages show their name, photo, subject, qualifications and prices.",
      "Service providers that run the platform for us, only for that purpose: Supabase (database and file storage), an SMS provider for login codes, Bunny (video streaming), and our hosting provider. Some of them store data outside Jordan, and we choose providers with strong security safeguards.",
      "Authorities, only when Jordanian law requires it.",
      "We do not sell your data, and we do not share it with advertisers.",
    ],
  },
  {
    h: "Teacher documents",
    p: [
      "ID cards, degrees and certificates are stored in a private, encrypted storage area. Only the Hessa review team can open them, and only to verify the teacher. Students and other teachers never see them.",
      "We keep them while the teacher's account is active and for up to 12 months after it is closed, then delete them. A teacher can ask us to delete them earlier, but their page will then lose its verified badge.",
    ],
  },
  {
    h: "Students under 18",
    p: [
      "A student under 18 can create an account, but their study materials only open after a parent approves through a link we send them. A parent can withdraw this approval at any time by writing to us, and we then stop using the student's data except what the law requires us to keep.",
    ],
  },
  {
    h: "How long we keep it",
    p: [
      "We keep your account data while your account is active. When you delete your account, we delete or anonymize your personal data within 90 days, except records the law requires us to keep for longer.",
    ],
  },
  {
    h: "How we protect it",
    p: [
      "All connections are encrypted. Each person can only reach their own data, enforced in the database itself. Study files open through links that expire within minutes, and quiz answers never reach the student's device before they submit.",
      "If a breach affects your data, we will inform you and the competent authority as the law requires.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "You can ask for a copy of your data, correct it, delete your account, withdraw your consent, or object to a use of your data. Write to support@hessa.jo and we will reply within 30 days. You can also complain to the competent authority in Jordan.",
    ],
  },
  {
    h: "Cookies",
    p: [
      "We only use the cookies needed to keep you signed in and remember your language. We do not use advertising or tracking cookies.",
    ],
  },
  {
    h: "Changes to this policy",
    p: [
      "If we make an important change, we will tell you on the platform or by SMS before it takes effect. The date at the top shows the latest version.",
    ],
  },
];

export const TERMS: LegalSection[] = [
  {
    h: "About these terms",
    p: [
      "These terms govern your use of Hessa, a platform that connects teachers with their students in Jordan. By creating an account you agree to them. If you are under 18, your parent or guardian must also agree.",
    ],
  },
  {
    h: "Your account",
    p: [
      "Your account is personal and for one person only. You sign in with your mobile number and a code we send you, so keep your phone and your codes to yourself.",
      "The information you give us must be true and up to date. You are responsible for what happens in your account.",
      "Sharing your account or an access code with someone else cancels your subscription without a refund.",
    ],
  },
  {
    h: "Subscriptions and payment",
    p: [
      "An access code opens one teacher's study materials for 30 days (monthly) or 90 days (term) from the day you activate it. Each code works once.",
      "At this stage you pay your teacher directly, and refunds are agreed with the teacher. If you have a dispute with a teacher, write to us and we will help resolve it.",
      "When online payment launches, its prices, fees and refund rules will be shown before you pay.",
    ],
  },
  {
    h: "Teachers",
    p: [
      "Before a teacher's page goes public, we verify their identity and qualifications from the documents they upload. These documents must be genuine and belong to the teacher. Forged documents lead to the account being closed and may be reported to the authorities.",
      "Teachers set their own prices and are responsible for the accuracy and quality of their content, and for keeping their page up to date.",
      "Teachers must treat students with respect, must not use students' data outside the platform, and must not contact students under 18 for anything other than their lessons.",
      "Hessa is free for teachers for the first 3 months, then takes the commission shown on the pricing page. We will give teachers at least 30 days' notice before any change to it.",
    ],
  },
  {
    h: "Content and copyright",
    p: [
      "Study materials belong to the teacher who made them. The teacher gives Hessa permission to store them and show them to their subscribed students, and nothing more.",
      "Students may use materials for their own study only. You may not download, record, screenshot, copy or share them outside the platform. Every file and video carries a watermark with your name.",
      "Teachers may only upload content they own or have the right to use. If you believe content on Hessa infringes your rights, write to us and we will review it promptly.",
    ],
  },
  {
    h: "Acceptable use",
    p: [
      "Do not harass or insult anyone, post illegal or inappropriate content, try to break into accounts or systems, copy the platform's data automatically, or use the platform for anything other than learning and teaching.",
    ],
  },
  {
    h: "Reviews",
    p: [
      "Only subscribed students can review a teacher, once per teacher. Reviews must be honest and about the teaching. We may remove reviews that are abusive, fake or off-topic.",
    ],
  },
  {
    h: "Suspension and closing accounts",
    p: [
      "We may suspend or close an account that breaks these terms. Where possible, we will tell you why first and give you a chance to respond. You can close your account at any time by writing to us.",
    ],
  },
  {
    h: "Our responsibility",
    p: [
      "Hessa supports learning but does not guarantee exam results. We work to keep the platform available and secure, but it may sometimes stop for maintenance or technical issues.",
      "To the extent allowed by Jordanian law, we are not responsible for indirect losses, and our total responsibility towards you is limited to what you paid through the platform in the last 3 months.",
    ],
  },
  {
    h: "Changes and governing law",
    p: [
      "We may update these terms. If a change is important, we will tell you before it takes effect, and continuing to use Hessa means you accept it.",
      "These terms are governed by the laws of the Hashemite Kingdom of Jordan, and the courts of Amman have jurisdiction over any dispute.",
      "Questions? Write to support@hessa.jo.",
    ],
  },
];
