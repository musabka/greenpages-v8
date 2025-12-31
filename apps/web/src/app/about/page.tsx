import Link from 'next/link';
import type { Metadata } from 'next';
import { Building2, Users, Target, Heart, MapPin, Phone, Mail, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: 'من نحن',
  description: 'تعرف على الصفحات الخضراء - الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا',
};

const stats = [
  { value: '10,000+', label: 'نشاط تجاري مسجل', icon: Building2 },
  { value: '50,000+', label: 'مستخدم نشط', icon: Users },
  { value: '14', label: 'محافظة سورية', icon: MapPin },
  { value: '100+', label: 'تصنيف وفئة', icon: Target },
];

const values = [
  {
    title: 'الشمولية',
    description: 'نسعى لتغطية جميع الأنشطة التجارية في كافة المحافظات السورية',
    icon: '🌍',
  },
  {
    title: 'الموثوقية',
    description: 'نتحقق من صحة المعلومات لضمان تجربة موثوقة للمستخدمين',
    icon: '✓',
  },
  {
    title: 'سهولة الاستخدام',
    description: 'واجهة بسيطة وسهلة تمكن الجميع من الوصول للمعلومات بسرعة',
    icon: '📱',
  },
  {
    title: 'الدعم المستمر',
    description: 'فريق دعم متاح لمساعدة أصحاب الأنشطة والمستخدمين',
    icon: '💬',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">من نحن</h1>
            <p className="text-xl text-primary-100">
              الصفحات الخضراء هي الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا.
              نربط بين أصحاب الأعمال والعملاء بطريقة سهلة وفعالة.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white -mt-10">
        <div className="container">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-100 flex items-center justify-center">
                    <stat.icon className="w-7 h-7 text-primary-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">مهمتنا</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                نسعى لبناء منصة رقمية شاملة تجمع جميع الأنشطة التجارية في سوريا في مكان واحد،
                مما يسهل على المواطنين والزوار العثور على الخدمات والمنتجات التي يحتاجونها.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                نؤمن بأن التحول الرقمي هو مفتاح النهوض بالاقتصاد السوري، ونحن هنا لدعم
                أصحاب الأعمال في الوصول إلى عملاء جدد وتنمية أعمالهم.
              </p>
              <div className="flex items-center gap-2 text-primary-600">
                <Heart className="w-5 h-5 fill-primary-600" />
                <span className="font-medium">صنع بحب في سوريا</span>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-primary-500 rounded-3xl flex items-center justify-center">
                    <span className="text-white text-6xl font-bold">ص</span>
                  </div>
                  <h3 className="text-2xl font-bold text-primary-600">الصفحات الخضراء</h3>
                  <p className="text-primary-500">دليل سوريا التجاري</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">قيمنا</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              نلتزم بمجموعة من القيم التي توجه عملنا وتضمن تقديم أفضل خدمة لمستخدمينا
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="p-6 rounded-2xl bg-gray-50 hover:bg-primary-50 transition-colors">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">انضم إلينا اليوم</h2>
            <p className="text-primary-100 text-lg mb-8">
              سواء كنت صاحب نشاط تجاري تبحث عن عملاء جدد، أو مستخدم يبحث عن أفضل الخدمات،
              الصفحات الخضراء هي وجهتك المثالية.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/add-business" className="btn bg-white text-primary-600 hover:bg-gray-100">
                أضف نشاطك التجاري
              </Link>
              <Link href="/search" className="btn bg-primary-500 hover:bg-primary-400 border border-white/20">
                ابدأ البحث
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
