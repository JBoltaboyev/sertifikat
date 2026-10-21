import { prisma } from "@/lib/prisma";
import UserControls from "./UserControls";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getUsersData() {
  const users = await prisma.user.findMany({
    include: { faculty: true },
    orderBy: { createdAt: 'asc' }
  });
  
  const faculties = await prisma.faculty.findMany();
  
  return { users, faculties };
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { users, faculties } = await getUsersData();

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Foydalanuvchilar</h1>
      </header>
      
      <UserControls users={users} faculties={faculties} />
    </div>
  );
}
