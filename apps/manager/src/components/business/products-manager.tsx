'use client';

import { useState } from 'react';
import { Plus, X, Package, Upload, Loader2 } from 'lucide-react';
import { uploadApi, type BusinessProduct } from '@/lib/api';

interface ProductsManagerProps {
  products: BusinessProduct[];
  onChange: (products: BusinessProduct[]) => void;
  label?: string; // "المنتجات" أو "الخدمات" حسب نوع النشاط
}

export function ProductsManager({ products, onChange, label = 'المنتجات والخدمات' }: ProductsManagerProps) {
  const [isUploading, setIsUploading] = useState<number | null>(null);

  const addProduct = (type: 'PRODUCT' | 'SERVICE') => {
    onChange([
      ...products,
      {
        type,
        nameAr: '',
        nameEn: '',
        descriptionAr: '',
        descriptionEn: '',
        image: '',
        price: undefined,
        currency: 'SYP',
        priceNote: '',
        isAvailable: true,
        isFeatured: false,
        sortOrder: products.length,
      },
    ]);
  };

  const removeProduct = (index: number) => {
    onChange(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof BusinessProduct, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setIsUploading(index);
      const res = await uploadApi.uploadImage(file, 'products');
      updateProduct(index, 'image', res.data.url);
    } finally {
      setIsUploading(null);
    }
  };

  const formatPrice = (price: number | undefined, currency: string | undefined) => {
    if (!price) return '';
    const cur = currency || 'SYP';
    return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: cur }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5" />
          {label}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addProduct('PRODUCT')}
            className="btn btn-sm btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </button>
          <button
            type="button"
            onClick={() => addProduct('SERVICE')}
            className="btn btn-sm btn-outline flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة خدمة
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>لم يتم إضافة أي منتجات أو خدمات بعد</p>
          <div className="flex justify-center gap-4 mt-3">
            <button
              type="button"
              onClick={() => addProduct('PRODUCT')}
              className="text-primary-600 hover:underline"
            >
              إضافة منتج
            </button>
            <button
              type="button"
              onClick={() => addProduct('SERVICE')}
              className="text-primary-600 hover:underline"
            >
              إضافة خدمة
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50 relative">
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${product.type === 'PRODUCT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {product.type === 'PRODUCT' ? 'منتج' : 'خدمة'}
                </span>
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                {/* Image */}
                <div>
                  <label className="label">الصورة</label>
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
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
                          if (file) handleImageUpload(index, file);
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
                    value={product.nameAr}
                    onChange={(e) => updateProduct(index, 'nameAr', e.target.value)}
                    className="input"
                    placeholder={product.type === 'PRODUCT' ? 'اسم المنتج' : 'اسم الخدمة'}
                  />
                </div>

                {/* Name EN */}
                <div>
                  <label className="label">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={product.nameEn || ''}
                    onChange={(e) => updateProduct(index, 'nameEn', e.target.value)}
                    className="input"
                    dir="ltr"
                    placeholder="Product/Service Name"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="label">السعر</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={product.price || ''}
                      onChange={(e) => updateProduct(index, 'price', e.target.value ? Number(e.target.value) : undefined)}
                      className="input flex-1"
                      dir="ltr"
                      placeholder="0"
                    />
                    <select
                      value={product.currency || 'SYP'}
                      onChange={(e) => updateProduct(index, 'currency', e.target.value)}
                      className="select w-24"
                    >
                      <option value="SYP">ل.س</option>
                      <option value="USD">$</option>
                      <option value="EUR">€</option>
                    </select>
                  </div>
                </div>

                {/* Price Note */}
                <div>
                  <label className="label">ملاحظة السعر</label>
                  <input
                    type="text"
                    value={product.priceNote || ''}
                    onChange={(e) => updateProduct(index, 'priceNote', e.target.value)}
                    className="input"
                    placeholder="يبدأ من / حسب الطلب"
                  />
                </div>

                {/* Flags */}
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={product.isAvailable ?? true}
                      onChange={(e) => updateProduct(index, 'isAvailable', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">متاح</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={product.isFeatured ?? false}
                      onChange={(e) => updateProduct(index, 'isFeatured', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">مميز</span>
                  </label>
                </div>

                {/* Description AR */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="label">الوصف بالعربية</label>
                  <textarea
                    value={product.descriptionAr || ''}
                    onChange={(e) => updateProduct(index, 'descriptionAr', e.target.value)}
                    className="textarea"
                    rows={2}
                    placeholder="وصف المنتج أو الخدمة..."
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
