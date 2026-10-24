import TeacherTableClient from "./TeacherTableClient";
import TeacherControls from "./TeacherControls";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

async function getTeacherCertificates(session: any) {
  const userRole = session?.user?.role;
  const userFacultyId = session?.user?.facultyId;

  const certs = await prisma.teacherCertificate.findMany({
    where: userRole === 'DEAN' && userFacultyId ? {
      teacher: { facultyId: userFacultyId }
    } : {},
    include: {
      teacher: {
        include: { faculty: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const faculties = await prisma.faculty.findMany({
    where: userRole === 'DEAN' && userFacultyId ? {
      id: userFacultyId
    } : {}
  });
  
  return { certs, faculties };
}

export default async function TeacherCertificatesPage() {
  const session = await getServerSession(authOptions);
  const { certs: certificates, faculties } = await getTeacherCertificates(session);
  const userRole = (session?.user as any)?.role;

  return (
    <div>
      <header className="flex justify-between items-center no-print" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>O'qituvchi Sertifikatlari</h1>
        <div className="flex items-center gap-4">
          <TeacherControls certs={certificates} faculties={faculties} userRole={userRole} />
        </div>
      </header>

      <TeacherTableClient certs={certificates} faculties={faculties} userRole={userRole} />
    </div>
  );
}
