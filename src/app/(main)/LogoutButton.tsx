"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button 
      className="btn btn-outline" 
      style={{ width: '100%', marginTop: '1rem', fontSize: '0.875rem' }}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Chiqish
    </button>
  );
}
