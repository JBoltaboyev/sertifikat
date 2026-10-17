import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import RecentCertsWidget from "./RecentCertsWidget";

export const dynamic = "force-dynamic";

async function getStats(session: any) {
  try {
    const userRole = session?.user?.role;
    const userFacultyId = session?.user?.facultyId;

    const totalStudents = await prisma.student.count({
      where: {
        ...(userRole === 'DEAN' && userFacultyId ? { facultyId: userFacultyId } : {}),
        certificates: {
          some: {}
        }
      }
    });
    const totalStudentCertificates = await prisma.certificate.count({
      where: userRole === 'DEAN' && userFacultyId ? { student: { facultyId: userFacultyId } } : {}
    });
    const totalTeacherCertificates = await prisma.teacherCertificate.count({
      where: userRole === 'DEAN' && userFacultyId ? { teacher: { facultyId: userFacultyId } } : {}
    });
    const totalCertificates = totalStudentCertificates + totalTeacherCertificates;

    const totalTeachers = await prisma.teacher.count({
      where: {
        ...(userRole === 'DEAN' && userFacultyId ? { facultyId: userFacultyId } : {}),
        certificates: {
          some: {}
        }
      }
    });

    // To calculate rank, we need cert counts per faculty.
    const allFaculties = await prisma.faculty.findMany({
      include: {
        students: {
          include: {
            certificates: true
          }
        },
        teachers: {
          include: {
            certificates: true
          }
        }
      }
    });

    const facultiesStats = allFaculties.map(f => {
      const certCount = f.students.reduce((acc, s) => acc + s.certificates.length, 0) + 
                        f.teachers.reduce((acc, t) => acc + t.certificates.length, 0);
      const studentsWithCerts = f.students.filter(s => s.certificates.length > 0).length;
      const teachersWithCerts = f.teachers.filter(t => t.certificates.length > 0).length;
      return {
        id: f.id,
        name: f.name,
        studentsCount: studentsWithCerts,
        teachersCount: teachersWithCerts,
        certCount
      };
    }).sort((a, b) => b.certCount - a.certCount); // Sort by cert count descending

    let myFacultyRank = null;
    let myFacultyStats = null;
    if (userRole === 'DEAN' && userFacultyId) {
      myFacultyRank = facultiesStats.findIndex(f => f.id === userFacultyId) + 1;
      myFacultyStats = facultiesStats.find(f => f.id === userFacultyId);
    }

    // YANGA QO'SHIMCHALAR: Turi, darajasi va tumanlar bo'yicha statistika
    const certs = await prisma.certificate.findMany({
      where: userRole === 'DEAN' && userFacultyId ? { student: { facultyId: userFacultyId } } : {},
      select: { level: true, type: true }
    });
    const teacherCerts = await prisma.teacherCertificate.findMany({
      where: userRole === 'DEAN' && userFacultyId ? { teacher: { facultyId: userFacultyId } } : {},
      select: { level: true, type: true }
    });

    const levels: Record<string, number> = {};
    const types: Record<string, number> = {};

    certs.forEach(c => {
      const l = c.level || 'Boshqa';
      const t = c.type || 'Boshqa';
      levels[l] = (levels[l] || 0) + 1;
      types[t] = (types[t] || 0) + 1;
    });

    teacherCerts.forEach(c => {
      const l = c.level || 'Boshqa';
      const t = c.type || 'Boshqa';
      levels[l] = (levels[l] || 0) + 1;
      types[t] = (types[t] || 0) + 1;
    });

    const certLevels = Object.entries(levels).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const certTypes = Object.entries(types).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // Tumanlar bo'yicha statistika (Faqat talabalar)
    const studentsList = await prisma.student.findMany({
      where: userRole === 'DEAN' && userFacultyId ? { facultyId: userFacultyId } : {},
      select: { district: true }
    });

    const dCounts: Record<string, number> = {};
    studentsList.forEach(p => {
      let d = p.district?.trim();
      if (!d) d = 'Noma\'lum';
      dCounts[d] = (dCounts[d] || 0) + 1;
    });
    const districtCounts = Object.entries(dCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    const certDatesOnly = await prisma.certificate.findMany({
      where: userRole === 'DEAN' && userFacultyId ? { student: { facultyId: userFacultyId } } : {},
      select: { createdAt: true, issueDate: true }
    });
    const teacherCertDates = await prisma.teacherCertificate.findMany({
      where: userRole === 'DEAN' && userFacultyId ? { teacher: { facultyId: userFacultyId } } : {},
      select: { createdAt: true, issueDate: true }
    });

    const parseCertDate = (issueDate: string | null, createdAt: Date): string => {
      if (issueDate) {
        const trimmed = issueDate.trim();
        const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
        if (dmyMatch) {
          const d = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      return createdAt.toISOString();
    };

    const allDates = [
      ...certDatesOnly.map(c => parseCertDate(c.issueDate, c.createdAt)),
      ...teacherCertDates.map(c => parseCertDate(c.issueDate, c.createdAt))
    ];

    return { 
      totalStudents,
      allDates, 
      totalCertificates, 
      totalTeachers,
      faculties: userRole === 'DEAN' ? [] : facultiesStats,
      myFacultyRank,
      myFacultyStats,
      userRole,
      certLevels,
      certTypes,
      districtCounts
    };
  } catch (error) {
    console.error("Dashboard getStats error:", error);
    throw error;
  }
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const { totalStudents, allDates, totalCertificates, totalTeachers, faculties, myFacultyRank, myFacultyStats, userRole, certLevels, certTypes, districtCounts } = await getStats(session);

  const widgetStyle: React.CSSProperties = { 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    textAlign: 'center' 
  };

  // Pie chart uchun ranglar va burchaklarni hisoblash
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#14b8a6', '#f43f5e'];
  const totalDistricts = districtCounts.reduce((acc, d) => acc + d.value, 0);
  let currentAngle = 0;
  const gradientStops = districtCounts.map((d, i) => {
    const percentage = (d.value / totalDistricts) * 100;
    const color = colors[i % colors.length];
    const stop = `${color} ${currentAngle}% ${currentAngle + percentage}%`;
    currentAngle += percentage;
    return stop;
  }).join(', ');

  return (
    <div>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="badge badge-primary">{new Date().toLocaleDateString('uz-UZ')}</span>
        </div>
      </header>

      {userRole === 'DEAN' && myFacultyRank && (
        <div className="card glass" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>{myFacultyStats?.name}</h2>
              <p style={{ color: 'var(--text-muted)' }}>Umumiy institut reytingida sizning o'rningiz</p>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              #{myFacultyRank}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card glass" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'auto' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Jami Talabalar</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{totalStudents}</p>
            </div>
          </div>
        </div>
        <RecentCertsWidget certDates={allDates} totalCertificates={totalCertificates} />
        <div className="card glass" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'auto' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>O'qituvchilar</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#F59E0B' }}>{totalTeachers}</p>
            </div>
          </div>
        </div>

        {/* Turi va darajasi vidjeti */}
        <div className="card glass" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' }}>Sertifikatlar (Turi va Darajasi)</h3>
            <div style={{ display: 'flex', gap: '1rem', flex: 1, overflowY: 'auto' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--primary)' }}>Turi</h4>
                {certTypes.map(t => (
                  <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', paddingBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span>{t.name}</span>
                    <span style={{ fontWeight: 600 }}>{t.value}</span>
                  </div>
                ))}
                {certTypes.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ma'lumot yo'q</span>}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--primary)' }}>Daraja</h4>
                {certLevels.map(l => (
                  <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', paddingBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span>{l.name}</span>
                    <span style={{ fontWeight: 600 }}>{l.value}</span>
                  </div>
                ))}
                {certLevels.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ma'lumot yo'q</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tumanlar bo'yicha pitsa diagrammasi vidjeti */}
        <div className="card glass" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' }}>Hududlar kesimida</h3>
            
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '1rem', flex: 1, overflow: 'hidden' }}>
              {districtCounts.length > 0 ? (
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: `conic-gradient(${gradientStops})`,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  flexShrink: 0
                }} />
              ) : (
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.65rem',
                  flexShrink: 0
                }}>Chart</div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '110px', paddingRight: '0.25rem' }}>
                {districtCounts.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors[i % colors.length], flexShrink: 0 }}></span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }} title={d.name}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
                {districtCounts.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ma'lumot yo'q</span>}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {userRole === 'ADMIN' && (
        <div className="card glass">
          <div className="card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Fakultetlar kesimida</h3>
          </div>
          <div className="card-body table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fakultet</th>
                  <th style={{ textAlign: 'right' }}>Talabalar soni</th>
                  <th style={{ textAlign: 'right' }}>O'qituvchilar soni</th>
                  <th style={{ textAlign: 'right' }}>Sertifikatlar soni</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map((faculty: any) => (
                  <tr key={faculty.id}>
                    <td style={{ fontWeight: 500 }}>{faculty.name}</td>
                    <td style={{ textAlign: 'right' }}>{faculty.studentsCount}</td>
                    <td style={{ textAlign: 'right' }}>{faculty.teachersCount}</td>
                    <td style={{ textAlign: 'right' }}><span className="badge badge-success">{faculty.certCount}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
