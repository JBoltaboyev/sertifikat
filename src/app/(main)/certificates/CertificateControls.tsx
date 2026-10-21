"use client";

import { useRef, useState } from "react";
import * as xlsx from "xlsx";
import { useRouter } from "next/navigation";
import { importCertificates, addSingleCertificate } from "./actions";

export default function CertificateControls({ certs, faculties, userRole }: { certs: any[], faculties: any[], userRole?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    pinfl: "",
    birthDate: "",
    phone: "",
    district: "",
    address: "",
    facultyName: "",
    language: "",
    type: "",
    level: "",
    certNumber: "",
    issueDate: ""
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!certs || certs.length === 0) {
      alert("Eksport qilish uchun ma'lumot yo'q!");
      return;
    }
    
    const dataToExport = certs.map((c, i) => ({
      "№": i + 1,
      "FISH": c.student.fullName,
      "JSHSHIR yoki pasport seriyasi": c.student.pinfl,
      "Tug'ilgan kun, oy, yil": c.student.birthDate || "",
      "Telefon raqami": c.student.phone || "",
      "Xorijiy til": c.language,
      "Sertifikat olgan sanasi va yili": c.issueDate || "",
      "Sertifikat seriya raqami": c.certNumber,
      "Sertifikat darajasi": c.level,
      "Turi": c.type || "",
      "Tuman va shahar": c.student.district || "",
      "Yashash manzili": c.student.address || "",
      "Fakulteti": c.student.faculty.name || ""
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sertifikatlar");
    xlsx.writeFile(workbook, "Sertifikatlar_Export.xlsx");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      const result = await importCertificates(jsonData);
      if (result.success) {
        router.refresh();
      } else {
        alert("Xatolik yuz berdi: " + result.error);
      }
    } catch (error: any) {
      alert("Faylni o'qishda xatolik: " + error.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });
    if (file) {
      submitData.append("file", file);
    }

    const result = await addSingleCertificate(submitData);
    if (result.success) {
      setIsModalOpen(false);
      setFormData({
        fullName: "", pinfl: "", birthDate: "", phone: "", district: "", address: "",
        facultyName: "", language: "", type: "", level: "", certNumber: "", issueDate: ""
      });
      setFile(null);
      router.refresh();
    } else {
      alert("Xatolik: " + result.error);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 no-print" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => setIsModalOpen(true)}>
          + Yangi Qo'shish
        </button>
        <button className="btn btn-primary" style={{ backgroundColor: '#10B981', padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={handleImportClick} disabled={isImporting}>
          {isImporting ? "Yuklanmoqda..." : "Excel Import"}
        </button>
        <button className="btn btn-primary" style={{ backgroundColor: '#4F46E5', padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={handleExport}>
          Excel Export
        </button>
        <button className="btn btn-primary" style={{ backgroundColor: '#6B7280', padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={handlePrint}>
          Print
        </button>
      </div>
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header flex justify-between items-center">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Yangi Sertifikat Qo'shish</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleModalSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">F.I.Sh</label>
                  <input required type="text" className="input" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="label">JSHSHIR / Pasport</label>
                  <input required type="text" className="input" value={formData.pinfl} onChange={e => setFormData({...formData, pinfl: e.target.value})} />
                </div>
                {userRole === 'ADMIN' && (
                  <div className="input-group">
                    <label className="label">Fakulteti</label>
                    <select required className="input" value={formData.facultyName} onChange={e => setFormData({...formData, facultyName: e.target.value})}>
                      <option value="">Fakultetni tanlang</option>
                      {faculties.map((f: any) => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="input-group">
                  <label className="label">Sertifikat Raqami</label>
                  <input required type="text" className="input" value={formData.certNumber} onChange={e => setFormData({...formData, certNumber: e.target.value})} />
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
                  <input type="text" className="input" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
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
                  <label className="label">Sertifikat fayli (Faqat PDF)</label>
                  <input type="file" className="input" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
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
