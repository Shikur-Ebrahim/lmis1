import React from "react";
import { CheckCircle, X } from "lucide-react";

export default function AcceptanceNotificationModal({ isOpen, onClose, onOk, applicantName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeInUp transform transition-all relative"
      >
        {/* Decorative Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-24 flex items-center justify-center relative">
           <button 
             onClick={onClose}
             className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
           >
             <X className="w-6 h-6" />
           </button>
           <div className="absolute -bottom-8 bg-white p-2 rounded-full shadow-lg">
             <CheckCircle className="w-12 h-12 text-green-500" />
           </div>
        </div>

        {/* Content */}
        <div className="pt-12 pb-6 px-6 text-center space-y-6">
          
          {/* English Section */}
          <div className="space-y-1">
             <h2 className="text-xl font-bold text-gray-800">
               Dear <span className="text-green-600">{applicantName}</span>,
             </h2>
             <h2 className="text-2xl font-extrabold text-gray-900">
               Congratulations!
             </h2>
             <p className="text-sm font-medium leading-relaxed text-gray-600">
               You are accepted for the job. Please finish the bank statement process.
             </p>
          </div>

          <hr className="border-gray-200 w-1/2 mx-auto" />

          {/* Amharic Section */}
          <div className="space-y-1">
             <h2 className="text-lg font-bold text-gray-800 font-amharic">
               ውድ <span className="text-green-600">{applicantName}</span>,
             </h2>
             <h3 className="text-xl font-bold text-gray-900 font-amharic">
               እንኳን ደስ አሎት!
             </h3>
             <p className="text-sm font-medium leading-relaxed text-gray-600 font-amharic">
               ለስራው ተቀባይነት አግኝተዋል። እባክዎ የባንክ መግለጫ ሂደቱን ያጠናቅቁ።
             </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOk}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              OK / እሺ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
