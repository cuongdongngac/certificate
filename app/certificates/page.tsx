"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import EditModal from "@/components/EditModal";
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
}

export default function CertificatesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== "admin")) {
      alert("Bạn không có quyền truy cập trang này.");
      router.push("/");
    }
  }, [user, profile, authLoading, router]);

  const fetchCertificates = useCallback(async () => {
    // Chỉ tải dữ liệu khi thông tin người dùng đã sẵn sàng và là admin
    if (authLoading) return;
    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("Đang tải danh sách văn bằng...");
    try {
      let query = supabase.from("certificates").select("*");

      if (searchTerm && searchTerm.trim() !== "") {
        query = query.or(
          `certificate_no.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`,
        );
      }

      const { data, error } = await query.order("certificate_no", {
        ascending: true,
      });

      if (error) {
        console.error("Lỗi Supabase:", error);
        // Kiểm tra xem lỗi có phải do RLS không
        if (error.code === "42501") {
          alert(
            "Lỗi phân quyền (RLS): Bạn không có quyền truy cập bảng certificates. Hãy kiểm tra chính sách RLS trên Supabase.",
          );
        } else {
          alert("Lỗi khi tải dữ liệu: " + error.message);
        }
        throw error;
      }

      console.log(`Đã tải xong ${data?.length || 0} bản ghi.`);
      setCertificates(data || []);
    } catch (error: any) {
      console.error("Lỗi khi tải dữ liệu:", error);
      alert("Lỗi khi tải dữ liệu: " + (error.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  }, [user, profile, authLoading, searchTerm]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleDelete = async (certificate_no: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa văn bằng ${certificate_no}?`))
      return;

    try {
      const { error } = await supabase
        .from("certificates")
        .delete()
        .eq("certificate_no", certificate_no);

      if (error) throw error;
      fetchCertificates();
    } catch (error: any) {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  const handleEdit = (cert: Certificate) => {
    setEditingCert(cert);
    setIsModalOpen(true);
  };

  useEffect(() => {
    console.log("Auth State:", {
      user: !!user,
      role: profile?.role,
      authLoading,
    });
  }, [user, profile, authLoading]);

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
        <div className="bg-blue-600 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">
              Quản Lý Danh Sách Văn Bằng
            </h1>
            <p className="text-blue-100 mt-2 opacity-90">
              Theo dõi, chỉnh sửa và quản lý toàn bộ dữ liệu văn bằng
            </p>
            {!authLoading && !profile && (
              <p className="text-red-200 text-sm mt-2 font-bold">
                ⚠️ Không tìm thấy thông tin profile. Hãy thử đăng xuất và đăng
                nhập lại.
              </p>
            )}
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => fetchCertificates()}
              className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-400 transition-all shadow-md"
              title="Làm mới danh sách"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Tìm theo số hiệu hoặc họ tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-white transition-all bg-white/20 text-white placeholder-blue-100 outline-none"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-3.5 text-blue-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <a
              href="/import"
              className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg"
            >
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Import Mới
            </a>
          </div>
        </div>

        <div className="overflow-x-auto p-2">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Số hiệu
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Họ tên
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ngày sinh
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ngành học
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Xếp loại
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 font-medium">
                        Đang tải danh sách...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-gray-500 font-medium">
                        Không tìm thấy văn bằng nào
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr
                    key={cert.certificate_no}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {cert.certificate_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {cert.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {cert.date_of_birth}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {cert.major}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                          cert.classification === "Xuất sắc"
                            ? "bg-purple-100 text-purple-800"
                            : cert.classification === "Giỏi"
                              ? "bg-green-100 text-green-800"
                              : cert.classification === "Khá"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {cert.classification || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(cert)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(cert.certificate_no)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditModal
        certificate={editingCert}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchCertificates}
      />
    </div>
  );
}
