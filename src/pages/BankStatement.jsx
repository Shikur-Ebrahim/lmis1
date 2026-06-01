"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../config/firebase"
import { CLOUDINARY_CONFIG } from "../utils/cloudinary"
import {
  ArrowLeft, Upload, FileText, CheckCircle, HelpCircle,
  Phone, Mail, Building2, Copy, Check, ShieldAlert,
  Camera, X, Lock, Clock, Eye
} from "lucide-react"

const uploadToCloudinary = async (file) => {
  const isImage = file.type.startsWith("image/")
  const resourceType = isImage ? "image" : "raw"
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPresets.profile)
  formData.append("folder", "lmis/bank-statements")
  const response = await fetch(url, { method: "POST", body: formData })
  if (!response.ok) throw new Error("Upload failed")
  const data = await response.json()
  return data.secure_url
}

export default function BankStatement() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [bankSettings, setBankSettings] = useState(null)
  const [adminContact, setAdminContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Existing upload status
  const [existingUpload, setExistingUpload] = useState(null) // { url, option, viewedByAdmin }

  // Option 1
  const [statementFile, setStatementFile] = useState(null)
  const [statementPreview, setStatementPreview] = useState(null)
  const [uploadingStatement, setUploadingStatement] = useState(false)
  const [statementUploaded, setStatementUploaded] = useState(false)
  const statementInputRef = useRef(null)

  // Option 2
  const [paymentFile, setPaymentFile] = useState(null)
  const [paymentPreview, setPaymentPreview] = useState(null)
  const [uploadingPayment, setUploadingPayment] = useState(false)
  const [paymentUploaded, setPaymentUploaded] = useState(false)
  const paymentInputRef = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const bankDoc = await getDoc(doc(db, "systemSettings", "bankStatementAccount"))
        if (bankDoc.exists()) setBankSettings(bankDoc.data())

        const contactDoc = await getDoc(doc(db, "systemSettings", "adminContact"))
        if (contactDoc.exists()) setAdminContact(contactDoc.data())

        // Check if applicant already uploaded
        if (id) {
          const applicantDoc = await getDoc(doc(db, "applicants", id))
          if (applicantDoc.exists()) {
            const data = applicantDoc.data()
            if (data.bankStatementUrl) {
              setExistingUpload({
                url: data.bankStatementUrl,
                option: data.bankStatementOption,
                viewedByAdmin: data.bankStatementViewedByAdmin,
                uploadedAt: data.bankStatementUploadedAt,
              })
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleCopyAccount = () => {
    if (!bankSettings?.accountNumber) return
    navigator.clipboard.writeText(bankSettings.accountNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // Option 1: bank statement file upload
  const handleStatementFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if (!validTypes.includes(file.type)) { alert("Please select a JPG, PNG, or PDF file."); return }
    if (file.size > 5 * 1024 * 1024) { alert("File must be smaller than 5MB."); return }
    setStatementFile(file)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setStatementPreview(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      setStatementPreview("pdf")
    }
  }

  const handleStatementUpload = async () => {
    if (!statementFile) return
    setUploadingStatement(true)
    try {
      const url = await uploadToCloudinary(statementFile)
      if (id) {
        await updateDoc(doc(db, "applicants", id), {
          bankStatementUrl: url,
          bankStatementFileName: statementFile.name,
          bankStatementUploadedAt: new Date().toISOString(),
          bankStatementOption: "option1",
          bankStatementViewedByAdmin: false,
        })
      }
      setStatementUploaded(true)
      setExistingUpload({ url, option: "option1", viewedByAdmin: false, uploadedAt: new Date().toISOString() })
    } catch (err) {
      console.error(err)
      alert("Upload failed. Please try again.")
    } finally {
      setUploadingStatement(false)
    }
  }

  // Option 2: payment screenshot upload
  const handlePaymentFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { alert("Please select an image (JPG or PNG)."); return }
    if (file.size > 5 * 1024 * 1024) { alert("File must be smaller than 5MB."); return }
    setPaymentFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPaymentPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handlePaymentUpload = async () => {
    if (!paymentFile) return
    setUploadingPayment(true)
    try {
      const url = await uploadToCloudinary(paymentFile)
      if (id) {
        await updateDoc(doc(db, "applicants", id), {
          bankStatementUrl: url,
          bankStatementFileName: paymentFile.name,
          bankStatementUploadedAt: new Date().toISOString(),
          bankStatementOption: "option2",
          bankStatementViewedByAdmin: false,
        })
      }
      setPaymentUploaded(true)
      setExistingUpload({ url, option: "option2", viewedByAdmin: false, uploadedAt: new Date().toISOString() })
    } catch (err) {
      console.error(err)
      alert("Upload failed. Please try again.")
    } finally {
      setUploadingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
      </div>
    )
  }

  // Already uploaded and pending admin review
  const isPendingReview = existingUpload && existingUpload.viewedByAdmin === false

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-3 sm:px-6">
          <div className="flex items-center h-14">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-1 mr-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-gray-900">Financial Verification</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-5 space-y-5">

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-gray-900">Bank Statement Requirements</h2>
          <h3 className="text-base font-bold text-gray-800 font-amharic">የባንክ መግለጫ መስፈርቶች</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">Please choose one of the options below to proceed.</p>
        </div>

        {/* ── PENDING REVIEW BANNER ── */}
        {isPendingReview && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 flex gap-3 items-start shadow-sm">
            <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 mb-1">Document Under Review / ሰነዱ በገምገማ ላይ ነው</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Your document has been submitted and is awaiting admin review. You will be able to upload again once the admin has viewed your document.
              </p>
              <p className="text-xs text-amber-700 leading-relaxed font-amharic mt-1">
                ሰነዳችሁ ቀርቦ ሲሆን ለአስተዳዳሪ ግምገማ እየጠበቀ ነው።
              </p>
              {existingUpload.uploadedAt && (
                <p className="text-xs text-amber-600 mt-2 font-mono">
                  Uploaded: {new Date(existingUpload.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        )}

        {/* ── OPTION 1 ── */}
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isPendingReview ? "opacity-60 pointer-events-none border-gray-100" : "border-gray-100"}`}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs">Option 1</span>
              Standard Verification
              {isPendingReview && <Lock className="w-4 h-4 ml-auto" />}
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-gray-700 leading-relaxed">
                Upload a recent bank statement showing an available balance between <strong>500,000 ETB</strong> and <strong>2,000,000 ETB</strong>.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed font-amharic">
                ከ500,000 ብር እስከ 2,000,000 ብር ያለውን ቀሪ ሂሳብ የሚያሳይ የቅርብ ጊዜ የባንክ መግለጫ ይስቀሉ።
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center text-xs">
                <CheckCircle className="w-4 h-4 mr-1.5 text-blue-600" /> Requirements:
              </h4>
              <ul className="space-y-1 text-blue-800 text-xs">
                <li className="flex items-start gap-1.5"><span>•</span><span>Recent bank statement (last 3 months)</span></li>
                <li className="flex items-start gap-1.5"><span>•</span><span>Clear and readable document</span></li>
                <li className="flex items-start gap-1.5"><span>•</span><span>Balance: 500,000–2,000,000 ETB</span></li>
                <li className="flex items-start gap-1.5"><span>•</span><span>PDF, JPG, or PNG format</span></li>
              </ul>
            </div>

            <p className="text-xs text-gray-400 italic text-center">
              Your information will be kept secure and used only for application verification.
            </p>

            <input
              ref={statementInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleStatementFileChange}
              className="hidden"
            />

            {statementUploaded ? (
              <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl py-3 px-4">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-bold">Statement Uploaded Successfully!</span>
              </div>
            ) : isPendingReview ? (
              <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl py-3 px-4">
                <Lock className="w-5 h-5" />
                <span className="text-sm font-bold">Locked – Pending Admin Review</span>
              </div>
            ) : statementPreview ? (
              <div className="space-y-3">
                <div className="relative border-2 border-blue-200 rounded-xl overflow-hidden bg-blue-50">
                  {statementPreview === "pdf" ? (
                    <div className="flex items-center gap-3 p-3">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">{statementFile?.name}</p>
                        <p className="text-xs text-gray-500">PDF Document</p>
                      </div>
                    </div>
                  ) : (
                    <img src={statementPreview} alt="Statement preview" className="w-full max-h-40 object-contain" />
                  )}
                  <button
                    onClick={() => { setStatementFile(null); setStatementPreview(null); if (statementInputRef.current) statementInputRef.current.value = "" }}
                    className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 rounded-full p-1 text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleStatementUpload}
                  disabled={uploadingStatement}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-60"
                >
                  {uploadingStatement ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /><span>Uploading...</span></>
                  ) : (
                    <><Upload className="w-4 h-4" /><span>Submit Statement</span></>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => statementInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Statement / መግለጫ ይስቀሉ</span>
              </button>
            )}
          </div>
        </div>

        {/* ── OPTION 2 ── */}
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden relative ${isPendingReview ? "opacity-60 pointer-events-none border-gray-100" : "border-gray-100"}`}>
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">Recommended</div>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs">Option 2</span>
              Optional Applicant Support Program
              {isPendingReview && <Lock className="w-4 h-4 ml-auto" />}
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-gray-700 leading-relaxed">
                If you need assistance with meeting the financial requirements, you may apply for our Optional Applicant Support Program.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed font-amharic">
                የፋይናንስ መስፈርቶችን ለማሟላት እርዳታ ከፈለጉ፣ ለኛ አማራጭ የአመልካች ድጋፍ ፕሮግራም ማመልከት ይችላሉ።
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                Participants may contribute a refundable service fee of <strong>40,000 ETB</strong> for bank statement preparation and related document support.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed font-amharic">
                ተሳታፊዎች 40,000 ብር ተመላሽ የሚደረግ የአገልግሎት ክፍያ ማበርከት ይችላሉ።
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800">⚠️ Important Notice / አስፈላጊ ማሳሰቢያ</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Please make payment <strong>ONLY</strong> to the official account listed below. We are not responsible for payments made to unauthorized accounts.
                </p>
                <p className="text-xs text-amber-700 leading-relaxed font-amharic">
                  ክፍያዎን <strong>ብቻ</strong> ከዚህ በታች ለተዘረዘረው ይፋዊ ሂሳብ ይክፈሉ።
                </p>
              </div>
            </div>

            {bankSettings && (
              <div className="border-2 border-emerald-100 rounded-xl bg-emerald-50/50 p-4 space-y-4">
                <h4 className="font-bold text-emerald-900 text-center text-xs uppercase tracking-wide">
                  Payment Details / የክፍያ ዝርዝሮች
                </h4>

                <div className="flex flex-col items-center gap-3">
                  {bankSettings.bankLogoUrl ? (
                    <img src={bankSettings.bankLogoUrl} alt="Bank Logo" className="w-16 h-16 object-contain bg-white rounded-lg shadow-sm p-2" />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-500">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}

                  <div className="text-center space-y-0.5">
                    <p className="font-bold text-sm text-gray-900">{bankSettings.bankName}</p>
                    <p className="text-xs text-gray-600">{bankSettings.accountName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-white px-4 py-2 rounded-lg border border-emerald-200 shadow-inner">
                      <p className="text-emerald-700 font-mono font-bold text-sm tracking-widest">
                        {bankSettings.accountNumber}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyAccount}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${copied ? "bg-green-100 border-green-400 text-green-700" : "bg-white border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-700"}`}
                    >
                      {copied ? <><Check className="w-3.5 h-3.5" /><span>Copied!</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
                    </button>
                  </div>
                </div>

                {/* Payment Screenshot Upload */}
                <div className="border-t border-emerald-100 pt-4 space-y-3">
                  <p className="text-xs font-bold text-gray-700 text-center">After paying, upload your payment screenshot:</p>
                  <p className="text-xs text-gray-500 text-center font-amharic">ከከፈሉ በኋላ የክፍያ ቅጂዎን ይስቀሉ:</p>

                  <input
                    ref={paymentInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentFileChange}
                    className="hidden"
                  />

                  {paymentUploaded ? (
                    <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl py-3 px-4">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-xs font-bold">Payment Screenshot Submitted!</span>
                    </div>
                  ) : isPendingReview ? (
                    <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl py-3 px-4">
                      <Lock className="w-5 h-5" />
                      <span className="text-xs font-bold">Locked – Pending Admin Review</span>
                    </div>
                  ) : paymentPreview ? (
                    <div className="space-y-3">
                      <div className="relative border-2 border-emerald-200 rounded-xl overflow-hidden bg-emerald-50">
                        <img src={paymentPreview} alt="Payment screenshot" className="w-full max-h-36 object-contain" />
                        <button
                          onClick={() => { setPaymentFile(null); setPaymentPreview(null); if (paymentInputRef.current) paymentInputRef.current.value = "" }}
                          className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 rounded-full p-1 text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={handlePaymentUpload}
                        disabled={uploadingPayment}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-60"
                      >
                        {uploadingPayment ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /><span>Uploading...</span></>
                        ) : (
                          <><Upload className="w-4 h-4" /><span>Confirm Payment / ክፍያውን ያረጋግጡ</span></>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => paymentInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Upload Payment Screenshot / ቅጂ ይስቀሉ</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Support Contact ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="flex justify-center mb-2">
            <HelpCircle className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-0.5">Need Assistance?</h3>
          <p className="text-xs text-gray-500 mb-4">Contact our support team for help.</p>

          <div className="flex flex-wrap justify-center gap-2">
            <a
              href={adminContact?.phoneNumber ? `tel:${adminContact.phoneNumber}` : "#"}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </a>
            <a
              href={adminContact?.email ? `mailto:${adminContact.email}` : "#"}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </a>
            {adminContact?.telegram && (
              <a
                href={`https://t.me/${adminContact.telegram}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-white transition-colors"
                style={{ backgroundColor: "#2AABEE" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
                </svg>
                <span>Telegram</span>
              </a>
            )}
            {adminContact?.whatsapp && (
              <a
                href={`https://wa.me/${adminContact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-white transition-colors"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
