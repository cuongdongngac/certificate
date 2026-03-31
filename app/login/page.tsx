"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        // 1. Đăng ký tài khoản mới
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
          });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Không thể tạo tài khoản.");

        // 2. Kiểm tra xem có người dùng nào trong bảng profiles chưa
        // Lưu ý: Chúng ta kiểm tra bảng profiles thay vì auth.users 
        // vì client side không thể đếm trực tiếp auth.users một cách bảo mật
        const { count, error: checkError } = await supabase
          .from("profiles")
          .select("*", { count: 'exact', head: true });

        if (checkError) {
          console.error("Lỗi kiểm tra profiles:", checkError);
        }

        // 3. Gán quyền admin nếu là người dùng đầu tiên (count === 0)
        const isFirstUser = count === 0;
        const role = isFirstUser ? "admin" : "user";

        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: signUpData.user.id,
            email: email,
            role: role,
          },
        ]);

        if (profileError) throw profileError;

        alert(`Đăng ký thành công! Bạn đã được gán quyền: ${role}`);
        router.push("/");
      } else {
        // Đăng nhập
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push("/");
      }
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering ? "Tạo tài khoản mới" : "Đăng nhập vào hệ thống"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? (
              <>
                Đã có tài khoản?{" "}
                <button
                  onClick={() => setIsRegistering(false)}
                  className="font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  Đăng nhập ngay
                </button>
              </>
            ) : (
              <>
                Chưa có tài khoản?{" "}
                <button
                  onClick={() => setIsRegistering(true)}
                  className="font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  Đăng ký tài khoản
                </button>
              </>
            )}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label className="sr-only">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Địa chỉ Email"
              />
            </div>
            <div>
              <label className="sr-only">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-blue-300 shadow-md hover:shadow-lg"
            >
              {loading
                ? "Đang xử lý..."
                : isRegistering
                  ? "Đăng ký"
                  : "Đăng nhập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
