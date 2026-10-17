import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const defaultPassword = await bcrypt.hash('password123', 10);
  const facultiesData = [
    'Filologiya fakulteti',
    'Pedagogika fakulteti',
    'Boshlang\'ich ta\'lim fakulteti',
    'Aniq va tabiiy fanlar fakulteti',
    'Ijtimoiy va amaliy fanlar fakulteti',
    'Magistratura bo\'limi'
  ];

  const faculties = [];
  for (const name of facultiesData) {
    const faculty = await prisma.faculty.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    faculties.push(faculty);
  }

  // Create Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: defaultPassword },
    create: {
      username: 'admin',
      password: defaultPassword,
      role: 'ADMIN',
    }
  });

  // Create Deans
  for (let i = 0; i < faculties.length; i++) {
    const faculty = faculties[i];
    const username = `dekan${i + 1}`;
    await prisma.user.upsert({
      where: { username },
      update: { password: defaultPassword },
      create: {
        username,
        password: defaultPassword,
        role: 'DEAN',
        facultyId: faculty.id
      }
    });
  }

  console.log('Database seeded with 1 admin and 5 deans.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
