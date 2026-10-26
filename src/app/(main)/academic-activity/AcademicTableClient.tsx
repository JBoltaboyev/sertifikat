"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteLiterature, addSingleLiterature } from "./actions";
import { FACULTY_DEPARTMENTS } from "../teacher-certificates/TeacherControls";
import { LITERATURE_TYPES } from "./AcademicControls";

export default function AcademicTableClient({
  literatures,
  faculties,
  userRole
}: {
  literatures: any[];
  faculties: any[];
  userRole?: string;
}) {
  const router = useRouter();

  // Filters state
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit modal state
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    facultyName: "",
    department: "",
    author: "",
    coAuthors: "",
    title: "",
    type: "",
    publishDate: ""
  });
  const [editBookFile, setEditBookFile] = useState<File | null>(null);
  const [editGrifFile, setEditGrifFile] = useState<File | null>(null);

  const openEditModal = (item: any) => {
    setEditFormData({
      facultyName: item.faculty?.name || "",
      department: item.department || "",
      author: item.author || "",
      coAuthors: item.coAuthors === "-" ? "" : item.coAuthors || "",
      title: item.title || "",
      type: item.type || "O'quv qo'llanma",
      publishDate: item.publishDate || ""
    });
    setEditBookFile(null);
    setEditGrifFile(null);
    setEditingItem(item);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("id", editingItem.id);
      Object.entries(editFormData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      if (editBookFile) {
        submitData.append("bookFile", editBookFile);
      }
      if (editGrifFile) {
        submitData.append("grifFile", editGrifFile);
      }

      const result = await addSingleLiterature(submitData);
      if (result.success) {
        setEditingItem(null);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham ushbu adabiyotni o'chirmoqchimisiz?")) return;
    const result = await deleteLiterature(id);
    if (result.success) {
      router.refresh();
    } else {
      alert("Xatolik: " + result.error);
    }
  };

  // Filter items
  const filteredItems = literatures.filter((item) => {
    // 1. Faculty filter
    if (selectedFaculty && item.faculty?.name !== selectedFaculty) {
      return false;
    }

    // 2. Type filter
    if (selectedType && item.type !== selectedType) {
      return false;
    }

    // 3. Search Query (Nomi, Muallif, Kafedra, Sana)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchTitle = (item.title || "").toLowerCase().includes(query);
      const matchAuthor = (item.author || "").toLowerCase().includes(query);
      const matchCoAuthors = (item.coAuthors || "").toLowerCase().includes(query);
      const matchDept = (item.department || "").toLowerCase().includes(query);
      const matchDate = (item.publishDate || "").toLowerCase().includes(query);

      if (!matchTitle && !matchAuthor && !matchCoAuthors && !matchDept && !matchDate) {
        return false;
      }
    }

    return true;
  });

  const currentFacultyForEdit =
    userRole === "DEAN" ? (faculties[0]?.name || "") : editFormData.facultyName;
  const availableDepartmentsForEdit = FACULTY_DEPARTMENTS[currentFacultyForEdit] || [];

  return (
    <>
      {/* Yuqori Filtr Bloki (Screenshot bilan bir xil) */}
      <div
        className="card glass no-print"
        style={{
          marginBottom: "1.5rem",
          padding: "1.25rem 1.5rem",
          borderRadius: "0.75rem",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 2fr",
            gap: "1.25rem",
            alignItems: "end"
          }}
        >
          {/* Fakultet filter */}
          <div className="input-group">
            <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
              Fakultet
            </label>
            <select
              className="input"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              style={{ height: "42px", borderRadius: "0.5rem" }}
            >
              <option value="">Barchasi</option>
              {faculties.map((f: any) => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Turi filter */}
          <div className="input-group">
            <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
              Turi
            </label>
            <select
              className="input"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ height: "42px", borderRadius: "0.5rem" }}
            >
              <option value="">Barchasi</option>
              {LITERATURE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Qidiruv filter */}
          <div className="input-group">
            <label className="label" style={{ fontWeight: 500, color: "#374151" }}>
              Qidiruv (Nomi, Muallif, Kafedra, Sana)
            </label>
            <input
              type="text"
              className="input"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: "42px", borderRadius: "0.5rem" }}
            />
          </div>
        </div>
      </div>

      {/* Rasmiy Hujjat Sarlavhasi (Faqat chop etilganda chiqadi) */}
      <div className="print-only document-header">
        <div className="doc-institution">URGANCH DAVLAT PEDAGOGIKA INSTITUTI</div>
        <div className="doc-subtitle">PROFESSOR-O'QITUVCHILARNING AKADEMIK FAOLIYATI (CHOP ETILGAN ADABIYOTLAR) REYESTRI</div>
        <div className="doc-meta-grid">
          <div><strong>Fakultet:</strong> {selectedFaculty || "Barcha fakultetlar"}</div>
          <div><strong>Jami ro'yxatda:</strong> {filteredItems.length} ta adabiyot</div>
          <div><strong>Sana:</strong> {new Date().toLocaleDateString('uz-UZ')}</div>
          {(selectedType || searchQuery) && (
            <div>
              <strong>Qo'llangan filtr:</strong> {[
                selectedType && `Turi: ${selectedType}`,
                searchQuery && `Qidiruv: ${searchQuery}`
              ].filter(Boolean).join(" | ")}
            </div>
          )}
        </div>
      </div>

      {/* Jadval Bloki */}
      <div
        className="card glass"
        style={{
          borderRadius: "0.75rem",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
          overflow: "hidden"
        }}
      >
        <div className="card-body table-wrapper" style={{ padding: 0 }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>№</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>FAKULTET</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>KAFEDRA</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>MUALLIF</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>HAMMUALLIFLAR</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>ADABIYOT NOMI</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>TURI</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>CHOP ETILGAN SANA</th>
                <th className="no-print" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600, textAlign: "center" }}>FAYL</th>
                <th className="no-print" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600, textAlign: "center" }}>GRIF</th>
                <th className="no-print" style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#6B7280", fontWeight: 600, textAlign: "center" }}>AMALLAR</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    Adabiyotlar topilmadi.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #F3F4F6",
                      transition: "background-color 0.15s ease"
                    }}
                  >
                    <td style={{ padding: "0.85rem 1rem", color: "#6B7280" }}>{index + 1}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "#111827", fontWeight: 500 }}>
                      {item.faculty?.name || "-"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#4B5563" }}>
                      {item.department || "-"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#111827" }}>
                      {item.author}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#6B7280" }}>
                      {item.coAuthors || "-"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#111827" }}>
                      {item.title}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "#EEF2FF",
                          color: "#4F46E5",
                          borderRadius: "9999px",
                          padding: "0.25rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 500
                        }}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#374151" }}>
                      {item.publishDate || "-"}
                    </td>
                    <td className="no-print" style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="badge"
                          style={{
                            backgroundColor: "#D1FAE5",
                            color: "#059669",
                            padding: "0.3rem 0.75rem",
                            borderRadius: "9999px",
                            textDecoration: "none",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            display: "inline-block",
                            transition: "opacity 0.2s"
                          }}
                        >
                          Kitobni ko'rish
                        </a>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>-</span>
                      )}
                    </td>
                    <td className="no-print" style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                      {item.grifUrl ? (
                        <a
                          href={item.grifUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="badge"
                          style={{
                            backgroundColor: "#D1FAE5",
                            color: "#059669",
                            padding: "0.3rem 0.75rem",
                            borderRadius: "9999px",
                            textDecoration: "none",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            display: "inline-block",
                            transition: "opacity 0.2s"
                          }}
                        >
                          Grifni ko'rish
                        </a>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>-</span>
                      )}
                    </td>
                    <td className="no-print" style={{ padding: "0.85rem 1rem", textAlign: "center", whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: "0.25rem 0.65rem",
                          fontSize: "0.75rem",
                          borderRadius: "0.375rem",
                          marginRight: "0.4rem",
                          borderColor: "#D1D5DB",
                          color: "#374151"
                        }}
                        onClick={() => openEditModal(item)}
                      >
                        Tahrirlash
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: "0.25rem 0.65rem",
                          fontSize: "0.75rem",
                          borderRadius: "0.375rem",
                          borderColor: "#FCA5A5",
                          color: "#EF4444"
                        }}
                        onClick={() => handleDelete(item.id)}
                      >
                        O'chirish
                      </button>
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
            <div className="sig-title">Tekshirdi (Ilmiy bo'lim):</div>
            <div className="sig-line">__________________________ (F.I.Sh.)</div>
            <div className="sig-hint">(imzo)</div>
          </div>
          <div className="sig-stamp-block">
            <div className="sig-stamp-box">M.O'.</div>
            <div className="sig-date">Sana: "____" ____________ 202___ y.</div>
          </div>
        </div>
      </div>

      {/* Tahrirlash Modali */}
      {editingItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
        >
          <div
            className="card glass"
            style={{
              width: "100%",
              maxWidth: "750px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div className="card-header flex justify-between items-center">
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                Adabiyotni Tahrirlash
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--text-main)"
                }}
              >
                &times;
              </button>
            </div>

            <div className="card-body">
              <form onSubmit={handleEditSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {userRole === "ADMIN" ? (
                  <div className="input-group">
                    <label className="label">Fakultet</label>
                    <select
                      required
                      className="input"
                      value={editFormData.facultyName}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, facultyName: e.target.value, department: "" })
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
                  {availableDepartmentsForEdit.length > 0 ? (
                    <select
                      className="input"
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    >
                      <option value="">Kafedrani tanlang</option>
                      {availableDepartmentsForEdit.map((d: string) => (
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
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    />
                  )}
                </div>

                <div className="input-group">
                  <label className="label">Muallif (F.I.Sh)</label>
                  <input
                    required
                    type="text"
                    className="input"
                    value={editFormData.author}
                    onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="label">Hammualliflar</label>
                  <input
                    type="text"
                    className="input"
                    value={editFormData.coAuthors}
                    onChange={(e) => setEditFormData({ ...editFormData, coAuthors: e.target.value })}
                  />
                </div>

                <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Adabiyot Nomi</label>
                  <input
                    required
                    type="text"
                    className="input"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="label">Turi</label>
                  <select
                    required
                    className="input"
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
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
                    value={editFormData.publishDate}
                    onChange={(e) => setEditFormData({ ...editFormData, publishDate: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="label">Kitob fayli (Yangi yuklash ixtiyoriy)</label>
                  <input
                    type="file"
                    className="input"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setEditBookFile(e.target.files?.[0] || null)}
                  />
                  {editingItem.fileUrl && (
                    <small style={{ color: "var(--text-muted)" }}>
                      Amaldagi fayl saqlanadi agar yangisi tanlanmasa
                    </small>
                  )}
                </div>

                <div className="input-group">
                  <label className="label">Grif fayli (Yangi yuklash ixtiyoriy)</label>
                  <input
                    type="file"
                    className="input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setEditGrifFile(e.target.files?.[0] || null)}
                  />
                  {editingItem.grifUrl && (
                    <small style={{ color: "var(--text-muted)" }}>
                      Amaldagi grif saqlanadi agar yangisi tanlanmasa
                    </small>
                  )}
                </div>

                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "1rem",
                    marginTop: "1rem"
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setEditingItem(null)}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
