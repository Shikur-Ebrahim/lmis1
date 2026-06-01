"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../config/firebase"
import { Building2, Save, CheckCircle, AlertCircle, Hash, User, Image as ImageIcon } from "lucide-react"

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

            {/* Bank Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Logo URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="bankLogoUrl"
                  value={bankInfo.bankLogoUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Provide a direct link to an image.</p>
            </div>

          </div>
          
          {/* Preview Section */}
          {bankInfo.bankName && (
             <div className="mt-8 p-6 border border-gray-200 rounded-xl bg-gray-50 flex items-center space-x-6">
                {bankInfo.bankLogoUrl ? (
                   <img src={bankInfo.bankLogoUrl} alt="Bank Logo" className="w-16 h-16 object-contain bg-white rounded shadow-sm p-1" />
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
