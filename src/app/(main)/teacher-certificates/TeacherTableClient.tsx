"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTeacherCertificate, addSingleTeacherCertificate } from "./actions";
import { FACULTY_DEPARTMENTS } from "./TeacherControls";

export default function TeacherTableClient({ certs, faculties, userRole }: { certs: any[], faculties: any[], userRole?: string }) {
  const router = useRouter();
  const [editingCert, setEditingCert] = useState<any>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    fullName: "",
    pinfl: "",
    birthDate: "",
    phone: "",
    district: "",
    address: "",
    facultyName: "",
    department: "",
    language: "",
    type: "",
    level: "",
    certNumber: "",
    issueDate: ""
  });

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const match = dateStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (match) {
      const [, d, m, y] = match;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return dateStr;
  };

  const openEditModal = (cert: any) => {
    setFormData({
      fullName: cert.teacher.fullName || "",
      pinfl: cert.teacher.pinfl || "",
      birthDate: formatDateForInput(cert.teacher.birthDate || ""),
      phone: cert.teacher.phone || "",
      district: cert.teacher.district || "",
      address: cert.teacher.address || "",
      facultyName: cert.teacher.faculty?.name || "",
      department: cert.teacher.department || "",
      language: cert.language || "",
      type: cert.type || "",
      level: cert.level || "",
      certNumber: cert.certNumber || "",
      issueDate: formatDateForInput(cert.issueDate || "")
    });
    setFile(null);
    setEditingCert(cert);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });
    if (file) {
      submitData.append("file", file);
    }
    
    const result = await addSingleTeacherCertificate(submitData);
    if (result.success) {
      setEditingCert(null);
      setFile(null);
      router.refresh();
    } else {
      alert("Xatolik: " + result.error);
    }
  };

  const handleDelete = async (certId: string) => {
    if (!confirm("Ushbu o'qituvchi sertifikatini o'chirmoqchimisiz?")) return;
    const result = await deleteTeacherCertificate(certId);
    if (result.success) {
      router.refresh();
    } else {
      alert("Xatolik: " + result.error);
    }
  };

  const filteredCerts = certs.filter(c => {
    const f1 = !selectedFaculty || c.teacher.faculty?.id === selectedFaculty;
    const f2 = !selectedDepartment || c.teacher.department === selectedDepartment;
    
    let matchDate = true;
    if (selectedDate) {
      const rawDate = (c.issueDate || "").toLowerCase();
      const dotDate = c.issueDate ? c.issueDate.split('-').reverse().join('.') : ""; // 2025-05-12 -> 12.05.2025
      const query = selectedDate.toLowerCase();
      matchDate = rawDate.includes(query) || dotDate.includes(query);
    }
    
    const f4 = !selectedLevel || (c.level || "").toLowerCase().includes(selectedLevel.toLowerCase());
    const f5 = !selectedType || c.type === selectedType;
    const f6 = !selectedLanguage || c.language === selectedLanguage;
    return f1 && f2 && matchDate && f4 && f5 && f6;
  });

  const uniqueLanguages = Array.from(new Set(certs.map(c => c.language).filter(Boolean)));

  return (
    <>
      <div className="card glass no-print" style={{ marginBottom: '2rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          
          {userRole === 'ADMIN' && (
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="label">Fakultet</label>
              <select 
                className="input" 
                value={selectedFaculty} 
                onChange={(e) => { setSelectedFaculty(e.target.value); setSelectedDepartment(""); }}
              >
                <option value="">Barchasi</option>
                {faculties.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {(() => {
            let deps: string[] = [];
            if (userRole === 'ADMIN') {
              if (selectedFaculty) {
                const faculty = faculties.find((f: any) => f.id === selectedFaculty);
                deps = faculty ? (FACULTY_DEPARTMENTS[faculty.name] || []) : [];
              } else {
                deps = Object.values(FACULTY_DEPARTMENTS).flat();
              }
            } else {
              const currentFacultyName = faculties[0]?.name || "";
              deps = FACULTY_DEPARTMENTS[currentFacultyName] || [];
            }
            
            if (deps.length > 0) {
              return (
                <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="label">Kafedra</label>
                  <select 
                    className="input" 
                    value={selectedDepartment} 
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">Barchasi</option>
                    {deps.map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              );
            }
            return null;
          })()}

          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="label">Berilgan sana</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Yil yoki sana (2025, 12.05)..."
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="label">Turi</label>
            <select 
              className="input" 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Barchasi</option>
              <option value="Xalqaro">Xalqaro</option>
              <option value="Milliy">Milliy</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="label">Til</label>
            <select 
              className="input" 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="">Barchasi</option>
              {uniqueLanguages.map((lang: any) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="label">Daraja</label>
            <select 
              className="input" 
              value={selectedLevel} 
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="">Barchasi</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rasmiy Hujjat Sarlavhasi (Faqat chop etilganda chiqadi) */}
      <div className="print-only document-header">
        <div className="doc-institution">O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI</div>
        <div className="doc-subtitle">PROFESSOR-O'QITUVCHILARNING CHET TILI SERTIFIKATLARI BO'YICHA MA'LUMOTNOMA (VEDOMOST)</div>
        <div className="doc-meta-grid">
          <div><strong>Fakultet:</strong> {selectedFaculty ? faculties.find((f: any) => f.id === selectedFaculty)?.name : "Barcha fakultetlar"}</div>
          {selectedDepartment && <div><strong>Kafedra:</strong> {selectedDepartment}</div>}
          <div><strong>Jami ro'yxatda:</strong> {filteredCerts.length} nafar o'qituvchi</div>
          <div><strong>Sana:</strong> {new Date().toLocaleDateString('uz-UZ')}</div>
          {(selectedLanguage || selectedLevel || selectedType || selectedDate) && (
            <div>
              <strong>Qo'llangan filtr:</strong> {[
                selectedLanguage && `Til: ${selectedLanguage}`,
                selectedLevel && `Daraja: ${selectedLevel}`,
                selectedType && `Turi: ${selectedType}`,
                selectedDate && `Sana: ${selectedDate}`
              ].filter(Boolean).join(" | ")}
            </div>
          )}
        </div>
      </div>

      <div className="card glass">
        <div className="card-body table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>№</th>
                <th>F.I.Sh</th>
                <th>Fakulteti</th>
                <th>Kafedrasi</th>
                <th>JSHSHIR / Pasport</th>
                <th>Tug'ilgan sana</th>
                <th>Telefon</th>
                <th>Til</th>
                <th>Turi</th>
                <th>Daraja</th>
                <th>Sertifikat Raqami</th>
                <th>Berilgan sana</th>
                <th>Tuman/Shahar</th>
                <th>Yashash manzili</th>
                <th className="no-print">Fayl</th>
                <th className="no-print">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '2rem' }}>
                    Sertifikatlar hozircha yo'q.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert, index) => (
                  <tr key={cert.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 500 }}>{cert.teacher.fullName}</td>
                    <td>{cert.teacher.faculty?.name}</td>
                    <td>{cert.teacher.department || '-'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{cert.teacher.pinfl}</td>
                    <td>{cert.teacher.birthDate || '-'}</td>
                    <td>{cert.teacher.phone || '-'}</td>
                    <td><span className="badge badge-primary">{cert.language}</span></td>
                    <td><span className="badge" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-main)' }}>{cert.type || '-'}</span></td>
                    <td><span className="badge badge-success">{cert.level}</span></td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{cert.certNumber}</td>
                    <td>{cert.issueDate || '-'}</td>
                    <td>{cert.teacher.district || '-'}</td>
                    <td>{cert.teacher.address || '-'}</td>
                    <td className="no-print" style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {cert.fileUrl ? (
                        <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="badge badge-success" style={{ textDecoration: 'none', padding: '0.4rem 0.6rem' }}>
                          Ko'rish
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td className="no-print" style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem', fontSize: '0.75rem' }} onClick={() => openEditModal(cert)}>
                        Tahrirlash
                      </button>
                      {userRole === 'ADMIN' && (
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', borderColor: 'var(--danger)', color: 'var(--danger)', fontSize: '0.75rem' }} onClick={() => handleDelete(cert.id)}>
                          O'chirish
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rasmiy Hujjat Tasdiqlash va Imzo Bloki (Faqat chop etilganda chiqadi) */}
      <div className="print-only document-footer">
        <div className="doc-signatures">
          <div className="sig-block">
            <div className="sig-title">Mas'ul xodim (Dekan / Prorektor):</div>
            <div className="sig-line">__________________________ (F.I.Sh.)</div>
            <div className="sig-hint">(imzo)</div>
          </div>
          <div className="sig-block">
            <div className="sig-title">Tekshirdi (Monitoring bo'limi):</div>
            <div className="sig-line">__________________________ (F.I.Sh.)</div>
            <div className="sig-hint">(imzo)</div>
          </div>
          <div className="sig-stamp-block">
            <div className="sig-stamp-box">M.O'.</div>
            <div className="sig-date">Sana: "____" ____________ 202___ y.</div>
          </div>
        </div>
      </div>

      {editingCert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header flex justify-between items-center">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>O'qituvchi Sertifikatini Tahrirlash</h3>
              <button onClick={() => setEditingCert(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">F.I.Sh</label>
                  <input required type="text" className="input" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="label">JSHSHIR / Pasport</label>
                  <input required type="text" className="input" value={formData.pinfl} readOnly title="O'zgartirib bo'lmaydi" style={{ backgroundColor: 'var(--surface-alt)' }} />
                </div>
                {userRole === 'ADMIN' && (
                  <div className="input-group">
                    <label className="label">Fakulteti</label>
                    <select required className="input" value={formData.facultyName} onChange={e => setFormData({...formData, facultyName: e.target.value, department: ""})}>
                      <option value="">Fakultetni tanlang</option>
                      {faculties.map((f: any) => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(() => {
                  const currentFacultyName = userRole === 'ADMIN' ? formData.facultyName : (faculties[0]?.name || "");
                  const deps = currentFacultyName ? (FACULTY_DEPARTMENTS[currentFacultyName] || []) : [];
                  if (deps.length > 0) {
                    return (
                      <div className="input-group">
                        <label className="label">Kafedra</label>
                        <select required className="input" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                          <option value="">Kafedrani tanlang</option>
                          {deps.map((d: string) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="input-group">
                  <label className="label">Sertifikat Raqami</label>
                  <input required type="text" className="input" value={formData.certNumber} readOnly title="O'zgartirib bo'lmaydi" style={{ backgroundColor: 'var(--surface-alt)' }} />
                </div>
                <div className="input-group">
                  <label className="label">Til</label>
                  <input required type="text" className="input" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="label">Turi</label>
                  <select required className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="">Turini tanlang</option>
                    <option value="Xalqaro">Xalqaro</option>
                    <option value="Milliy">Milliy</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Daraja</label>
                  <select required className="input" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                    <option value="">Tanlang</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Berilgan sana</label>
                  <input type="date" className="input" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="label">Tug'ilgan sana</label>
                  <input type="date" className="input" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="label">Telefon</label>
                  <input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="label">Tuman / Shahar</label>
                  <input type="text" className="input" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Yashash manzili</label>
                  <input type="text" className="input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Sertifikat fayli (Faqat PDF, majburiy emas)</label>
                  <input type="file" className="input" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                  {editingCert?.fileUrl && <small style={{ color: 'var(--success)', marginTop: '0.25rem' }}>Hozirgi fayl biriktirilgan.</small>}
                </div>
                
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingCert(null)}>Bekor qilish</button>
                  <button type="submit" className="btn btn-primary">Saqlash</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
