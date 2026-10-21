"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSingleLiterature } from "./actions";
import { FACULTY_DEPARTMENTS } from "../teacher-certificates/TeacherControls";
import { LITERATURE_TYPES } from "./AcademicControls";

interface AddLiteratureModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculties: any[];
  userRole?: string;
}

export default function AddLiteratureModal({
  isOpen,
  onClose,
  faculties,
  userRole
}: AddLiteratureModalProps) {
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

  if (!isOpen) return null;

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
        onClose();
        setFormData(initialFormState);
        setBookFile(null);
        setGrifFile(null);
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card glass"
        style={{
          width: "100%",
          maxWidth: "750px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "0.75rem",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Oyna Sarlavhasi (Header) */}
        <div
          className="card-header flex justify-between items-center"
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E5E7EB"
          }}
        >
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>
            Yangi Adabiyot Qo'shish
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.75rem",
              lineHeight: 1,
              cursor: "pointer",
              color: "#6B7280"
            }}
          >
            &times;
          </button>
        </div>

        {/* Oyna Formasi (Body) */}
        <div className="card-body" style={{ padding: "1.5rem" }}>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem"
            }}
          >
            {/* Fakultet tanlash */}
            {userRole === "ADMIN" ? (
              <div className="input-group">
                <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                  Fakultet
                </label>
                <select
                  required
                  className="input"
                  value={formData.facultyName}
                  onChange={(e) =>
                    setFormData({ ...formData, facultyName: e.target.value, department: "" })
                  }
                  style={{ height: "42px", borderRadius: "0.5rem" }}
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
                <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                  Fakultet
                </label>
                <input
                  type="text"
                  className="input"
                  disabled
                  value={faculties[0]?.name || ""}
                  style={{ height: "42px", borderRadius: "0.5rem", backgroundColor: "#F3F4F6" }}
                />
              </div>
            )}

            {/* Kafedra */}
            <div className="input-group">
              <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                Kafedra
              </label>
              {availableDepartments.length > 0 ? (
                <select
                  className="input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{ height: "42px", borderRadius: "0.5rem" }}
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
                  style={{ height: "42px", borderRadius: "0.5rem" }}
                />
              )}
            </div>

            {/* Muallif */}
            <div className="input-group">
              <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                Muallif
              </label>
              <input
                required
                type="text"
                className="input"
                placeholder="F.I.Sh"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                style={{ height: "42px", borderRadius: "0.5rem" }}
              />
            </div>

            {/* Hammualliflar */}
            <div className="input-group">
              <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                Hammualliflar
              </label>
              <input
                type="text"
                className="input"
                placeholder="Hammualliflar F.I.Sh."
                value={formData.coAuthors}
                onChange={(e) => setFormData({ ...formData, coAuthors: e.target.value })}
                style={{ height: "42px", borderRadius: "0.5rem" }}
              />
            </div>

            {/* Adabiyot Nomi */}
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                Adabiyot Nomi
              </label>
              <input
                required
                type="text"
                className="input"
                placeholder="Adabiyot nomi"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ height: "42px", borderRadius: "0.5rem" }}
              />
            </div>

            {/* Turi */}
            <div className="input-group">
              <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                Turi
              </label>
              <select
                required
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ height: "42px", borderRadius: "0.5rem" }}
              >
                {LITERATURE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Chop etilgan sana */}
            <div className="input-group">
              <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                Chop etilgan sana
              </label>
              <input
                type="date"
                className="input"
                value={formData.publishDate}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                style={{ height: "42px", borderRadius: "0.5rem" }}
              />
            </div>

            {/* Kitob fayli */}
            <div className="input-group">
              <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                Kitob fayli (PDF / Hujjat)
              </label>
              <input
                type="file"
                className="input"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                style={{ padding: "0.4rem", borderRadius: "0.5rem" }}
              />
            </div>

            {/* Grif fayli */}
            <div className="input-group">
              <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
                Grif fayli (PDF / Rasm)
              </label>
              <input
                type="file"
                className="input"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setGrifFile(e.target.files?.[0] || null)}
                style={{ padding: "0.4rem", borderRadius: "0.5rem" }}
              />
            </div>

            {/* Pastki tugmalar */}
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #E5E7EB"
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                style={{ borderRadius: "0.5rem" }}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{
                  backgroundColor: "#4F46E5",
                  color: "#FFFFFF",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "0.5rem"
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
