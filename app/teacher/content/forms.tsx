"use client";

import { useActionState, useRef } from "react";
import { addLesson, addUnit } from "@/app/actions/teacher";

export function AddLessonForm({ units }: { units: { id: string; title: string }[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof addLesson>>, fd: FormData) => {
    const r = await addLesson(prev, fd);
    if (r.ok) ref.current?.reset();
    return r;
  }, {});
  if (!units.length) return <p className="muted">أضف وحدة أول.</p>;
  return (
    <form className="frm" action={action} ref={ref}>
      <div>
        <label className="h" htmlFor="l-unit">
          الوحدة
        </label>
        <select className="field" id="l-unit" name="unit">
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="h" htmlFor="l-title">
          العنوان
        </label>
        <input className="field" id="l-title" name="title" required placeholder="مثال: ملخص قاعدة السلسلة" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="h" htmlFor="l-type">
            النوع
          </label>
          <select className="field" id="l-type" name="type" defaultValue="pdf">
            <option value="pdf">ملف PDF</option>
            <option value="video">فيديو (قريبًا)</option>
            <option value="quiz">اختبار (قريبًا)</option>
            <option value="live">حصة مباشرة</option>
          </select>
        </div>
        <div>
          <label className="h" htmlFor="l-meta">
            المدة أو عدد الصفحات
          </label>
          <input className="field" id="l-meta" name="meta" placeholder="12 صفحة" />
        </div>
      </div>
      <div>
        <label className="h" htmlFor="l-file">
          الملف (PDF لحد 20 ميجا)
        </label>
        <input className="field" id="l-file" name="file" type="file" accept="application/pdf" />
      </div>
      <label className="check">
        <input type="checkbox" name="free" /> درس مجاني للتجربة
      </label>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-pri" disabled={pending}>
        {pending ? "عم نرفع..." : "انشر المادة"}
      </button>
    </form>
  );
}

export function AddUnitForm() {
  const [state, action, pending] = useActionState(addUnit, {});
  return (
    <form className="frm" action={action}>
      <input className="field" name="title" required placeholder="مثال: الوحدة الرابعة: المتجهات" aria-label="اسم الوحدة" />
      {state.error && <p className="form-error">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.ok}</p>}
      <button className="btn btn-ghost" disabled={pending}>
        أضف الوحدة
      </button>
    </form>
  );
}
