"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import fs from "fs";
import path from "path";

export async function importTeacherCertificates(data: any[]) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userFacultyId = (session?.user as any)?.facultyId;
    let count = 0;
    
    // Cache faculties
    const faculties = await prisma.faculty.findMany();
    let defaultFaculty = faculties[0];

    if (!defaultFaculty) {
      defaultFaculty = await prisma.faculty.create({
        data: { name: 'Asosiy Fakultet' }
      });
      faculties.push(defaultFaculty);
    }
    
    for (const row of data) {
      const pinfl = String(row["JSHSHIR yoki pasport seriyasi"] || "").trim();
      if (!pinfl) continue;

      const certNumber = String(row["Sertifikat seriya raqami"] || "").trim();
      if (!certNumber) continue;

      // Handle Faculty logic depending on role
      let matchedFaculty;
      
      if (userRole === 'DEAN' && userFacultyId) {
        // Force the dean's faculty regardless of what the Excel says
        matchedFaculty = faculties.find(f => f.id === userFacultyId) || defaultFaculty;
      } else {
        const facultyName = String(row["Fakulteti"] || "").trim();
        matchedFaculty = facultyName 
          ? faculties.find(f => f.name.toLowerCase() === facultyName.toLowerCase())
          : defaultFaculty;

        if (facultyName && !matchedFaculty) {
          matchedFaculty = await prisma.faculty.create({
            data: { name: facultyName }
          });
          faculties.push(matchedFaculty);
        }
      }
      
      const facultyId = matchedFaculty ? matchedFaculty.id : defaultFaculty.id;

      // Upsert Teacher
      const teacher = await prisma.teacher.upsert({
        where: { pinfl: pinfl },
        update: {
          fullName: row["FISH"] || "",
          birthDate: String(row["Tug'ilgan kun, oy, yil"] || ""),
          phone: String(row["Telefon raqami"] || ""),
          district: String(row["Tuman va shahar"] || ""),
          address: String(row["Yashash manzili"] || ""),
          facultyId: facultyId
        },
        create: {
          pinfl: pinfl,
          fullName: row["FISH"] || "",
          birthDate: String(row["Tug'ilgan kun, oy, yil"] || ""),
          phone: String(row["Telefon raqami"] || ""),
          district: String(row["Tuman va shahar"] || ""),
          address: String(row["Yashash manzili"] || ""),
          facultyId: facultyId,
          department: "",
          position: ""
        }
      });

      // Upsert TeacherCertificate
      await prisma.teacherCertificate.upsert({
        where: { certNumber: certNumber },
        update: {
          language: String(row["Xorijiy til (ingiliz, nemis va boshqa chet tillari)"] || row["Xorijiy til"] || ""),
          issueDate: String(row["Sertifikat olgan sanasi va yili"] || ""),
          level: String(row["Sertifikat darajasi"] || ""),
        },
        create: {
          certNumber: certNumber,
          teacherId: teacher.id,
          language: String(row["Xorijiy til (ingiliz, nemis va boshqa chet tillari)"] || row["Xorijiy til"] || ""),
          issueDate: String(row["Sertifikat olgan sanasi va yili"] || ""),
          level: String(row["Sertifikat darajasi"] || ""),
        }
      });

      count++;
    }

    return { success: true, count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addSingleTeacherCertificate(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userFacultyId = (session?.user as any)?.facultyId;

    const data = {
      fullName: (formData.get("fullName") as string) || "",
      pinfl: (formData.get("pinfl") as string) || "",
      birthDate: (formData.get("birthDate") as string) || "",
      phone: (formData.get("phone") as string) || "",
      district: (formData.get("district") as string) || "",
      address: (formData.get("address") as string) || "",
      facultyName: (formData.get("facultyName") as string) || "",
      department: (formData.get("department") as string) || "",
      language: (formData.get("language") as string) || "",
      type: (formData.get("type") as string) || "",
      level: (formData.get("level") as string) || "",
      certNumber: (formData.get("certNumber") as string) || "",
      issueDate: (formData.get("issueDate") as string) || "",
    };

    let faculty;
    
    if (userRole === 'DEAN' && userFacultyId) {
      faculty = await prisma.faculty.findUnique({
        where: { id: userFacultyId }
      });
    } else {
      faculty = await prisma.faculty.findFirst({
        where: { name: data.facultyName || 'Asosiy Fakultet' }
      });

      if (!faculty) {
        faculty = await prisma.faculty.create({
          data: { name: data.facultyName || 'Asosiy Fakultet' }
        });
      }
    }

    if (!faculty) {
      return { success: false, error: "Fakultet topilmadi" };
    }

    const teacher = await prisma.teacher.upsert({
      where: { pinfl: data.pinfl },
      update: {
        fullName: data.fullName,
        birthDate: data.birthDate,
        phone: data.phone,
        district: data.district,
        address: data.address,
        facultyId: faculty.id,
        department: data.department
      },
      create: {
        pinfl: data.pinfl,
        fullName: data.fullName,
        birthDate: data.birthDate,
        phone: data.phone,
        district: data.district,
        address: data.address,
        facultyId: faculty.id,
        department: data.department,
        position: ""
      }
    });

    let fileUrl: string | undefined = undefined;
    const file = formData.get("file") as File | null;
    
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || ".pdf";
      const filename = `teacher_${data.certNumber.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/teacher-certificates");
      
      if (!fs.existsSync(uploadDir)) {
        await fs.promises.mkdir(uploadDir, { recursive: true });
      }
      
      await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
      fileUrl = `/uploads/teacher-certificates/${filename}`;
    }

    await prisma.teacherCertificate.upsert({
      where: { certNumber: data.certNumber },
      update: {
        language: data.language,
        type: data.type,
        issueDate: data.issueDate,
        level: data.level,
        ...(fileUrl ? { fileUrl } : {})
      },
      create: {
        certNumber: data.certNumber,
        teacherId: teacher.id,
        language: data.language,
        type: data.type,
        issueDate: data.issueDate,
        level: data.level,
        ...(fileUrl ? { fileUrl } : {})
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTeacherCertificate(certId: string) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userFacultyId = (session?.user as any)?.facultyId;

    if (userRole === 'DEAN' && userFacultyId) {
      const cert = await prisma.teacherCertificate.findUnique({
        where: { id: certId },
        include: { teacher: true }
      });
      if (cert?.teacher?.facultyId !== userFacultyId) {
        return { success: false, error: "Sizda bu sertifikatni o'chirish huquqi yo'q!" };
      }
    }

    await prisma.teacherCertificate.delete({
      where: { id: certId }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
