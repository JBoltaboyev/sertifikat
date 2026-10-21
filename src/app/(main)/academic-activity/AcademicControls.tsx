"use client";

import { useState } from "react";
import * as xlsx from "xlsx";
import AddLiteratureModal from "./AddLiteratureModal";

export const LITERATURE_TYPES = [
  "O'quv qo'llanma",
  "Uslubiy qo'llanma",
  "Monografiya",
  "Darslik",
  "Risolat",
  "Ilmiy maqola"
];

export default function AcademicControls({
  literatures,
  faculties,
  userRole
}: {
  literatures: any[];
  faculties: any[];
  userRole?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!literatures || literatures.length === 0) {
      alert("Eksport qilish uchun ma'lumot yo'q!");
      return;
    }

    const dataToExport = literatures.map((item, i) => ({
      "№": i + 1,
      "Fakultet": item.faculty?.name || "",
      "Kafedra": item.department || "",
      "Muallif": item.author || "",
      "Hammualliflar": item.coAuthors || "-",
      "Adabiyot nomi": item.title || "",
      "Turi": item.type || "",
      "Chop etilgan sana": item.publishDate || "",
      "Fayl": item.fileUrl ? "Mavjud" : "Mavjud emas",
      "Grif": item.grifUrl ? "Mavjud" : "Mavjud emas"
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Adabiyotlar");
    xlsx.writeFile(workbook, "Akademik_Faoliyat_Adabiyotlar.xlsx");
  };

  return (
    <>
      <div className="flex items-center gap-2 no-print" style={{ flexWrap: "wrap" }}>
        <button
          className="btn"
          style={{
            backgroundColor: "#4F46E5",
            color: "#ffffff",
            padding: "0.45rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: "0.5rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem"
          }}
          onClick={() => setIsModalOpen(true)}
        >
          + Yangi Qo'shish
        </button>

        <button
          className="btn"
          style={{
            backgroundColor: "#4F46E5",
            color: "#ffffff",
            padding: "0.45rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: "0.5rem"
          }}
          onClick={handleExport}
        >
          Excel Export
        </button>

        <button
          className="btn"
          style={{
            backgroundColor: "#374151",
            color: "#ffffff",
            padding: "0.45rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            borderRadius: "0.5rem"
          }}
          onClick={handlePrint}
        >
          Print
        </button>
      </div>

      {/* Yangi Adabiyot Qo'shish Modal Oynasi */}
      <AddLiteratureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        faculties={faculties}
        userRole={userRole}
      />
    </>
  );
}
