import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, Clock, Building2, BookOpen, Send, CheckCircle } from 'lucide-react';

const FAQS = [
  { q:'How do I process a new fertilizer sale?', a:'Go to "New Transaction" from the sidebar. Enter the farmer\'s Aadhaar, agriculture details, and fertilizer details. Click "Verify Transaction" to get the AI risk assessment, then complete the sale.' },
  { q:'What does GREEN / YELLOW / RED risk level mean?', a:'GREEN means the transaction is safe to proceed. YELLOW requires OTP verification from the farmer before completing the sale. RED means the transaction is blocked and requires Agriculture Officer approval.' },
  { q:'How do I add stock to my inventory?', a:'Go to "Inventory" from the sidebar. Find the fertilizer and click "Add Stock" or "Update Stock". Enter the quantity and save.' },
  { q:'What happens after I submit a registration?', a:'Your account will be in "Pending Approval" status. An Agriculture Officer will review your application. You will be notified once approved. You cannot log in until approved.' },
  { q:'How do I look up a farmer\'s details?', a:'Go to "Farmer Lookup" from the sidebar. Search using the farmer\'s Aadhaar number, Farmer ID, or mobile number.' },
  { q:'How do I view pending officer approvals?', a:'Go to "Pending Approvals" from the sidebar to see all transactions awaiting Agriculture Officer review, along with their status and officer remarks.' },
  { q:'Can I print a receipt for a transaction?', a:'Yes. Go to "Transaction History", find the transaction, and click "Print" or "View" then "Print Receipt".' },
];

export default function HelpSupport() {
  const [openFaq, setOpenFaq] = useState(null);
  const [report, setReport] = useState({ subject:'', description:'', contact:'' });
  const [sent, setSent] = useState(false);

  const handleReport = e => {
    e.preventDefault();
    setSent(true); setReport({ subject:'', description:'', contact:'' });
    setTimeout(() => setSent(false), 4000);
  };

  const labelCls = 'text-xs font-medium text-gray-600 mb-1 block';
  const inputCls = 'input-field text-sm';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-1">Find answers, contact support, or report an issue.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* FAQ */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Contact */}
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Contact Agriculture Department</h3>
            <div className="space-y-3">
              {[
                { icon: Phone,     label:'Helpline',      value:'1800-XXX-XXXX (Toll Free)' },
                { icon: Mail,      label:'Email',         value:'support@subsidyguard.gov.in' },
                { icon: Clock,     label:'Working Hours', value:'Mon–Sat, 9:00 AM – 5:00 PM' },
                { icon: Building2, label:'Office',        value:'District Agriculture Office, Kerala' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg flex-shrink-0"><Icon className="w-4 h-4 text-green-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Guide */}
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> User Guide
            </h3>
            <div className="space-y-2">
              {[
                ['Getting Started Guide',        'Learn how to use the retailer portal'],
                ['Transaction Processing Guide', 'Step-by-step transaction workflow'],
                ['Inventory Management Guide',   'Managing your fertilizer stock'],
                ['Security & Compliance',        'Subsidy rules and compliance guidelines'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-green-50 cursor-pointer transition-colors border border-gray-100">
                  <BookOpen className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{title}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Issue */}
      <div className="card">
        <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Report an Issue</h3>
        {sent && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" /> Your report has been submitted. We'll get back to you within 24 hours.
          </div>
        )}
        <form onSubmit={handleReport}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Subject</label>
              <input className={inputCls} value={report.subject} onChange={e => setReport(r => ({ ...r, subject: e.target.value }))} placeholder="Brief description of the issue" required />
            </div>
            <div>
              <label className={labelCls}>Contact Number / Email</label>
              <input className={inputCls} value={report.contact} onChange={e => setReport(r => ({ ...r, contact: e.target.value }))} placeholder="Your contact for follow-up" required />
            </div>
          </div>
          <div className="mb-4">
            <label className={labelCls}>Description</label>
            <textarea className={inputCls} value={report.description} onChange={e => setReport(r => ({ ...r, description: e.target.value }))}
              placeholder="Describe the issue in detail..." rows={4} required style={{ resize:'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary gap-2 text-sm">
            <Send className="w-4 h-4" /> Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}
