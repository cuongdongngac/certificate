"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface Certificate {
  certificate_no: string;
  full_name?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: string;
  ethnicity?: string;
  nationality?: string;
  training_mode?: string;
  major?: string;
  course?: string;
  enrollment_year?: string;
  graduation_year?: string;
  classification?: string;
  thesis_committee_decision_no?: string;
  thesis_defense_date?: string;
  graduation_decision_no?: string;
  registry_no?: string;
  [key: string]: any; // Cho phép các cột phụ khác nếu có
}

const VALID_COLUMNS = [
  "certificate_no",
  "full_name",
  "date_of_birth",
  "place_of_birth",
  "gender",
  "ethnicity",
  "nationality",
  "training_mode",
  "major",
  "course",
  "enrollment_year",
  "graduation_year",
  "classification",
  "thesis_committee_decision_no",
  "thesis_defense_date",
  "graduation_decision_no",
  "registry_no",
];

interface ImportResult {
  row: number;
  data: Certificate;
  status: "success" | "error";
  message: string;
}

export default function ImportPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) {
      alert("Bạn không có quyền truy cập trang này.");
      router.push('/');
    }
  }, [user, profile, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults([]);
      setProgress(0);
    }
  };

  const downloadSampleCSV = () => {
    const headers = [
      "certificate_no",
      "full_name",
      "date_of_birth",
      "place_of_birth",
      "gender",
      "ethnicity",
      "nationality",
      "training_mode",
      "major",
      "course",
      "enrollment_year",
      "graduation_year",
      "classification",
      "thesis_committee_decision_no",
      "thesis_defense_date",
      "graduation_decision_no",
      "registry_no",
    ];
    const sampleRow = [
      "VB123456",
      "Nguyễn Văn A",
      "01/01/2000",
      "Hà Nội",
      "Nam",
      "Kinh",
      "Việt Nam",
      "Chính quy",
      "Công nghệ thông tin",
      "K63",
      "2018",
      "2022",
      "Giỏi",
      "123/QD-DH",
      "15/06/2022",
      "456/QD-TN",
      "REG789",
    ];

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_certificates.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!file) {
      alert("Vui lòng chọn tệp CSV");
      return;
    }

    setImporting(true);
    setResults([]);
    setProgress(0);

    Papa.parse<Certificate>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Xóa khoảng trắng thừa trong header
      transform: (value) => value.trim(), // Xóa khoảng trắng thừa trong dữ liệu từng ô
      complete: async (parsedResults) => {
        const data = parsedResults.data;
        const totalRows = data.length;
        const newResults: ImportResult[] = [];

        for (let i = 0; i < totalRows; i++) {
          const rawRow = data[i];

          // Chỉ lấy các cột hợp lệ để tránh lỗi schema cache
          const cleanedRow: any = {};

          // Xử lý các trường hợp đặc biệt về tên cột trong CSV của người dùng (nếu có)
          if (rawRow["dob"] && !rawRow["date_of_birth"]) {
            rawRow["date_of_birth"] = rawRow["dob"];
          }
          if (rawRow["fullname"] && !rawRow["full_name"]) {
            rawRow["full_name"] = rawRow["fullname"];
          }
          if (rawRow["sex"] && !rawRow["gender"]) {
            rawRow["gender"] = rawRow["sex"];
          }

          VALID_COLUMNS.forEach((col) => {
            if (rawRow[col] !== undefined) {
              cleanedRow[col] = rawRow[col];
            }
          });

          try {
            // Kiểm tra certificate_no vì nó là PRIMARY KEY
            if (!cleanedRow.certificate_no) {
              throw new Error("Thiếu số hiệu văn bằng (certificate_no)");
            }

            const { error } = await supabase
              .from("certificates")
              .upsert(cleanedRow, { onConflict: "certificate_no" });

            if (error) throw error;

            newResults.push({
              row: i + 1,
              data: cleanedRow,
              status: "success",
              message: "Thành công",
            });
          } catch (err: any) {
            newResults.push({
              row: i + 1,
              data: rawRow,
              status: "error",
              message: err.message || "Lỗi không xác định",
            });
          }
          setProgress(Math.round(((i + 1) / totalRows) * 100));
          setResults([...newResults]); // Update UI incrementally
        }
        setImporting(false);
      },
      error: (error) => {
        console.error("Lỗi khi đọc file CSV:", error);
        alert("Lỗi khi đọc file CSV: " + error.message);
        setImporting(false);
      },
    });
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
        <div className="bg-blue-600 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Import Dữ Liệu Văn Bằng
            </h1>
            <p className="text-blue-100 mt-2">
              Chọn tệp CSV có các cột tương ứng với các trường trong bảng
              certificates
            </p>
          </div>
          <button
            onClick={downloadSampleCSV}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Tải File Mẫu
          </button>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tệp CSV dữ liệu
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer border border-gray-300 rounded-lg p-1"
              />
            </div>
            <div className="pt-7">
              <button
                onClick={handleImport}
                disabled={!file || importing}
                className={`px-6 py-2.5 rounded-lg font-bold text-white transition-all
                  ${
                    !file || importing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                  }`}
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang Import... {progress}%
                  </span>
                ) : (
                  "Bắt đầu Import"
                )}
              </button>
            </div>
          </div>

          {importing && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Kết quả Import</h2>
                <div className="flex gap-4">
                  <span className="text-green-600 text-sm font-medium">
                    Thành công:{" "}
                    {results.filter((r) => r.status === "success").length}
                  </span>
                  <span className="text-red-600 text-sm font-medium">
                    Thất bại:{" "}
                    {results.filter((r) => r.status === "error").length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dòng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số hiệu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Họ tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((res, idx) => (
                      <tr
                        key={idx}
                        className={
                          res.status === "error"
                            ? "bg-red-50"
                            : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {res.row}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {res.data.certificate_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {res.data.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {res.status === "success" ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Thành công
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Thất bại
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {res.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 max-w-4xl mx-auto bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Hướng dẫn tệp CSV
        </h3>
        <p className="text-blue-700 text-sm mb-4">
          Để import thành công, tệp CSV của bạn cần có các cột (headers) sau:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "certificate_no",
            "full_name",
            "date_of_birth",
            "place_of_birth",
            "gender",
            "ethnicity",
            "nationality",
            "training_mode",
            "major",
            "course",
            "enrollment_year",
            "graduation_year",
            "classification",
            "thesis_committee_decision_no",
            "thesis_defense_date",
            "graduation_decision_no",
            "registry_no",
          ].map((field) => (
            <code
              key={field}
              className="bg-white px-2 py-1 rounded text-xs font-mono text-blue-600 border border-blue-200"
            >
              {field}
            </code>
          ))}
        </div>
        <p className="text-blue-600 text-xs mt-4 italic">
          * Lưu ý: certificate_no là trường bắt buộc và duy nhất.
        </p>
      </div>
    </div>
  );
}
