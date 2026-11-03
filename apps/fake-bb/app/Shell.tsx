// App frame: dark left navigation, main area, small admin layout toggle.
import Link from "next/link";
import { readDb } from "@/lib/db";
import { logout, switchLayout } from "./actions";

export function Shell({ active, children }: { active: "courses" | "review"; children: React.ReactNode }) {
  const { layout } = readDb();
  return (
    <div className={`shell layout-${layout}`}>
      <nav className="basenav">
        <div className="logo">CCCU Learn</div>
        <div className="user">BB Admin</div>
        <Link href="/courses" className={active === "courses" ? "on" : ""}>Courses</Link>
        <Link href="/admin/review" className={active === "review" ? "on" : ""}>Review &amp; publish</Link>
        {/* In the nav, not floating, so it never covers panel buttons. */}
        <form action={switchLayout} className="admin-corner">
          <span>Demo admin · layout:</span>
          <button name="layout" value="v1" disabled={layout === "v1"}>v1</button>
          <button name="layout" value="v2" disabled={layout === "v2"}>v2</button>
        </form>
        <form action={logout}>
          <button type="submit" className="navbtn">Sign out</button>
        </form>
      </nav>
      <div className="main">{children}</div>
    </div>
  );
}
