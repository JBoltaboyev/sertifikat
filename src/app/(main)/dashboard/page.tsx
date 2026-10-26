import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import RecentCertsWidget from "./RecentCertsWidget";

export const dynamic = "force-dynamic";

async function getStats(session: any) {
  const userRole = session?.user?.role;
  const userFacultyId = session?.user?.facultyId;

  const isDean = userRole === 'DEAN' && userFacultyId;
  const facultyWhere = isDean ? { facultyId: userFacultyId } : {};
  const studentWhere = isDean ? { student: { facultyId: userFacultyId } } : {};
  const teacherWhere = isDean ? { teacher: { facultyId: userFacultyId } } : {};

  const [
    totalStudents,
    studentCertCount,
    teacherCertCount,
    totalTeachers,
    allFaculties,
    certs,
    teacherCerts,
    certDatesOnly,
    teacherCertDates
  ] = await Promise.all([
    prisma.student.count({
      where: {
        ...facultyWhere,
        certificates: { some: {} }
      }
    }),
    prisma.certificate.count({ where: studentWhere }),
    prisma.teacherCertificate.count({ where: teacherWhere }),
    prisma.teacher.count({
      where: {
        ...facultyWhere,
        certificates: { some: {} }
      }
    }),
    prisma.faculty.findMany({
      include: {
        students: { select: { certificates: { select: { id: true } } } },
        teachers: { select: { certificates: { select: { id: true } } } }
      }
    }),
    prisma.certificate.findMany({
      where: studentWhere,
      select: {
        level: true,
        type: true,
        student: { select: { district: true } }
      }
    }),
    prisma.teacherCertificate.findMany({
      where: teacherWhere,
      select: {
        level: true,
        type: true,
        teacher: { select: { district: true } }
      }
    }),
    prisma.certificate.findMany({
      where: studentWhere,
      select: { createdAt: true, issueDate: true }
    }),
    prisma.teacherCertificate.findMany({
      where: teacherWhere,
      select: { createdAt: true, issueDate: true }
    })
  ]);

  const totalCertificates = studentCertCount + teacherCertCount;

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
  }).sort((a, b) => b.certCount - a.certCount);

  let myFacultyRank = null;
  let myFacultyStats = null;
  if (isDean) {
    myFacultyRank = facultiesStats.findIndex(f => f.id === userFacultyId) + 1;
    myFacultyStats = facultiesStats.find(f => f.id === userFacultyId);
  }

  const levels: Record<string, number> = {};
  const types: Record<string, number> = {};

  [...certs, ...teacherCerts].forEach(c => {
    const l = c.level || 'Boshqa';
    const t = c.type || 'Boshqa';
    levels[l] = (levels[l] || 0) + 1;
    types[t] = (types[t] || 0) + 1;
  });

  const certLevels = Object.entries(levels).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  const certTypes = Object.entries(types).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  const normalizeDistrict = (district: string | null | undefined): string => {
    if (!district) return "Noma'lum";
    const d = district.trim();
    if (!d) return "Noma'lum";
    return d.toLowerCase().replace(/(?:^|\s|-)\S/g, char => char.toUpperCase());
  };

  const dCounts: Record<string, number> = {};
  certs.forEach(c => {
    const d = normalizeDistrict(c.student?.district);
    dCounts[d] = (dCounts[d] || 0) + 1;
  });
  teacherCerts.forEach(tc => {
    const d = normalizeDistrict(tc.teacher?.district);
    dCounts[d] = (dCounts[d] || 0) + 1;
  });

  const districtCounts = Object.entries(dCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  const allDates = [...certDatesOnly, ...teacherCertDates].map(c => {
    if (c.issueDate) {
      const d = new Date(c.issueDate);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return c.createdAt.toISOString();
  });

  return { 
    totalStudents,
    allDates, 
    totalCertificates, 
    totalTeachers,
    faculties: isDean ? [] : facultiesStats,
    myFacultyRank,
    myFacultyStats,
    userRole,
    certLevels,
    certTypes,
    districtCounts
  };
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
    const percentage = totalDistricts > 0 ? (d.value / totalDistricts) * 100 : 0;
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
