"use client"

import { useState, useEffect } from "react"
import { collection, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, addDoc, where, getDocs } from "firebase/firestore"
import { db, auth } from "../../config/firebase"
import {
  Search,
  Eye,
  Trash2,
  Bell,
  User,
  MapPin,
  Briefcase,
  FileText,
  Phone,
  Calendar,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Mail,
  Edit3,
} from "lucide-react"

const hardcodedCountries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium",
  "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Cambodia",
  "Canada", "Chile", "China", "Colombia", "Croatia", "Czech Republic",
  "Denmark", "Ecuador", "Egypt", "Estonia", "Finland", "France", "Georgia",
  "Germany", "Ghana", "Greece", "Hungary", "Iceland", "India", "Indonesia",
  "Iran", "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Lithuania",
  "Luxembourg", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand",
  "Nigeria", "Norway", "Pakistan", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Singapore",
  "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka",
  "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Venezuela", "Vietnam"
]

const RegisterDetail = () => {
  const [registrations, setRegistrations] = useState([])
  const [filteredRegistrations, setFilteredRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegistration, setSelectedRegistration] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [statusFilter, setStatusFilter] = useState("All")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [sortBy, setSortBy] = useState("newest")
  const [showAddToApplicantModal, setShowAddToApplicantModal] = useState(false)
  const [applicantStatus, setApplicantStatus] = useState("Pending")
  const [expectedSalary, setExpectedSalary] = useState("")
  const [addingToApplicant, setAddingToApplicant] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [applicantCountry, setApplicantCountry] = useState("")


  // Real-time data fetching
  useEffect(() => {
    // Fetch all users without orderBy to ensure we get docs even if createdAt is missing
    const q = query(collection(db, "users"))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const registrationsData = []
      const currentUserId = auth.currentUser?.uid

      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() }

        // Filter out admin users (case-insensitive) and current logged-in user
        const role = data.role ? data.role.toLowerCase() : "";
        const isAdmin = role === 'admin';
        const isCurrentUser = currentUserId && data.id === currentUserId;

        if (!isAdmin && !isCurrentUser) {
          registrationsData.push(data)
        }
      })

      // Sort client-side by createdAt descending (handling missing dates)
      registrationsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return dateB - dateA
      })

      setRegistrations(registrationsData)
      setFilteredRegistrations(registrationsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Calculate notification count: registrations that are NOT READ
  useEffect(() => {
    const count = registrations.filter((reg) => !reg.isRead).length
    setUnreadCount(count)
  }, [registrations])

  // Search functionality
  useEffect(() => {
    let filtered = registrations.filter((reg) => {
      const fullName = `${reg.firstName} ${reg.lastName}`.toLowerCase()
      const email = reg.email?.toLowerCase() || ""
      const phone = reg.phoneNumber || ""
      const applicationNumber = reg.applicationNumber?.toLowerCase() || ""

      const matchesStatus = statusFilter === "All" || reg.status?.toLowerCase() === statusFilter.toLowerCase()
      const matchesUnread = !unreadOnly || !reg.isRead

      return (
        (fullName.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase()) ||
          phone.includes(searchTerm) ||
          applicationNumber.includes(searchTerm.toLowerCase())) &&
        matchesStatus &&
        matchesUnread
      )
    })

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt)
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt)
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    setFilteredRegistrations(filtered)
  }, [searchTerm, registrations, sortBy, statusFilter, unreadOnly])

  // Mark as read when viewing
  const handleViewRegistration = async (registration) => {
    setSelectedRegistration(registration)
    setShowModal(true)

    if (!registration.isRead) {
      try {
        await updateDoc(doc(db, "users", registration.id), {
          isRead: true,
        })
      } catch (error) {
        console.error("Error marking as read:", error)
      }
    }
  }

  // Delete registration
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this registration?")) {
      try {
        await deleteDoc(doc(db, "users", id))
        alert("Registration deleted successfully!")
      } catch (error) {
        console.error("Error deleting registration:", error)
        alert("Error deleting registration. Please try again.")
      }
    }
  }

  // Update status
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "users", id), {
        status: newStatus,
      })
      alert("Status updated successfully!")
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Error updating status. Please try again.")
    }
  }

  // Update applicant in users collection
  const handleUpdateApplicant = async () => {
    if (!selectedRegistration) return

    setAddingToApplicant(true)
    setSuccessMessage("") // Clear any previous success message
    try {
      // Map registration data to updated structure - EXACT MAPPING
      const updateData = {
        country: applicantCountry || selectedRegistration.country || "", // Use edited country from modal
        expectedSalary: expectedSalary || selectedRegistration.expectedSalary || "", // Use edited salary from modal
        status: applicantStatus, // Use selected status from modal
        updatedAt: new Date(),
      }


      await updateDoc(doc(db, "users", selectedRegistration.id), updateData)

      setSuccessMessage("Updated successfully")

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setShowAddToApplicantModal(false)
        setApplicantStatus("Pending")
        setExpectedSalary("")
        setSuccessMessage("")
      }, 2000)
    } catch (error) {
      console.error("Error adding to applicants:", error)
      alert("Error adding to applicants. Please try again.")
    } finally {
      setAddingToApplicant(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "interview":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "approved":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <X className="w-4 h-4" />
      case "interview":
        return <Calendar className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registrations...</p>
        </div>
      </div>
    )
  }

  // Prioritize cards: show items not viewed first
  const prioritizedRegistrations = [...filteredRegistrations].sort((a, b) => {
    const aPriority = !a.isRead ? 1 : 0
    const bPriority = !b.isRead ? 1 : 0

    if (aPriority !== bPriority) {
      return bPriority - aPriority // higher priority first
    }

    // Fallback: newest first
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registration Management</h1>
              <p className="text-gray-600 mt-1">Total Applications: {registrations.length}</p>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">New Registrations</h3>
                    <p className="text-sm text-gray-600">
                      {unreadCount} registration
                      {unreadCount === 1 ? "" : "s"} unread
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {registrations
                      .filter((reg) => !reg.isRead)
                      .slice(0, 5)
                      .map((reg) => (
                        <div key={reg.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {reg.firstName} {reg.lastName}
                              </p>
                              <p className="text-xs text-gray-600">{reg.jobCategory}</p>
                              <p className="text-xs text-gray-500">{new Date(reg.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or application number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Interview">Interview</option>
                </select>
              </div>

              {/* Unread Toggle */}
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="checkbox"
                  id="unreadOnly"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="unreadOnly" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Unread Only
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredRegistrations.length} of {registrations.length} registrations
          </p>
        </div>

        {/* Registrations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prioritizedRegistrations.map((registration) => {
            const isUnread = !registration.isRead
            return (
              <div
                key={registration.id}
                className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${isUnread ? "border-blue-300 bg-blue-50/30" : "border-gray-200"
                  }`}
              >
                <div className="p-6">
                  {/* Header with Profile Image and Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {registration.profileImageUrl ? (
                          <img
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                            src={registration.profileImageUrl || "/placeholder.svg"}
                            alt={`${registration.firstName} ${registration.lastName}`}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-200">
                            <User className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {registration.firstName} {registration.lastName}
                          </h3>
                          {isUnread && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">{registration.applicationNumber}</p>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(registration.status)}`}
                    >
                      {getStatusIcon(registration.status)}
                      <span className="ml-1 capitalize">{registration.status || "pending"}</span>
                    </span>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 truncate">{registration.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{registration.phoneNumber}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Job Category and Location */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-semibold text-gray-900">{registration.jobCategory}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">{registration.country}</span>
                    </div>
                  </div>

                  {/* Applied Date */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Applied: {new Date(registration.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewRegistration(registration)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md ${isUnread
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-500 text-white hover:bg-gray-600"
                        }`}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View</span>
                    </button>
                    <button
                      onClick={() => handleDelete(registration.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "Try adjusting your search criteria." : "No registrations have been submitted yet."}
            </p>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {
        showModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedRegistration.firstName} {selectedRegistration.lastName}
                  </h2>
                  <p className="text-gray-600">{selectedRegistration.applicationNumber}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Status and Actions */}
                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedRegistration.status)}`}
                    >
                      {getStatusIcon(selectedRegistration.status)}
                      <span className="ml-2 capitalize">{selectedRegistration.status}</span>
                    </span>
                    <span className="text-sm text-gray-600">
                      Applied: {new Date(selectedRegistration.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedRegistration.status}
                      onChange={(e) => handleStatusUpdate(selectedRegistration.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="interview">Interview</option>
                    </select>
                    <button
                      onClick={() => {
                        setExpectedSalary(selectedRegistration.expectedSalary || "")
                        setApplicantCountry(selectedRegistration.country || "")
                        setSuccessMessage("")
                        setShowAddToApplicantModal(true)
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Update Applicant</span>
                    </button>
                  </div>
                </div>

                {/* Tabbed Content */}
                <div className="space-y-8">
                  {/* Personal Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <User className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">First Name</label>
                        <p className="text-gray-900">{selectedRegistration.firstName || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Name</label>
                        <p className="text-gray-900">{selectedRegistration.lastName || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{selectedRegistration.email || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900">{selectedRegistration.phoneNumber || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-gray-900">{selectedRegistration.dateOfBirth || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-gray-900">{selectedRegistration.gender || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Payment Code</label>
                        <p className="text-gray-900 font-mono text-xs truncate" title={selectedRegistration.paymentCode}>
                          {selectedRegistration.paymentCode || "Not set"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">User UID</label>
                        <p className="text-gray-900 font-mono text-xs truncate" title={selectedRegistration.uid}>
                          {selectedRegistration.uid || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <MapPin className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Country</label>
                        <p className="text-gray-900">{selectedRegistration.country || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">State</label>
                        <p className="text-gray-900">{selectedRegistration.state || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">City</label>
                        <p className="text-gray-900">{selectedRegistration.city || "Not set"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Briefcase className="w-5 h-5 text-purple-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Job Category</label>
                        <p className="text-gray-900">{selectedRegistration.jobCategory || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Experience</label>
                        <p className="text-gray-900">{selectedRegistration.experience || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Education</label>
                        <p className="text-gray-900">{selectedRegistration.education || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Expected Salary</label>
                        <p className="text-gray-900">{selectedRegistration.expectedSalary || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Language Proficiency</label>
                        <p className="text-gray-900">{selectedRegistration.languageProficiency || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Work Preference</label>
                        <p className="text-gray-900">{selectedRegistration.workPreference || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Willing to Relocate</label>
                        <p className="text-gray-900">{selectedRegistration.willingToRelocate || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Travel Experience</label>
                        <p className="text-gray-900">{selectedRegistration.travelExperience || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Preferred Countries</label>
                        <div className="text-gray-900 space-y-1">
                          {[selectedRegistration.preferredCountries1, selectedRegistration.preferredCountries2, selectedRegistration.preferredCountries3, selectedRegistration.preferredCountries4]
                            .filter(c => c && c.trim() !== "")
                            .map((country, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                <span>{country}</span>
                              </div>
                            ))
                          }
                          {![selectedRegistration.preferredCountries1, selectedRegistration.preferredCountries2, selectedRegistration.preferredCountries3, selectedRegistration.preferredCountries4].some(c => c && c.trim() !== "") &&
                            <span>{selectedRegistration.preferredCountries || "Not set"}</span>
                          }
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Preferred Contract Length</label>
                        <p className="text-gray-900">{selectedRegistration.preferredContractLength || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Preferred Working Shift</label>
                        <p className="text-gray-900">{selectedRegistration.preferredShift || "Not set"}</p>
                      </div>
                      <div className="md:col-span-2 lg:col-span-3 space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Skills & Qualifications</label>
                          <p className="text-gray-900">{selectedRegistration.skills || "Not set"}</p>
                        </div>
                        {[1, 2, 3].map((slot) => {
                          const certificate = selectedRegistration[`skillsCertificate${slot}`]
                          if (!certificate) return null
                          return (
                            <div key={slot} className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 max-w-fit animate-in fade-in slide-in-from-left-2 duration-300">
                              <Award className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">{certificate}</span>
                              <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Cert {slot} (Mock)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Passport & Visa Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Globe className="w-5 h-5 text-indigo-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Passport & Visa Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Passport Number</label>
                        <p className="text-gray-900">{selectedRegistration.passportNumber || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Passport Expiry</label>
                        <p className="text-gray-900">{selectedRegistration.passportExpiryDate || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Issuing Country</label>
                        <p className="text-gray-900">{selectedRegistration.passportIssuingCountry || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Visa Status</label>
                        <p className="text-gray-900">{selectedRegistration.visaStatus || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Visa Expiry</label>
                        <p className="text-gray-900">{selectedRegistration.visaExpiryDate || "Not set"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">{selectedRegistration.emergencyContactName || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900">{selectedRegistration.emergencyContactPhone || "Not set"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Relation</label>
                        <p className="text-gray-900">{selectedRegistration.emergencyContactRelation || "Not set"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <FileText className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedRegistration.profileImageUrl && (
                        <div className="text-center">
                          <label className="text-sm font-medium text-gray-600 block mb-2">Profile Image</label>
                          <img
                            src={selectedRegistration.profileImageUrl || "/placeholder.svg"}
                            alt="Profile"
                            className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-200"
                          />
                          <a
                            href={selectedRegistration.profileImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                          >
                            View Full Size
                          </a>
                        </div>
                      )}
                      {selectedRegistration.identificationCardUrl && (
                        <div className="text-center">
                          <label className="text-sm font-medium text-gray-600 block mb-2">Identification Card</label>
                          <img
                            src={selectedRegistration.identificationCardUrl || "/placeholder.svg"}
                            alt="ID Card"
                            className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-200"
                          />
                          <a
                            href={selectedRegistration.identificationCardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                          >
                            View Full Size
                          </a>
                        </div>
                      )}
                      {selectedRegistration.finalCertificateUrl && (
                        <div className="text-center">
                          <label className="text-sm font-medium text-gray-600 block mb-2">Final Certificate</label>
                          <img
                            src={selectedRegistration.finalCertificateUrl || "/placeholder.svg"}
                            alt="Certificate"
                            className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-200"
                          />
                          <a
                            href={selectedRegistration.finalCertificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                          >
                            View Full Size
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Add to Applicant Modal */}
      {
        showAddToApplicantModal && selectedRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Update Applicant Details</h2>
                  <button
                    onClick={() => {
                      setShowAddToApplicantModal(false)
                      setApplicantStatus("Pending")
                      setExpectedSalary("")
                      setDuplicateEmailError("")
                      setSuccessMessage("")
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Update <strong>{selectedRegistration.firstName} {selectedRegistration.lastName}</strong> in the users collection.
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Status *
                    </label>
                    <select
                      value={applicantStatus}
                      onChange={(e) => setApplicantStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Salary
                    </label>
                    <input
                      type="text"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      placeholder="Enter expected salary"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={applicantCountry}
                      onChange={(e) => setApplicantCountry(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Country</option>
                      {hardcodedCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This will update the registration data in the users collection with the new values.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddToApplicantModal(false)
                      setApplicantStatus("Pending")
                      setExpectedSalary("")
                      setDuplicateEmailError("")
                      setSuccessMessage("")
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={addingToApplicant}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateApplicant}
                    disabled={addingToApplicant}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {addingToApplicant ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Update Applicant</span>
                      </>
                    )}
                  </button>
                </div>

                {successMessage && (
                  <div className="mt-3 text-center">
                    <p className="text-green-600 text-sm">{successMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default RegisterDetail
