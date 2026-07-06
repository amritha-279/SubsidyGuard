import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function VerificationPanel({ result, onReset }) {
  const [expandedCheck, setExpandedCheck] = useState(null);

  if (!result) return null;

  const getStatusConfig = (status) => {
    switch(status) {
      case 'GREEN': return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, title: 'Transaction Approved' };
      case 'YELLOW': return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, title: 'Warning: OTP Required' };
      case 'RED': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, title: 'Transaction Blocked: Officer Review Required' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: CheckCircle2, title: 'Unknown' };
    }
  };

  const config = getStatusConfig(result.status);
  const StatusIcon = config.icon;

  return (
    <div className={`mt-8 rounded-xl border-2 ${config.border} bg-white shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      {/* Header */}
      <div className={`${config.bg} p-6 border-b ${config.border} flex items-center gap-4`}>
        <div className="bg-white p-2 rounded-full shadow-sm">
          <StatusIcon className={`w-8 h-8 ${config.color}`} />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${config.color}`}>{config.title}</h2>
          <p className="text-gray-600 mt-1">
            Transaction ID: #{result.transactionId} • Analyzed by Subsidy Guard
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Verification Steps</h3>
        <div className="space-y-3">
          {result.checks.map((check, index) => {
            const isGreen = check.color === 'green';
            const isYellow = check.color === 'yellow';
            const isRed = check.color === 'red';
            
            const CheckIcon = isGreen ? CheckCircle2 : (isYellow ? AlertTriangle : XCircle);
            const checkColor = isGreen ? 'text-green-600' : (isYellow ? 'text-yellow-600' : 'text-red-600');
            const isExpanded = expandedCheck === index;

            return (
              <div 
                key={check.id} 
                className="border border-gray-100 rounded-lg overflow-hidden transition-all duration-200 hover:border-gray-300"
              >
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer bg-gray-50/50"
                  onClick={() => setExpandedCheck(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <CheckIcon className={`w-5 h-5 ${checkColor}`} />
                    <span className="font-medium text-gray-800">{check.name}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
                
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-100 text-sm text-gray-600">
                    {check.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onReset} className="btn btn-secondary">
            Process Another
          </button>
          
          {result.status === 'YELLOW' && (
            <button className="btn bg-yellow-500 text-white hover:bg-yellow-600">
              Send OTP to Farmer
            </button>
          )}
          
          {result.status === 'GREEN' && (
            <button className="btn btn-primary">
              Print Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
