"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import fs from "fs";
import path from "path";

export async function addSingleLiterature(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Avtorizatsiyadan o'tilmagan" };
    }

    const userRole = (session.user as any)?.role;
    const userFacultyId = (session.user as any)?.facultyId;

    const id = formData.get("id") as string | null;
    const facultyName = formData.get("facultyName") as string;
    const department = formData.get("department") as string;
    const author = formData.get("author") as string;
    const coAuthors = formData.get("coAuthors") as string;
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const publishDate = formData.get("publishDate") as string;

    if (!author || !title || !type) {
      return { success: false, error: "Muallif, adabiyot nomi va turi kiritilishi shart" };
    }

    // Resolve Faculty
    let facultyId: string;
    if (userRole === "DEAN" && userFacultyId) {
      facultyId = userFacultyId;
    } else {
      if (!facultyName) {
        return { success: false, error: "Fakultetni tanlang" };
      }
      let faculty = await prisma.faculty.findUnique({
        where: { name: facultyName }
      });
      if (!faculty) {
        faculty = await prisma.faculty.create({
          data: { name: facultyName }
        });
      }
      facultyId = faculty.id;
    }

    // Upload book file if provided
    let fileUrl: string | undefined = undefined;
    const bookFile = formData.get("bookFile") as File | null;
    if (bookFile && bookFile.size > 0) {
      const buffer = Buffer.from(await bookFile.arrayBuffer());
      const ext = path.extname(bookFile.name) || ".pdf";
      const sanitizedTitle = (title || "kitob").replace(/[^a-z0-9]/gi, "_").substring(0, 30);
      const filename = `book_${sanitizedTitle}_${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/academic");
      if (!fs.existsSync(uploadDir)) {
        await fs.promises.mkdir(uploadDir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
      fileUrl = `/uploads/academic/${filename}`;
    }

    // Upload grif file if provided
    let grifUrl: string | undefined = undefined;
    const grifFile = formData.get("grifFile") as File | null;
    if (grifFile && grifFile.size > 0) {
      const buffer = Buffer.from(await grifFile.arrayBuffer());
      const ext = path.extname(grifFile.name) || ".pdf";
      const sanitizedTitle = (title || "grif").replace(/[^a-z0-9]/gi, "_").substring(0, 30);
      const filename = `grif_${sanitizedTitle}_${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/grif");
      if (!fs.existsSync(uploadDir)) {
        await fs.promises.mkdir(uploadDir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(uploadDir, filename), buffer);
      grifUrl = `/uploads/grif/${filename}`;
    }

    if (id) {
      // Update existing literature
      const existing = await prisma.literature.findUnique({ where: { id } });
      if (!existing) {
        return { success: false, error: "Adabiyot topilmadi" };
      }
      if (userRole === "DEAN" && existing.facultyId !== userFacultyId) {
        return { success: false, error: "Ruxsat etilmagan" };
      }

      await prisma.literature.update({
        where: { id },
        data: {
          facultyId,
          department: department || null,
          author,
          coAuthors: coAuthors ? coAuthors : "-",
          title,
          type,
          publishDate: publishDate || null,
          ...(fileUrl ? { fileUrl } : {}),
          ...(grifUrl ? { grifUrl } : {})
        }
      });
    } else {
      // Create new literature
      await prisma.literature.create({
        data: {
          facultyId,
          department: department || null,
          author,
          coAuthors: coAuthors ? coAuthors : "-",
          title,
          type,
          publishDate: publishDate || null,
          fileUrl: fileUrl || null,
          grifUrl: grifUrl || null
        }
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in addSingleLiterature:", error);
    return { success: false, error: error.message || "Xatolik yuz berdi" };
  }
}

export async function deleteLiterature(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Avtorizatsiyadan o'tilmagan" };
    }

    const userRole = (session.user as any)?.role;
    const userFacultyId = (session.user as any)?.facultyId;

    const existing = await prisma.literature.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Adabiyot topilmadi" };
    }

    if (userRole === "DEAN" && existing.facultyId !== userFacultyId) {
      return { success: false, error: "Ruxsat etilmagan" };
    }

    await prisma.literature.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteLiterature:", error);
    return { success: false, error: error.message || "Xatolik yuz berdi" };
  }
}
