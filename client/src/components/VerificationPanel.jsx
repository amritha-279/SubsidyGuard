import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { useState } from 'react';

export default function VerificationPanel({ result, onReset }) {
  const [expandedCheck, setExpandedCheck] = useState(null);

  if (!result) return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'GREEN': return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, title: 'Transaction Approved' };
      case 'YELLOW': return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, title: 'Warning: OTP Required' };
      case 'RED': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, title: 'Transaction Blocked: Officer Review Required' };
      default: return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: CheckCircle2, title: 'Unknown' };
    }
  };

  const config = getStatusConfig(result.status);
  const StatusIcon = config.icon;
  const ml = result.mlResult;

  const probBarColor = ml
    ? ml.fraud_probability >= 65 ? 'bg-red-500'
      : ml.fraud_probability >= 35 ? 'bg-yellow-500'
      : 'bg-green-500'
    : 'bg-gray-300';

  return (
    <div className={`mt-8 rounded-xl border-2 ${config.border} bg-white shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className={`${config.bg} p-6 border-b ${config.border} flex items-center gap-4`}>
        <div className="bg-white p-2 rounded-full shadow-sm">
          <StatusIcon className={`w-8 h-8 ${config.color}`} />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${config.color}`}>{config.title}</h2>
          <p className="text-gray-600 mt-1">Transaction ID: #{result.transactionId} • Analyzed by Subsidy Guard</p>
        </div>
      </div>

      {/* ML Fraud Score Card */}
      {ml && (
        <div className="px-6 pt-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">AI Fraud Analysis</h3>
              <span className="ml-auto text-xs text-gray-500">Confidence: {ml.confidence_score}%</span>
            </div>

            {/* Probability bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Fraud Probability</span>
                <span className="font-bold text-gray-800">{ml.fraud_probability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${probBarColor}`}
                  style={{ width: `${ml.fraud_probability}%` }}
                />
              </div>
            </div>

            {/* AI Reasons */}
            <div className="space-y-1">
              {ml.reasons.map((reason, i) => (
                <p key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-purple-400 mt-0.5">•</span> {reason}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Verification Steps</h3>
        <div className="space-y-3">
          {result.checks.map((check, index) => {
            const isGreen = check.color === 'green';
            const isYellow = check.color === 'yellow';
            const CheckIcon = isGreen ? CheckCircle2 : isYellow ? AlertTriangle : XCircle;
            const checkColor = isGreen ? 'text-green-600' : isYellow ? 'text-yellow-600' : 'text-red-600';
            const isExpanded = expandedCheck === index;

            return (
              <div key={check.id} className="border border-gray-100 rounded-lg overflow-hidden hover:border-gray-300 transition-all">
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
          <button onClick={onReset} className="btn btn-secondary">Process Another</button>
          {result.status === 'YELLOW' && (
            <button className="btn bg-yellow-500 text-white hover:bg-yellow-600">Send OTP to Farmer</button>
          )}
          {result.status === 'GREEN' && (
            <button className="btn btn-primary">Print Receipt</button>
          )}
        </div>
      </div>
    </div>
  );
}
