import CreateLiteratureForm from "./CreateLiteratureForm";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export default async function CreateLiteraturePage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const userFacultyId = (session?.user as any)?.facultyId;

  const faculties = await prisma.faculty.findMany({
    where: userRole === "DEAN" && userFacultyId ? {
      id: userFacultyId
    } : {}
  });

  return (
    <CreateLiteratureForm faculties={faculties} userRole={userRole} />
  );
}
