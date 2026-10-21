const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create faculties
  const facultiesData = [
    'Kompyuter Injiniringi',
    'Dasturiy Injiniring',
    'Telekommunikatsiya',
    'Iqtisodiyot',
    'Axborot Xavfsizligi'
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
    update: {},
    create: {
      username: 'admin',
      password: 'password123', // In a real app, hash this!
      role: 'ADMIN',
    }
  });

  // Create Deans
  for (let i = 0; i < faculties.length; i++) {
    const faculty = faculties[i];
    const username = `dekan${i + 1}`;
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: 'password123', // In a real app, hash this!
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
