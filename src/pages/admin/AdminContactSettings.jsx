"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../config/firebase"
import { Phone, Mail, Send, MessageCircle, MessageSquare, Save, CheckCircle, AlertCircle } from "lucide-react"

export default function AdminContactSettings() {
  const [contact, setContact] = useState({
    phoneNumber: "",
    email: "",
    telegram: "",
    whatsapp: "",
    imo: ""
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchContactSettings()
  }, [])

  const fetchContactSettings = async () => {
    try {
      setLoading(true)
      const docRef = doc(db, "systemSettings", "adminContact")
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        setContact({
          phoneNumber: data.phoneNumber || "",
          email: data.email || "",
          telegram: data.telegram || "",
          whatsapp: data.whatsapp || "",
          imo: data.imo || ""
        })
      }
    } catch (error) {
      console.error("Error fetching contact settings:", error)
      showMessage("Error loading settings. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const docRef = doc(db, "systemSettings", "adminContact")
      await setDoc(docRef, contact, { merge: true })
      
      showMessage("Contact settings saved successfully!", "success")
    } catch (error) {
      console.error("Error saving contact settings:", error)
      showMessage("Error saving settings. Please try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setContact(prev => ({ ...prev, [name]: value }))
  }

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type })
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Agency Contact Details</h1>
              <p className="text-blue-100 mt-1">Set the contact information that visitors will use to reach the agency instead of applicants directly.</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {message && (
            <div className={`p-4 rounded-xl flex items-center space-x-3 transition-all ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4 col-span-1 md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Primary Contact</h2>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="phoneNumber"
                  value={contact.phoneNumber}
                  onChange={handleChange}
                  placeholder="+251911223344"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +251)</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={contact.email}
                  onChange={handleChange}
                  placeholder="contact@agency.com"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 col-span-1 md:col-span-2 mt-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Social Media Links</h2>
            </div>

            {/* Telegram */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telegram Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Send className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="telegram"
                  value={contact.telegram}
                  onChange={handleChange}
                  placeholder="username (without @)"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Example: agency_contact</p>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="whatsapp"
                  value={contact.whatsapp}
                  onChange={handleChange}
                  placeholder="+251911223344"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Include country code, no spaces or +</p>
            </div>

            {/* IMO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IMO Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="imo"
                  value={contact.imo}
                  onChange={handleChange}
                  placeholder="+251911223344"
                  className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Include country code</p>
            </div>

          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-70 shadow-md"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Contact Details</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
