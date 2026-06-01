"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../config/firebase"
import { ArrowLeft, Upload, FileText, CheckCircle, HelpCircle, Phone, Mail, Building2 } from "lucide-react"

export default function BankStatement() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [bankSettings, setBankSettings] = useState(null)
  const [adminContact, setAdminContact] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch Admin Bank Details
        const bankDoc = await getDoc(doc(db, "systemSettings", "bankStatementAccount"))
        if (bankDoc.exists()) {
          setBankSettings(bankDoc.data())
        }

        // Fetch Admin Contact Details
        const contactDoc = await getDoc(doc(db, "systemSettings", "adminContact"))
        if (contactDoc.exists()) {
          setAdminContact(contactDoc.data())
        }
        
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 mr-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Financial Verification</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Bank Statement Requirements</h2>
          <h3 className="text-xl font-bold text-gray-800 font-amharic">የባንክ መግለጫ መስፈርቶች</h3>
          <p className="text-gray-500 max-w-2xl mx-auto">Please choose one of the options below to proceed with your international job application.</p>
        </div>

        {/* Option 1 */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm mr-3">Option 1</span>
              Standard Verification
            </h3>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed font-medium">
                To proceed with your international job application, please upload a recent bank statement showing an available balance between 500,000 ETB and 2,000,000 ETB. The bank statement is required for financial verification and application processing purposes.
              </p>
              <p className="text-gray-700 leading-relaxed font-amharic">
                በዓለም አቀፍ የስራ ማመልከቻዎ ለመቀጠል፣ እባክዎ ከ500,000 ብር እስከ 2,000,000 ብር ያለውን ቀሪ ሂሳብ የሚያሳይ የቅርብ ጊዜ የባንክ መግለጫ ይስቀሉ። የባንክ መግለጫው ለፋይናንስ ማረጋገጫ እና ማመልከቻ ሂደቶች አስፈላጊ ነው።
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" /> Requirements / መስፈርቶች:
              </h4>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span> 
                  <span>Recent bank statement (issued within the last 3 months) <br/><span className="font-amharic">የቅርብ ጊዜ የባንክ መግለጫ (ባለፉት 3 ወራት ውስጥ የተሰጠ)</span></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span> 
                  <span>Clear and readable document <br/><span className="font-amharic">ግልጽ እና ሊነበብ የሚችል ሰነድ</span></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span> 
                  <span>Available balance between 500,000 ETB and 2,000,000 ETB <br/><span className="font-amharic">ከ500,000 ብር እስከ 2,000,000 ብር የሚገኝ ቀሪ ሂሳብ</span></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span> 
                  <span>PDF, JPG, or PNG format</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-gray-500 italic text-center">
              Your information will be kept secure and used only for application verification.
            </p>

            <div className="flex justify-center pt-2">
              <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                <Upload className="w-5 h-5" />
                <span>Upload Statement / መግለጫ ይስቀሉ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Option 2 */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">Recommended</div>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm mr-3">Option 2</span>
              Optional Applicant Support Program
            </h3>
          </div>
          
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed font-medium">
                If you need assistance with meeting the financial requirements, you may apply for our Optional Applicant Support Program.
              </p>
              <p className="text-gray-700 leading-relaxed font-amharic">
                የፋይናንስ መስፈርቶችን ለማሟላት እርዳታ ከፈለጉ፣ ለኛ አማራጭ የአመልካች ድጋፍ ፕሮግራም ማመልከት ይችላሉ።
              </p>
              <p className="text-gray-700 leading-relaxed font-medium">
                Participants may contribute a refundable service fee of 40,000 ETB for bank statement preparation and related document support during the application process. Funds from multiple applicants may be processed for statement preparation purposes. Once the bank statement preparation process is completed, the 40,000 ETB service fee will be returned to the applicant.
              </p>
              <p className="text-gray-700 leading-relaxed font-amharic">
                ተሳታፊዎች በማመልከቻው ሂደት ውስጥ ለባንክ መግለጫ ዝግጅት እና ተያያዥ የሰነድ ድጋፍ 40,000 ብር ተመላሽ የሚደረግ የአገልግሎት ክፍያ ማበርከት ይችላሉ። የባንክ መግለጫ ዝግጅት ሂደቱ ከተጠናቀቀ በኋላ፣ የ 40,000 ብር የአገልግሎት ክፍያ ለአመልካቹ ይመለሳል።
              </p>
            </div>

            {/* Admin Bank Details Display */}
            {bankSettings && (
              <div className="mt-6 border-2 border-emerald-100 rounded-xl bg-emerald-50/50 p-6">
                <h4 className="font-bold text-emerald-900 mb-4 text-center">Payment Details / የክፍያ ዝርዝሮች</h4>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  {bankSettings.bankLogoUrl ? (
                    <img src={bankSettings.bankLogoUrl} alt="Bank Logo" className="w-20 h-20 object-contain bg-white rounded-lg shadow-sm p-2" />
                  ) : (
                    <div className="w-20 h-20 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-500">
                      <Building2 className="w-10 h-10" />
                    </div>
                  )}
                  
                  <div className="text-center sm:text-left space-y-1">
                    <p className="font-bold text-xl text-gray-900">{bankSettings.bankName}</p>
                    <p className="text-gray-600 font-medium">{bankSettings.accountName}</p>
                    <div className="inline-block mt-2 bg-white px-4 py-2 rounded-lg border border-emerald-200 shadow-inner">
                      <p className="text-emerald-700 font-mono font-bold text-lg">{bankSettings.accountNumber}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Confirm Payment / ክፍያውን ያረጋግጡ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Support Contact Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center mt-8">
          <div className="flex justify-center mb-3">
            <HelpCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Need Assistance?</h3>
          <p className="text-gray-500 text-sm mb-6">Contact our support team for help with your bank statement.</p>
          
          <div className="flex flex-wrap justify-center gap-3">
            {/* Call */}
            <a
              href={adminContact?.phoneNumber ? `tel:${adminContact.phoneNumber}` : `#`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Call</span>
            </a>
            {/* Email */}
            <a
              href={adminContact?.email ? `mailto:${adminContact.email}` : `#`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Email</span>
            </a>
            {/* Telegram */}
            {adminContact?.telegram && (
              <a
                href={`https://t.me/${adminContact.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Telegram"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white transition-colors"
                style={{ backgroundColor: "#2AABEE" }}
              >
                <svg className="w-4 h-4 sm:mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
                <span className="hidden sm:inline">Telegram</span>
              </a>
            )}
            {/* WhatsApp */}
            {adminContact?.whatsapp && (
              <a
                href={`https://wa.me/${adminContact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white transition-colors"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg className="w-4 h-4 sm:mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            {/* IMO */}
            {adminContact?.imo && (
              <a
                href={`tel:${adminContact.imo.replace(/[^0-9+]/g, '')}`}
                title="IMO (Save to contacts first)"
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white transition-colors"
                style={{ backgroundColor: "#1565C0" }}
              >
                {/* Real IMO Logo */}
                <svg className="w-5 h-5 sm:mr-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" rx="22" fill="#1565C0"/>
                  <path d="M50 15C30.7 15 15 28.4 15 45c0 9.2 4.8 17.4 12.4 23L24 75l16-5.6c3 .9 6.3 1.4 9.8 1.4C69.3 70.8 85 57.4 85 41c0-14.4-15.7-26-35-26z" fill="white"/>
                  <text x="50" y="52" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#1565C0" fontFamily="Arial, sans-serif">imo</text>
                </svg>
                <span className="hidden sm:inline">IMO</span>
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
