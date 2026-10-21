import { signOut } from "@/app/actions/auth";

export function SignOut() {
  return (
    <form action={signOut} className="out">
      <button type="submit">تسجيل الخروج</button>
    </form>
  );
}
