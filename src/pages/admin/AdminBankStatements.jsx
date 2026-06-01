"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "../../config/firebase"
import {
  FileText, Eye, X, CheckCircle, Clock, ExternalLink,
  User, Calendar, Image as ImageIcon, Filter, Search,
  ShieldCheck, Download
} from "lucide-react"

export default function AdminBankStatements() {
  const [applicants, setApplicants] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "applicants"), (snapshot) => {
      const docs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.bankStatementUrl)
        .sort((a, b) => {
          // Unviewed first, then by uploadedAt
          if (!a.bankStatementViewedByAdmin && b.bankStatementViewedByAdmin) return -1
          if (a.bankStatementViewedByAdmin && !b.bankStatementViewedByAdmin) return 1
          const dateA = a.bankStatementUploadedAt ? new Date(a.bankStatementUploadedAt) : new Date(0)
          const dateB = b.bankStatementUploadedAt ? new Date(b.bankStatementUploadedAt) : new Date(0)
          return dateB - dateA
        })
      setApplicants(docs)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let result = applicants.filter(a => {
      const name = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase()
      const phone = (a.phoneNumber || "").toLowerCase()
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm.toLowerCase())
      const viewed = a.bankStatementViewedByAdmin === true
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && !viewed) ||
        (statusFilter === "viewed" && viewed)
      return matchesSearch && matchesStatus
    })
    setFiltered(result)
  }, [applicants, searchTerm, statusFilter])

  const handleView = async (applicant) => {
    setSelectedDoc(applicant)
    setShowModal(true)
    // Mark as viewed in Firestore
    if (!applicant.bankStatementViewedByAdmin) {
      try {
        await updateDoc(doc(db, "applicants", applicant.id), {
          bankStatementViewedByAdmin: true,
          bankStatementViewedAt: new Date().toISOString(),
        })
      } catch (err) {
        console.error("Error marking as viewed:", err)
      }
    }
  }

  const formatDate = (iso) => {
    if (!iso) return "N/A"
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })
  }

  const isPdf = (url) => url && url.toLowerCase().includes(".pdf")

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  const pendingCount = applicants.filter(a => !a.bankStatementViewedByAdmin).length

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase tracking-tight">
              Bank Statements
            </h1>
            <p className="text-gray-400 text-sm font-medium mt-1">
              Review uploaded bank statement documents from applicants
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  {pendingCount} New
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-2xl">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
                {applicants.length} Total
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all font-bold appearance-none uppercase text-xs tracking-widest"
            >
              <option value="all">All Documents</option>
              <option value="pending">New / Unviewed</option>
              <option value="viewed">Viewed</option>
            </select>
          </div>
        </div>

        {/* Cards Grid */}
        {filtered.length === 0 ? (
          <div className="bg-gray-800/30 border-2 border-dashed border-gray-800 rounded-3xl p-16 text-center">
            <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
              No bank statement documents found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((applicant) => {
              const viewed = applicant.bankStatementViewedByAdmin === true
              return (
                <div
                  key={applicant.id}
                  className={`bg-gray-800/40 border rounded-[2.5rem] overflow-hidden flex flex-col group hover:border-gray-600 transition-all shadow-xl ${
                    !viewed ? "border-amber-500/40 shadow-amber-900/20" : "border-gray-800"
                  }`}
                >
                  {/* Document Preview */}
                  <div
                    className="aspect-video w-full bg-gray-900 overflow-hidden cursor-pointer relative"
                    onClick={() => handleView(applicant)}
                  >
                    {isPdf(applicant.bankStatementUrl) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <div className="p-4 bg-gray-800 rounded-2xl">
                          <FileText className="w-10 h-10 text-cyan-400" />
                        </div>
                        <span className="text-xs text-gray-400 font-bold">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={applicant.bankStatementUrl}
                        alt="Bank Statement"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    )}

                    {/* Status badge */}
                    <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest backdrop-blur-md border ${
                      viewed
                        ? "bg-green-900/60 border-green-700/40 text-green-400"
                        : "bg-amber-900/70 border-amber-600/50 text-amber-300"
                    }`}>
                      {viewed
                        ? <><ShieldCheck className="w-3 h-3" /> Viewed</>
                        : <><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> New</>
                      }
                    </div>

                    {/* Option badge */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full text-[10px] font-black text-gray-300">
                      {applicant.bankStatementOption === "option1" ? "Statement" : "Payment Proof"}
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl">
                        <Eye className="w-5 h-5 text-white" />
                        <span className="text-white text-xs font-black">View Document</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Name */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-700 rounded-xl flex items-center justify-center">
                          {applicant.profileImageUrl ? (
                            <img src={applicant.profileImageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-sm text-white leading-none">
                            {applicant.firstName || "Unknown"} {applicant.lastName || ""}
                          </p>
                          <p className="text-[10px] text-gray-500 font-medium">{applicant.phoneNumber || "No phone"}</p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{formatDate(applicant.bankStatementUploadedAt)}</span>
                      </div>

                      {viewed && applicant.bankStatementViewedAt && (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-medium">Reviewed {formatDate(applicant.bankStatementViewedAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => handleView(applicant)}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        viewed
                          ? "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white"
                          : "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:from-cyan-500 hover:to-indigo-500 shadow-lg shadow-cyan-900/30"
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      {viewed ? "View Again" : "View Document"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* View Modal */}
      {showModal && selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-800">
            {/* Close */}
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setShowModal(false)}
                className="p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyan-500/10 rounded-xl">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Bank Statement Document</h3>
                  <p className="text-xs text-gray-400">
                    {selectedDoc.firstName} {selectedDoc.lastName} · {selectedDoc.bankStatementOption === "option1" ? "Standard Statement" : "Payment Proof"}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 bg-green-900/50 px-3 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Viewed</span>
                </div>
              </div>

              {/* Document Display */}
              {isPdf(selectedDoc.bankStatementUrl) ? (
                <div className="w-full h-64 bg-gray-800 rounded-3xl flex flex-col items-center justify-center gap-4 border border-gray-700">
                  <div className="p-5 bg-gray-700 rounded-2xl">
                    <FileText className="w-12 h-12 text-cyan-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-300">PDF Document</p>
                  <a
                    href={selectedDoc.bankStatementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-500 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open PDF
                  </a>
                </div>
              ) : (
                <div className="w-full bg-gray-800 rounded-3xl overflow-hidden border border-gray-700">
                  <img
                    src={selectedDoc.bankStatementUrl}
                    alt="Bank Statement"
                    className="w-full max-h-96 object-contain"
                  />
                </div>
              )}

              {/* Info Row */}
              <div className="mt-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Applicant</p>
                  <p className="text-lg font-black text-white">{selectedDoc.firstName} {selectedDoc.lastName}</p>
                  <p className="text-xs text-gray-400">{selectedDoc.phoneNumber}</p>
                  <p className="text-xs text-gray-500">Uploaded: {formatDate(selectedDoc.bankStatementUploadedAt)}</p>
                </div>
                <a
                  href={selectedDoc.bankStatementUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-cyan-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-500 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
