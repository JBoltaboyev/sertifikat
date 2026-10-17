import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import SidebarNavigation from "./SidebarNavigation";
import LogoutButton from "./LogoutButton";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  return (
    <div className="layout-wrapper">
      <aside className="sidebar glass">
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
            Sertifikat Pro
          </h2>
        </div>
        
        <SidebarNavigation role={user.role} />

        <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user.role === 'ADMIN' ? 'Prorektor' : 'Dekan'}
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
