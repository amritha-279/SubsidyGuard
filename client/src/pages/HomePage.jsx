import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, BarChart2, Users, Leaf, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import subBg from '../assets/sub.png';

const FEATURES = [
  { icon: ShieldAlert, title: 'Fraud Detection', desc: 'AI-powered ML model detects suspicious fertilizer purchase patterns in real time.' },
  { icon: BarChart2,   title: 'Analytics Dashboard', desc: 'Officers get full visibility into district-level transactions, trends and risk scores.' },
  { icon: Users,       title: 'Farmer Verification', desc: 'Every sale is verified against farmer Aadhaar, land size and crop requirements.' },
  { icon: Leaf,        title: 'Subsidy Management', desc: 'Ensures subsidised fertilizers reach genuine farmers and not the black market.' },
  { icon: Lock,        title: 'Secure & Role-Based', desc: 'Separate portals for Agriculture Officers and Retailers with JWT-secured access.' },
  { icon: AlertTriangle, title: 'Cluster Alerts', desc: 'Automatically flags coordinated bulk purchases across multiple retailers or villages.' },
];

const HOW = [
  { step: '01', title: 'Retailer Registers', desc: 'Fertilizer retailers register with their license details and await officer approval.' },
  { step: '02', title: 'Farmer Walks In', desc: 'Retailer enters farmer Aadhaar, land size and crop type before any sale.' },
  { step: '03', title: 'AI Verifies', desc: 'System checks purchase history, recommended quantity and runs ML fraud analysis.' },
  { step: '04', title: 'Sale Approved or Flagged', desc: 'GREEN = proceed, YELLOW = OTP required, RED = officer approval needed.' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-green-600" />
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">SubsidyGuard</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/retailer/register')}
              className="text-sm font-semibold text-gray-600 hover:text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition"
            >
              Register
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg transition shadow"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-6 pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${subBg})` }} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block bg-green-500/20 border border-green-400/40 text-green-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            AI-Powered Fertilizer Subsidy Protection
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
            Protecting Subsidies.<br />
            <span className="text-green-400">Empowering Farmers.</span>
          </h1>
          <p className="text-white/75 text-lg sm:text-xl mb-10 leading-relaxed">
            SubsidyGuard uses machine learning to detect fertilizer subsidy fraud, ensuring every kilogram reaches the farmer who truly needs it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl text-base transition shadow-lg"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/retailer/register')}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition"
            >
              Register as Retailer
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Why SubsidyGuard?</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">A complete system to monitor, verify and protect government fertilizer subsidies from farm to retailer.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 text-lg">Four simple steps from farmer visit to verified sale.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-green-600">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
          {[['AI Verified', 'Every Sale'], ['Real-Time', 'Fraud Alerts'], ['Role-Based', 'Access Control'], ['PostgreSQL', 'Backed Data']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl sm:text-3xl font-extrabold mb-1">{val}</p>
              <p className="text-green-200 text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-500 mb-8">Officers and retailers can log in to their respective portals. New retailers can register and await approval.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3.5 rounded-xl text-base transition shadow"
            >
              Officer / Retailer Login
            </button>
            <button
              onClick={() => navigate('/retailer/register')}
              className="border border-green-600 text-green-700 hover:bg-green-50 font-bold px-8 py-3.5 rounded-xl text-base transition"
            >
              Register as Retailer
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        © 2026 SubsidyGuard — AI-Powered Fertilizer Subsidy Protection System
      </footer>

    </div>
  );
}
