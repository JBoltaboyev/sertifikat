import AcademicTableClient from "./AcademicTableClient";
import AcademicControls from "./AcademicControls";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

async function getLiteratures(session: any) {
  const userRole = session?.user?.role;
  const userFacultyId = session?.user?.facultyId;

  const literatures = await prisma.literature.findMany({
    where: userRole === "DEAN" && userFacultyId ? {
      facultyId: userFacultyId
    } : {},
    include: {
      faculty: true
    },
    orderBy: { createdAt: "desc" }
  });

  const faculties = await prisma.faculty.findMany({
    where: userRole === "DEAN" && userFacultyId ? {
      id: userFacultyId
    } : {}
  });

  return { literatures, faculties };
}

export default async function AcademicActivityPage() {
  const session = await getServerSession(authOptions);
  const { literatures, faculties } = await getLiteratures(session);
  const userRole = (session?.user as any)?.role;

  return (
    <div>
      <header className="flex justify-between items-center no-print" style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)" }}>
          Akademik Faoliyat (Adabiyotlar)
        </h1>
        <div className="flex items-center gap-4">
          <AcademicControls literatures={literatures} faculties={faculties} userRole={userRole} />
        </div>
      </header>

      <AcademicTableClient literatures={literatures} faculties={faculties} userRole={userRole} />
    </div>
  );
}
