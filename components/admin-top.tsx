import { TopBar } from "@/components/dash-shell";

export function AdminTop({ title, sub }: { title: string; sub: string }) {
  return <TopBar title={title} sub={sub} who="Hessa" initial="ح" color="var(--rail)" />;
}
