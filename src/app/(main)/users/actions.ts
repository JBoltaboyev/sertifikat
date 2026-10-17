"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function saveUser(data: {
  id?: string;
  fullName: string;
  username: string;
  password?: string;
  role: string;
  facultyId?: string | null;
}) {
  try {
    let hashedPassword = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    if (data.id) {
      // Update existing
      const updateData: any = {
        fullName: data.fullName,
        username: data.username,
        role: data.role,
        facultyId: data.role === 'ADMIN' ? null : data.facultyId
      };
      if (hashedPassword) {
        updateData.password = hashedPassword;
      }
      
      await prisma.user.update({
        where: { id: data.id },
        data: updateData
      });
    } else {
      // Create new
      await prisma.user.create({
        data: {
          fullName: data.fullName,
          username: data.username,
          password: hashedPassword || await bcrypt.hash('password123', 10),
          role: data.role,
          facultyId: data.role === 'ADMIN' ? null : data.facultyId
        }
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
