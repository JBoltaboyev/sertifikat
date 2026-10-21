"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addSingleLiterature } from "../actions";
import { FACULTY_DEPARTMENTS } from "../../teacher-certificates/TeacherControls";
import { LITERATURE_TYPES } from "../AcademicControls";

export default function CreateLiteratureForm({
  faculties,
  userRole
}: {
  faculties: any[];
  userRole?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [grifFile, setGrifFile] = useState<File | null>(null);

  const initialFormState = {
    facultyName: userRole === "DEAN" ? (faculties[0]?.name || "") : (faculties[0]?.name || ""),
    department: "",
    author: "",
    coAuthors: "",
    title: "",
    type: "O'quv qo'llanma",
    publishDate: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      if (bookFile) {
        submitData.append("bookFile", bookFile);
      }
      if (grifFile) {
        submitData.append("grifFile", grifFile);
      }

      const result = await addSingleLiterature(submitData);
      if (result.success) {
        alert("Adabiyot muvaffaqiyatli qo'shildi!");
        router.push("/academic-activity");
        router.refresh();
      } else {
        alert("Xatolik: " + result.error);
      }
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentFaculty = userRole === "DEAN" ? (faculties[0]?.name || "") : formData.facultyName;
  const availableDepartments = FACULTY_DEPARTMENTS[currentFaculty] || [];

  return (
    <div style={{ maxWidth: "850px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <Link
            href="/academic-activity"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--primary)",
              fontWeight: 500,
              fontSize: "0.875rem",
              marginBottom: "0.5rem"
            }}
          >
            &larr; Adabiyotlar ro'yxatiga qaytish
          </Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)" }}>
            Yangi Adabiyot Qo'shish
          </h1>
        </div>
      </div>

      <div
        className="card glass"
        style={{
          borderRadius: "0.75rem",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
        }}
      >
        <div className="card-body" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {userRole === "ADMIN" ? (
              <div className="input-group">
                <label className="label">Fakultet</label>
                <select
                  required
                  className="input"
                  value={formData.facultyName}
                  onChange={(e) =>
                    setFormData({ ...formData, facultyName: e.target.value, department: "" })
                  }
                >
                  <option value="">Fakultetni tanlang</option>
                  {faculties.map((f: any) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="input-group">
                <label className="label">Fakultet</label>
                <input
                  type="text"
                  className="input"
                  disabled
                  value={faculties[0]?.name || ""}
                />
              </div>
            )}

            <div className="input-group">
              <label className="label">Kafedra</label>
              {availableDepartments.length > 0 ? (
                <select
                  className="input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">Kafedrani tanlang</option>
                  {availableDepartments.map((d: string) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input"
                  placeholder="Kafedra nomini kiriting"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              )}
            </div>

            <div className="input-group">
              <label className="label">Muallif (F.I.Sh)</label>
              <input
                required
                type="text"
                className="input"
                placeholder="Masalan: Jam"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="label">Hammualliflar</label>
              <input
                type="text"
                className="input"
                placeholder="Masalan: Aliyev B., Karimova D. (yoki -)"
                value={formData.coAuthors}
                onChange={(e) => setFormData({ ...formData, coAuthors: e.target.value })}
              />
            </div>

            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label className="label">Adabiyot Nomi</label>
              <input
                required
                type="text"
                className="input"
                placeholder="Masalan: Asda"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="label">Turi</label>
              <select
                required
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {LITERATURE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="label">Chop etilgan sana</label>
              <input
                type="date"
                className="input"
                value={formData.publishDate}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="label">Kitob fayli (PDF/Hujjat)</label>
              <input
                type="file"
                className="input"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setBookFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="input-group">
              <label className="label">Grif fayli (PDF/Rasm)</label>
              <input
                type="file"
                className="input"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setGrifFile(e.target.files?.[0] || null)}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid #E5E7EB"
              }}
            >
              <Link href="/academic-activity" className="btn btn-outline">
                Bekor qilish
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{
                  backgroundColor: "#4F46E5",
                  color: "#FFFFFF",
                  padding: "0.5rem 1.5rem"
                }}
              >
                {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
