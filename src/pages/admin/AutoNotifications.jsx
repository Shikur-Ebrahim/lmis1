"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../config/firebase"
import { Bell, Save, CheckCircle, AlertCircle } from "lucide-react"

export default function AutoNotifications() {
  const [settings, setSettings] = useState({
    isActive: false,
    maxViews: 2,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const docRef = doc(db, "systemSettings", "acceptanceNotification")
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        setSettings({
          isActive: data.isActive || false,
          maxViews: typeof data.maxViews === 'number' ? data.maxViews : 2,
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      showMessage("Error loading settings. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const docRef = doc(db, "systemSettings", "acceptanceNotification")
      await setDoc(docRef, settings, { merge: true })
      
      showMessage("Settings saved successfully!", "success")
    } catch (error) {
      console.error("Error saving settings:", error)
      showMessage("Error saving settings. Please try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type })
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-8 border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <Bell className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">System Notifications</h1>
              <p className="text-gray-400 mt-1">Manage automatic popups and alerts for users.</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {message && (
            <div className={`p-4 rounded-xl flex items-center space-x-3 transition-all ${
              message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-6">Acceptance Popup Settings</h2>
            
            <div className="space-y-6">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-200">Active Status</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    When active, a congratulatory modal will pop up when an accepted user enters their phone number to check their status on the landing page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(s => ({ ...s, isActive: !s.isActive }))}
                  className={`${
                    settings.isActive ? 'bg-cyan-500' : 'bg-gray-600'
                  } relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
                >
                  <span
                    className={`${
                      settings.isActive ? 'translate-x-7' : 'translate-x-0'
                    } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>

              <div className="border-t border-gray-700/50 pt-6">
                <label className="block">
                  <h3 className="text-lg font-medium text-gray-200">Max Display Count</h3>
                  <p className="text-sm text-gray-400 mt-1 mb-3">
                    How many times should this notification be shown to a specific user before it stops appearing?
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxViews}
                    onChange={(e) => setSettings(s => ({ ...s, maxViews: parseInt(e.target.value) || 1 }))}
                    className="w-full md:w-1/3 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-800">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
