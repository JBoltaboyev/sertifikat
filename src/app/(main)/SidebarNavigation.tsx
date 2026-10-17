"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNavigation({ role }: { role: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", roles: ["ADMIN", "DEAN"] },
    { name: "Talaba sertifikati", href: "/certificates", roles: ["ADMIN", "DEAN"] },
    { name: "O'qituvchi sertifikati", href: "/teacher-certificates", roles: ["ADMIN", "DEAN"] },
    { name: "Foydalanuvchilar", href: "/users", roles: ["ADMIN"] },
  ];

  return (
    <nav className="sidebar-nav">
      {navItems.filter(item => item.roles.includes(role)).map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`nav-link ${isActive ? 'active' : ''}`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
