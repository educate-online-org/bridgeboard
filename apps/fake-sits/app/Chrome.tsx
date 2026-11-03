// Page frame: header bar, menu, footer with the small admin layout toggle.
import Link from "next/link";
import { getLayout } from "@/lib/db";
import { logout, switchLayout } from "./actions";

export function Chrome({ crumb, children }: { crumb: string; children: React.ReactNode }) {
  const layout = getLayout();
  return (
    <div className={`frame layout-${layout}`}>
      <header className="topbar">
        <span className="brand">CCCU</span>
        <span className="system">Student Records System (SITS) &mdash; Curriculum Management</span>
        <form action={logout} className="logout">
          <span>User: SITS_ADMIN</span>
          <button type="submit">Log out</button>
        </form>
      </header>
      <nav className="menubar">
        <Link href="/modules">{layout === "v1" ? "Module Catalogue" : "Curriculum: Modules"}</Link>
        <span className="disabled">Programmes</span>
        <span className="disabled">Students</span>
        <span className="disabled">Reports</span>
      </nav>
      <div className="crumb">{crumb}</div>
      <main>{children}</main>
      <footer className="admin-corner">
        <form action={switchLayout}>
          <span>Demo admin &middot; layout:</span>
          <button name="layout" value="v1" disabled={layout === "v1"}>v1</button>
          <button name="layout" value="v2" disabled={layout === "v2"}>v2</button>
        </form>
      </footer>
    </div>
  );
}
