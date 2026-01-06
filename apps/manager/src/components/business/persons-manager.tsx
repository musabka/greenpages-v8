'use client';

import { useState } from 'react';
import { Plus, X, User, Upload, Loader2 } from 'lucide-react';
import { uploadApi, type BusinessPerson } from '@/lib/api';

interface PersonsManagerProps {
  persons: BusinessPerson[];
  onChange: (persons: BusinessPerson[]) => void;
}

export function PersonsManager({ persons, onChange }: PersonsManagerProps) {
  const [isUploading, setIsUploading] = useState<number | null>(null);

  const addPerson = () => {
    onChange([
      ...persons,
      {
        nameAr: '',
        nameEn: '',
        positionAr: '',
        positionEn: '',
        bioAr: '',
        bioEn: '',
        photo: '',
        phone: '',
        email: '',
        isPublic: true,
        sortOrder: persons.length,
      },
    ]);
  };

  const removePerson = (index: number) => {
    onChange(persons.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, field: keyof BusinessPerson, value: any) => {
    const updated = [...persons];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    try {
      setIsUploading(index);
      const res = await uploadApi.uploadImage(file, 'persons');
      updatePerson(index, 'photo', res.data.url);
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5" />
          فريق العمل (يعمل هنا)
        </h3>
        <button
          type="button"
          onClick={addPerson}
          className="btn btn-sm btn-secondary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة شخص
        </button>
      </div>

      {persons.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>لم يتم إضافة أي شخص بعد</p>
          <button
            type="button"
            onClick={addPerson}
            className="text-primary-600 hover:underline mt-2"
          >
            إضافة شخص جديد
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {persons.map((person, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50 relative">
              <button
                type="button"
                onClick={() => removePerson(index)}
                className="absolute top-2 left-2 p-1 text-red-500 hover:bg-red-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Photo */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="label">الصورة</label>
                  <div className="flex items-center gap-3">
                    {person.photo ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={person.photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <label className="btn btn-sm btn-secondary cursor-pointer">
                      {isUploading === index ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(index, file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Name AR */}
                <div>
                  <label className="label">الاسم بالعربية *</label>
                  <input
                    type="text"
                    value={person.nameAr}
                    onChange={(e) => updatePerson(index, 'nameAr', e.target.value)}
                    className="input"
                    placeholder="أحمد محمد"
                  />
                </div>

                {/* Name EN */}
                <div>
                  <label className="label">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={person.nameEn || ''}
                    onChange={(e) => updatePerson(index, 'nameEn', e.target.value)}
                    className="input"
                    dir="ltr"
                    placeholder="Ahmad Mohammad"
                  />
                </div>

                {/* Position AR */}
                <div>
                  <label className="label">المنصب بالعربية</label>
                  <input
                    type="text"
                    value={person.positionAr || ''}
                    onChange={(e) => updatePerson(index, 'positionAr', e.target.value)}
                    className="input"
                    placeholder="المدير العام"
                  />
                </div>

                {/* Position EN */}
                <div>
                  <label className="label">المنصب بالإنجليزية</label>
                  <input
                    type="text"
                    value={person.positionEn || ''}
                    onChange={(e) => updatePerson(index, 'positionEn', e.target.value)}
                    className="input"
                    dir="ltr"
                    placeholder="General Manager"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="label">الهاتف</label>
                  <input
                    type="text"
                    value={person.phone || ''}
                    onChange={(e) => updatePerson(index, 'phone', e.target.value)}
                    className="input"
                    dir="ltr"
                    placeholder="+963..."
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={person.email || ''}
                    onChange={(e) => updatePerson(index, 'email', e.target.value)}
                    className="input"
                    dir="ltr"
                    placeholder="email@example.com"
                  />
                </div>

                {/* Bio AR */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="label">نبذة بالعربية</label>
                  <textarea
                    value={person.bioAr || ''}
                    onChange={(e) => updatePerson(index, 'bioAr', e.target.value)}
                    className="textarea"
                    rows={2}
                    placeholder="نبذة مختصرة عن الشخص..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
