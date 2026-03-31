import { supabase } from "@/lib/supabase";
import PrintButton from "@/components/PrintButton";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q;
  let certificate = null;
  let error = null;

  if (query) {
    const { data, error: dbError } = await supabase
      .from("certificates")
      .select("*")
      .eq("certificate_no", query)
      .single();

    if (dbError) {
      error = "Không tìm thấy thông tin văn bằng hoặc có lỗi xảy ra.";
    } else {
      certificate = data;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">
            HỆ THỐNG TRA CỨU VĂN BẰNG
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Nhập số hiệu văn bằng để kiểm tra thông tin chính xác từ hệ thống
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <a 
              href="/certificates" 
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Danh Sách Văn Bằng
            </a>
            <a 
              href="/import" 
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1.5 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Import Dữ Liệu
            </a>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <form
            action="/"
            method="GET"
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-grow">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Nhập số hiệu văn bằng (VD: VB123456)"
                className="w-full px-4 py-3 border-2 border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 shadow-md flex items-center justify-center gap-2"
            >
              Tra cứu ngay
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {certificate && (
          <div className="mt-8 bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100">
            <div className="bg-blue-900 px-6 py-4">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                Kết quả tra cứu: {certificate.certificate_no}
              </h2>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* Thông tin cá nhân */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">
                    Thông tin cá nhân
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Họ và tên" value={certificate.full_name} />
                    <InfoRow
                      label="Ngày sinh"
                      value={certificate.date_of_birth}
                    />
                    <InfoRow
                      label="Nơi sinh"
                      value={certificate.place_of_birth}
                    />
                    <InfoRow label="Giới tính" value={certificate.gender} />
                    <InfoRow label="Dân tộc" value={certificate.ethnicity} />
                    <InfoRow
                      label="Quốc tịch"
                      value={certificate.nationality}
                    />
                  </div>
                </div>

                {/* Thông tin đào tạo */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">
                    Thông tin đào tạo
                  </h3>
                  <div className="space-y-3">
                    <InfoRow
                      label="Hình thức đào tạo"
                      value={certificate.training_mode}
                    />
                    <InfoRow label="Ngành học" value={certificate.major} />
                    <InfoRow label="Khóa học" value={certificate.course} />
                    <InfoRow
                      label="Năm nhập học"
                      value={certificate.enrollment_year}
                    />
                    <InfoRow
                      label="Năm tốt nghiệp"
                      value={certificate.graduation_year}
                    />
                    <InfoRow
                      label="Xếp loại"
                      value={certificate.classification}
                    />
                  </div>
                </div>

                {/* Thông tin quyết định */}
                <div className="md:col-span-2 space-y-4 mt-4">
                  <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">
                    Thông tin quyết định & Sổ gốc
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                    <InfoRow
                      label="Số quyết định HĐ chấm luận văn"
                      value={certificate.thesis_committee_decision_no}
                    />
                    <InfoRow
                      label="Ngày bảo vệ luận văn"
                      value={certificate.thesis_defense_date}
                    />
                    <InfoRow
                      label="Số quyết định tốt nghiệp"
                      value={certificate.graduation_decision_no}
                    />
                    <InfoRow
                      label="Số vào sổ gốc"
                      value={certificate.registry_no}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-center">
                <PrintButton />
              </div>
            </div>
          </div>
        )}

        {!query && (
          <div className="mt-12 text-center text-gray-500">
            <p>Vui lòng nhập số hiệu văn bằng để xem chi tiết.</p>
          </div>
        )}
      </div>

      <footer className="mt-auto py-8 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Hệ thống Tra cứu Văn bằng Trực tuyến
      </footer>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline border-b border-gray-50 pb-1">
      <span className="text-gray-500 text-sm font-medium">{label}:</span>
      <span className="text-gray-900 font-semibold">{value || "---"}</span>
    </div>
  );
}
