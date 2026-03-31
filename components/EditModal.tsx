'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

interface EditModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditModal({ certificate, isOpen, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (certificate) {
      setFormData(certificate);
    }
  }, [certificate]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('certificates')
        .update(formData)
        .eq('certificate_no', formData.certificate_no);

      if (error) throw error;
      onSave();
      onClose();
    } catch (error: any) {
      alert('Lỗi khi cập nhật: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'full_name', label: 'Họ và tên' },
    { name: 'date_of_birth', label: 'Ngày sinh' },
    { name: 'place_of_birth', label: 'Nơi sinh' },
    { name: 'gender', label: 'Giới tính' },
    { name: 'ethnicity', label: 'Dân tộc' },
    { name: 'nationality', label: 'Quốc tịch' },
    { name: 'training_mode', label: 'Hệ đào tạo' },
    { name: 'major', label: 'Ngành học' },
    { name: 'course', label: 'Khóa học' },
    { name: 'enrollment_year', label: 'Năm nhập học' },
    { name: 'graduation_year', label: 'Năm tốt nghiệp' },
    { name: 'classification', label: 'Xếp loại' },
    { name: 'thesis_committee_decision_no', label: 'Số quyết định HĐ' },
    { name: 'thesis_defense_date', label: 'Ngày bảo vệ' },
    { name: 'graduation_decision_no', label: 'Số quyết định TN' },
    { name: 'registry_no', label: 'Số vào sổ' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa văn bằng: {formData.certificate_no}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={(formData as any)[field.name] || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            ))}
          </div>
          
          <div className="mt-10 pt-6 border-t flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:bg-blue-300"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
