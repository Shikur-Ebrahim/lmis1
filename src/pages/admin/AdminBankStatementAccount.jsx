"use client"

import { useState, useEffect, useRef } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../config/firebase"
import { Building2, Save, CheckCircle, AlertCircle, Hash, User, Upload, X, ImageIcon } from "lucide-react"

export default function AdminBankStatementAccount() {
  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    bankLogoUrl: ""
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchBankInfo()
  }, [])

  const fetchBankInfo = async () => {
    try {
      setLoading(true)
      const docRef = doc(db, "systemSettings", "bankStatementAccount")
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        setBankInfo({
          bankName: data.bankName || "",
          accountName: data.accountName || "",
          accountNumber: data.accountNumber || "",
          bankLogoUrl: data.bankLogoUrl || ""
        })
        if (data.bankLogoUrl) {
          setLogoPreview(data.bankLogoUrl)
        }
      }
    } catch (error) {
      console.error("Error fetching bank settings:", error)
      showMessage("Error loading settings. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const docRef = doc(db, "systemSettings", "bankStatementAccount")
      await setDoc(docRef, bankInfo, { merge: true })
      
      showMessage("Bank account details saved successfully!", "success")
    } catch (error) {
      console.error("Error saving bank details:", error)
      showMessage("Error saving details. Please try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setBankInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage("Please select an image file (JPG, PNG, etc.)", "error")
      return
    }

    // Validate file size (max 500KB for Firestore storage)
    if (file.size > 500 * 1024) {
      showMessage("Image must be smaller than 500KB for optimal performance.", "error")
      return
    }

    setUploadingLogo(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target.result
      setLogoPreview(base64String)
      setBankInfo(prev => ({ ...prev, bankLogoUrl: base64String }))
      setUploadingLogo(false)
    }
    reader.onerror = () => {
      showMessage("Failed to read image file. Please try again.", "error")
      setUploadingLogo(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setBankInfo(prev => ({ ...prev, bankLogoUrl: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type })
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Bank Statement Account</h1>
              <p className="text-emerald-100 mt-1">Configure the bank account details shown to users for the 40,000 ETB Optional Support Program.</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          
          {message && (
            <div className={`p-4 rounded-xl flex items-center space-x-3 transition-all ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="bankName"
                  value={bankInfo.bankName}
                  onChange={handleChange}
                  placeholder="e.g., Commercial Bank of Ethiopia"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="accountName"
                  value={bankInfo.accountName}
                  onChange={handleChange}
                  placeholder="e.g., Agency Official Name"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="accountNumber"
                  value={bankInfo.accountNumber}
                  onChange={handleChange}
                  placeholder="1000123456789"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none"
                />
              </div>
            </div>

            {/* Bank Logo - File Upload from Gallery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Logo</label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="bankLogoFileInput"
              />

              {logoPreview ? (
                /* Preview with remove option */
                <div className="relative w-full border-2 border-emerald-300 rounded-xl p-4 bg-emerald-50 flex items-center space-x-4">
                  <img
                    src={logoPreview}
                    alt="Bank Logo Preview"
                    className="w-16 h-16 object-contain bg-white rounded-lg shadow-sm p-1 border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-700">Logo uploaded ✓</p>
                    <p className="text-xs text-gray-500 mt-0.5">Click change to update</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Change Logo
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute top-2 right-2 p-1 bg-red-100 rounded-full hover:bg-red-200 transition-colors text-red-500"
                    title="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Upload button */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group disabled:opacity-60"
                >
                  {uploadingLogo ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                  ) : (
                    <>
                      <div className="p-3 bg-gray-100 rounded-full group-hover:bg-emerald-100 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 group-hover:text-emerald-700">
                        Upload from Gallery
                      </p>
                      <p className="text-xs text-gray-400">JPG, PNG, SVG · Max 500KB</p>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
          
          {/* Preview Section */}
          {bankInfo.bankName && (
             <div className="mt-8 p-6 border border-gray-200 rounded-xl bg-gray-50 flex items-center space-x-6">
                {logoPreview ? (
                   <img src={logoPreview} alt="Bank Logo" className="w-16 h-16 object-contain bg-white rounded shadow-sm p-1" />
                ) : (
                   <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                     <Building2 className="w-8 h-8" />
                   </div>
                )}
                <div>
                   <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Preview</h3>
                   <p className="font-bold text-lg text-gray-900">{bankInfo.bankName}</p>
                   <p className="text-gray-700">{bankInfo.accountName}</p>
                   <p className="text-gray-900 font-mono mt-1 text-lg">{bankInfo.accountNumber}</p>
                </div>
             </div>
          )}

          <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-70 shadow-md"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Bank Details</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
