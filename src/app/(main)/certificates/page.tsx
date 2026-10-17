import CertificateTableClient from "./CertificateTableClient";
import CertificateControls from "./CertificateControls";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

async function getCertificates(session: any) {
  const userRole = session?.user?.role;
  const userFacultyId = session?.user?.facultyId;

  const certs = await prisma.certificate.findMany({
    where: userRole === 'DEAN' && userFacultyId ? {
      student: { facultyId: userFacultyId }
    } : {},
    include: {
      student: {
        include: { faculty: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Only return the user's faculty if they are a DEAN, otherwise all faculties.
  const faculties = await prisma.faculty.findMany({
    where: userRole === 'DEAN' && userFacultyId ? {
      id: userFacultyId
    } : {}
  });
  
  return { certs, faculties };
}

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  const { certs: certificates, faculties } = await getCertificates(session);
  const userRole = (session?.user as any)?.role;

  return (
    <div>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Sertifikatlar</h1>
        <div className="flex items-center gap-4">
          <CertificateControls certs={certificates} faculties={faculties} userRole={userRole} />
        </div>
      </header>

      <CertificateTableClient certs={certificates} faculties={faculties} userRole={userRole} />
    </div>
  );
}
