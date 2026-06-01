"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { doc, setDoc, onSnapshot, collection, query, where } from "firebase/firestore"
import { db } from "../../config/firebase"
import {
  Users,
  Settings,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react"
import { useToast } from "../../contexts/ToastContext"

export default function UnderReviewSettings() {
  const { showToast } = useToast()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [underReviewCount, setUnderReviewCount] = useState(0)

  // Fetch under-review settings amount and under-review count
  useEffect(() => {
    // 1. Listen to settings/under_review
    const docRef = doc(db, "settings", "under_review")
    const unsubscribeSettings = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAmount(docSnap.data().amount || "")
      }
      setLoading(false)
    }, (error) => {
      console.error("Error listening to under-review settings:", error)
      setLoading(false)
    })

    // 2. Listen to users collection where status == 'Under Review'
    const usersQuery = query(collection(db, "users"), where("status", "==", "Under Review"))
    const unsubscribeCount = onSnapshot(usersQuery, (snapshot) => {
      setUnderReviewCount(snapshot.size)
    }, (error) => {
      console.error("Error listening to under-review users count:", error)
    })

    return () => {
      unsubscribeSettings()
      unsubscribeCount()
    }
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!amount.trim()) {
      showToast("Please enter a count of applicants", "error")
      return
    }

    const numericAmount = parseInt(amount, 10)
    if (isNaN(numericAmount) || numericAmount < 0) {
      showToast("Please enter a valid positive number", "error")
      return
    }

    setIsSaving(true)
    try {
      const docRef = doc(db, "settings", "under_review")
      await setDoc(docRef, {
        amount: numericAmount,
        updatedAt: new Date(),
      })
      showToast("Under Review applicants count updated successfully!", "success")
    } catch (error) {
      console.error("Error updating settings:", error)
      showToast("Failed to save settings. Please try again.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg">Loading Settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Link to="/admin/dashboard" className="text-sm font-semibold uppercase tracking-wider">
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase tracking-tight flex items-center">
              <Settings className="w-8 h-8 mr-3 text-cyan-400" />
              Under Review Settings
            </h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Configure the number of applicants displayed under review section</p>
          </div>

          <div className="bg-gray-800/50 p-1.5 rounded-2xl border border-gray-700 flex items-center self-start">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 rounded-xl border border-gray-700">
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-bounce" />
              <span className="text-xs font-black text-gray-300 uppercase tracking-widest">
                {underReviewCount} Under Review Files
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings Form Card */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-[2rem] p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center text-cyan-400">
              <Users className="w-5 h-5 mr-2" />
              Configure Applicant Count
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Display Number of Applicants
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 350"
                    min="0"
                    className="w-full pl-6 pr-28 py-4 bg-gray-800/50 border border-gray-700 rounded-2xl text-lg font-mono focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs uppercase tracking-wider">
                    Applicants
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 font-bold text-white rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{isSaving ? "Saving..." : "Save Settings"}</span>
              </button>
            </form>
          </div>

          {/* Quick Stats & Live Preview */}
          <div className="space-y-6">
            {/* Total Review Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-850 border border-gray-800 rounded-[2rem] p-6 flex items-center justify-between">
              <div>
                <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">
                  Active Under Review Files
                </h3>
                <p className="text-4xl font-extrabold text-white">{underReviewCount}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Applicants awaiting approval or review
                </p>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                <Users className="w-10 h-10 text-yellow-500" />
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="bg-gray-900/40 border border-dashed border-gray-800 rounded-[2rem] p-6 space-y-4">
              <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">
                Landing Page Preview
              </h3>
              
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    Live Display
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">Preview</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">
                      Applicants Under Review
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Total Count: {amount ? Number(amount).toLocaleString() : "0"} Applicants
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
