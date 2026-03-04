
"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { UserCircle } from "lucide-react"
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  limit,
  getDocs,
} from "firebase/firestore"
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { auth, db } from "../config/firebase"
import {
  Home,
  MessageSquare,
  Bell,
  Settings,
  User,
  Calendar,
  Download,
  X,
  Eye,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  Maximize2,
  Briefcase,
  MapPin,
  Fingerprint,
} from "lucide-react"

import { LogOut, Edit3, Save, EyeOff, Star, Award, Activity, TrendingUp, Mail, Phone, Shield, Ban, Copy, Check, Building2, Globe, Zap, CreditCard } from "lucide-react"
import { uploadToCloudinary, uploadDocument } from "../utils/cloudinary"

const validateFile = (file, type = "image") => {
  const maxSizes = {
    image: 1 * 1024 * 1024, // 1MB for images as requested
    document: 10 * 1024 * 1024,
  }

  const allowedTypes = {
    image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
  }

  if (file.size > maxSizes[type]) {
    throw new Error(`File size must be less than ${maxSizes[type] / (1024 * 1024)}MB`)
  }

  if (!allowedTypes[type].includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes[type].join(", ")}`)
  }

  return true
}

const Personal = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [replyingTo, setReplyingTo] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [messageFilter, setMessageFilter] = useState("all")
  const [unreadCount, setUnreadCount] = useState(0)

  const [isEditingName, setIsEditingName] = useState(false)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")

  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadReason, setUploadReason] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true)
  const [statsAnimation, setStatsAnimation] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const [currentTime, setCurrentTime] = useState(new Date())
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine)
  const [theme, setTheme] = useState("light")
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [sendingDocument, setSendingDocument] = useState(false)
  const [isUserBlocked, setIsUserBlocked] = useState(false)
  const [blockingMessage, setBlockingMessage] = useState("")
  const [copiedApplicationNo, setCopiedApplicationNo] = useState(false)

  const fileInputRef = useRef(null)
  const dragRef = useRef(null)

  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [applicationStatus, setApplicationStatus] = useState("Pending")

  const downloadImage = async (imageUrl, filename) => {
    try {
      console.log("[v0] Downloading image:", imageUrl)
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename || "notification-image.jpg"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      console.log("[v0] Image downloaded successfully")
    } catch (error) {
      console.error("[v0] Error downloading image:", error)
      alert("Failed to download image. Please check your permissions.")
    }
  }

  const viewNotificationDetails = (notification) => {
    setSelectedNotification(notification)
    setShowDetailModal(true)
    if (!notification.isRead) {
      markNotificationAsRead(notification.id)
    }
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { color: "bg-red-100 text-red-800", icon: AlertCircle, text: "High Priority" },
      medium: { color: "bg-yellow-100 text-yellow-800", icon: Clock, text: "Medium Priority" },
      low: { color: "bg-green-100 text-green-800", icon: Info, text: "Low Priority" },
      normal: { color: "bg-blue-100 text-blue-800", icon: Info, text: "Normal" },
    }

    const badge = badges[priority] || badges.normal
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    )
  }

  const markNotificationAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: new Date(),
      })
      console.log("[v0] Notification marked as read:", notificationId)
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (!user) {
        setLoading(false)
        setUserData(null)
      }
    })

    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    console.log("[v0] Auth state changed, currentUser:", currentUser?.email)

    if (!currentUser?.email) {
      console.log("[v0] No current user email, setting loading to false")
      setLoading(false)
      return
    }

    console.log("[v0] Querying users collection for UID:", currentUser.uid)
    const userDocRef = doc(db, "users", currentUser.uid)

    const unsubscribeUser = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        console.log("[v0] User doc snapshot received, exists:", docSnapshot.exists())

        if (docSnapshot.exists()) {
          const data = docSnapshot.data()
          const userData = { id: docSnapshot.id, ...data }
          console.log("[v0] User data found:", {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            status: userData.status,
          })
          setUserData(userData)
          setEditFirstName(userData.firstName || "")
          setEditLastName(userData.lastName || "")

          // Use status from document if available, otherwise default to Pending
          if (userData.status) {
            setApplicationStatus(userData.status.charAt(0).toUpperCase() + userData.status.slice(1))
          }
        } else {
          console.log("[v0] No user found in users collection for UID:", currentUser.uid)
          setUserData(null)
        }
        setLoading(false)
      },
      (error) => {
        console.error("[v0] Error fetching user data:", error)
        setLoading(false)
      },
    )

    return () => {
      unsubscribeUser()
    }
  }, [currentUser])

  useEffect(() => {
    if (!userData?.id) return

    const messagesQuery = query(
      collection(db, "messages"),
      where("userId", "==", userData.id),
      orderBy("createdAt", "desc"),
    )

    const unsubscribeMessages = onSnapshot(messagesQuery, (querySnapshot) => {
      const messagesData = []
      let unreadCounter = 0

      querySnapshot.forEach((doc) => {
        const messageData = { id: doc.id, ...doc.data() }
        messagesData.push(messageData)
        if (!messageData.read && messageData.sender === "admin") {
          unreadCounter++
        }
      })

      setMessages(messagesData)
      setUnreadCount(unreadCounter)
    })

    return () => unsubscribeMessages()
  }, [userData?.id])

  useEffect(() => {
    console.log("[v0] Enhanced notification useEffect triggered, userData:", userData)

    if (!userData) {
      console.log("[v0] No userData, clearing notifications")
      setNotifications([])
      setUnreadCount(0)
      return
    }

    let unsubscribe = () => { }

    const fetchNotifications = async () => {
      try {
        const notificationsRef = collection(db, "notifications")

        // Primary: Query by userEmail (most reliable for tracking)
        if (userData.email) {
          console.log("[v0] Fetching notifications for user email:", userData.email)

          try {
            const q = query(
              notificationsRef,
              where("userEmail", "==", userData.email),
              orderBy("createdAt", "desc"),
              limit(50)
            )

            unsubscribe = onSnapshot(
              q,
              (snapshot) => {
                const notificationList = snapshot.docs.map((doc) => {
                  const data = doc.data()
                  return {
                    id: doc.id,
                    ...data,
                    // Ensure timestamps are properly handled
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                    readAt: data.readAt?.toDate ? data.readAt.toDate() : data.readAt,
                    scheduledFor: data.scheduledFor?.toDate ? data.scheduledFor.toDate() : data.scheduledFor,
                    expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
                  }
                })

                console.log("[v0] User notifications loaded:", notificationList.length)
                console.log("[v0] Notifications data:", notificationList)

                setNotifications(notificationList)

                const unreadCount = notificationList.filter((n) => !n.isRead).length
                setUnreadCount(unreadCount)
                console.log("[v0] Unread notifications count:", unreadCount)
              },
              (error) => {
                console.error("[v0] Error in notification snapshot:", error)
                // If orderBy fails, try without it
                if (error.code === 'failed-precondition') {
                  console.log("[v0] Retrying without orderBy due to index requirement")
                  const qFallback = query(
                    notificationsRef,
                    where("userEmail", "==", userData.email),
                    limit(50)
                  )

                  unsubscribe = onSnapshot(qFallback, (snapshot) => {
                    const notificationList = snapshot.docs.map((doc) => {
                      const data = doc.data()
                      return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                        readAt: data.readAt?.toDate ? data.readAt.toDate() : data.readAt,
                        scheduledFor: data.scheduledFor?.toDate ? data.scheduledFor.toDate() : data.scheduledFor,
                        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
                      }
                    })
                    // Sort manually
                    notificationList.sort((a, b) => {
                      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
                      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
                      return bTime - aTime
                    })

                    setNotifications(notificationList)
                    const unreadCount = notificationList.filter((n) => !n.isRead).length
                    setUnreadCount(unreadCount)
                  })
                } else {
                  setNotifications([])
                  setUnreadCount(0)
                }
              }
            )
          } catch (queryError) {
            console.error("[v0] Query error:", queryError)
            // Fallback to userId if email query fails
            if (userData.id) {
              console.log("[v0] Falling back to userId query:", userData.id)
              const q = query(
                notificationsRef,
                where("userId", "==", userData.id),
                limit(50)
              )

              unsubscribe = onSnapshot(q, (snapshot) => {
                const notificationList = snapshot.docs.map((doc) => {
                  const data = doc.data()
                  return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                    readAt: data.readAt?.toDate ? data.readAt.toDate() : data.readAt,
                    scheduledFor: data.scheduledFor?.toDate ? data.scheduledFor.toDate() : data.scheduledFor,
                    expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
                  }
                })
                notificationList.sort((a, b) => {
                  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
                  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
                  return bTime - aTime
                })

                setNotifications(notificationList)
                const unreadCount = notificationList.filter((n) => !n.isRead).length
                setUnreadCount(unreadCount)
              })
            } else {
              setNotifications([])
              setUnreadCount(0)
            }
          }
        } else if (userData.id) {
          // Fallback: query by userId if email is not available
          console.log("[v0] Fetching notifications for user ID:", userData.id)
          const q = query(
            notificationsRef,
            where("userId", "==", userData.id),
            limit(50)
          )

          unsubscribe = onSnapshot(q, (snapshot) => {
            const notificationList = snapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                readAt: data.readAt?.toDate ? data.readAt.toDate() : data.readAt,
                scheduledFor: data.scheduledFor?.toDate ? data.scheduledFor.toDate() : data.scheduledFor,
                expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
              }
            })
            notificationList.sort((a, b) => {
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
              return bTime - aTime
            })

            console.log("[v0] User notifications loaded:", notificationList.length)
            setNotifications(notificationList)

            const unreadCount = notificationList.filter((n) => !n.isRead).length
            setUnreadCount(unreadCount)
            console.log("[v0] Unread notifications:", unreadCount)
          })
        } else {
          console.log("[v0] No user email or ID available")
          setNotifications([])
          setUnreadCount(0)
        }
      } catch (error) {
        console.error("[v0] Error fetching notifications:", error)
        setNotifications([])
        setUnreadCount(0)
      }
    }

    fetchNotifications()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [userData?.email, userData?.id])

  useEffect(() => {
    if (!userData?.id) return

    let unsubscribeBlocked = null
    let unsubscribeUserStatus = null

    const checkUserBlockStatus = () => {
      try {
        const userPhone = userData.phoneNumber || userData.phone

        // Check blocked-users collection by phone number
        if (userPhone) {
          const blockedUserRef = doc(db, "blocked-users", userPhone)
          unsubscribeBlocked = onSnapshot(
            blockedUserRef,
            (docSnapshot) => {
              if (docSnapshot.exists()) {
                const blockedData = docSnapshot.data()
                if (blockedData.isBlocked) {
                  setIsUserBlocked(true)
                  setBlockingMessage("Your account has been blocked by admin. You cannot upload documents at this time.")
                  return
                }
              }
              // If not blocked by phone, check users collection
              const usersQuery = query(collection(db, "users"), where("id", "==", userData.id))
              unsubscribeUserStatus = onSnapshot(
                usersQuery,
                (querySnapshot) => {
                  if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0]
                    const userStatus = userDoc.data()
                    if (userStatus.isBlocked) {
                      setIsUserBlocked(true)
                      setBlockingMessage("Your account has been blocked by admin. You cannot upload documents at this time.")
                    } else {
                      setIsUserBlocked(false)
                      setBlockingMessage("")
                    }
                  } else {
                    setIsUserBlocked(false)
                    setBlockingMessage("")
                  }
                },
                (error) => {
                  console.error("[v0] Error checking user block status:", error)
                  setIsUserBlocked(false)
                },
              )
            },
            (error) => {
              console.error("[v0] Error checking blocked-users:", error)
              // If error checking blocked-users, check users collection
              const usersQuery = query(collection(db, "users"), where("id", "==", userData.id))
              unsubscribeUserStatus = onSnapshot(
                usersQuery,
                (querySnapshot) => {
                  if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0]
                    const userStatus = userDoc.data()
                    if (userStatus.isBlocked) {
                      setIsUserBlocked(true)
                      setBlockingMessage("Your account has been blocked by admin. You cannot upload documents at this time.")
                    } else {
                      setIsUserBlocked(false)
                      setBlockingMessage("")
                    }
                  } else {
                    setIsUserBlocked(false)
                    setBlockingMessage("")
                  }
                },
                (error) => {
                  console.error("[v0] Error checking user block status:", error)
                  setIsUserBlocked(false)
                },
              )
            },
          )
        } else {
          // If no phone, only check users collection
          const usersQuery = query(collection(db, "users"), where("id", "==", userData.id))
          unsubscribeUserStatus = onSnapshot(
            usersQuery,
            (querySnapshot) => {
              if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0]
                const userStatus = userDoc.data()
                if (userStatus.isBlocked) {
                  setIsUserBlocked(true)
                  setBlockingMessage("Your account has been blocked by admin. You cannot upload documents at this time.")
                } else {
                  setIsUserBlocked(false)
                  setBlockingMessage("")
                }
              } else {
                setIsUserBlocked(false)
                setBlockingMessage("")
              }
            },
            (error) => {
              console.error("[v0] Error checking user block status:", error)
              setIsUserBlocked(false)
            },
          )
        }
      } catch (error) {
        console.error("Error setting up user block status listener:", error)
        setIsUserBlocked(false)
      }
    }

    checkUserBlockStatus()

    return () => {
      if (unsubscribeBlocked) unsubscribeBlocked()
      if (unsubscribeUserStatus) unsubscribeUserStatus()
    }
  }, [userData?.id, userData?.phoneNumber, userData?.phone])

  useEffect(() => {
    if (userData && !uploadReason) {
      // Don't auto-populate reason, let user enter it
    }
  }, [userData])

  useEffect(() => {
    if (userData && !newMessage) {
      const userInfo = `Name: ${userData.firstName || "Unknown"} ${userData.lastName || "User"}\nPhone: ${userData.phoneNumber || userData.phone || "Not provided"}\n\nMessage: `
      setNewMessage(userInfo)
    }
  }, [userData])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setTimeout(() => setStatsAnimation(true), 500)
    setTimeout(() => setShowWelcomeAnimation(false), 3000)

    return () => {
      clearInterval(timer)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (userData?.createdAt && !userData.status) {
      const registrationTime = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)
      const currentTime = new Date()
      const hoursPassed = (currentTime - registrationTime) / (1000 * 60 * 60)

      if (hoursPassed >= 24) {
        setApplicationStatus("Approved")
      } else {
        setApplicationStatus("Pending")
      }
    }
  }, [userData?.createdAt])

  const handleFileSelect = (files) => {
    const file = files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setUpdateMessage("Please select an image file only.");
      setTimeout(() => setUpdateMessage(""), 3000)
      return
    }

    if (file.size > 1024 * 1024) {
      setUpdateMessage("File size must be less than 1MB.")
      setTimeout(() => setUpdateMessage(""), 3000)
      return
    }

    setSelectedFile(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  const uploadFile = async () => {
    if (!selectedFile) return null

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Use specialized utility based on file type
      const isImage = selectedFile.type.startsWith("image/")
      validateFile(selectedFile, isImage ? "image" : "document")

      const uploadResult = isImage
        ? await uploadToCloudinary(selectedFile)
        : await uploadDocument(selectedFile)

      const uploadedDocument = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        format: uploadResult.format,
        uploadedAt: new Date().toISOString(),
      }

      setUploadProgress(100)
      setIsUploading(false)
      setSelectedFile(null)
      return uploadedDocument
    } catch (error) {
      console.error("Error uploading verified document to Cloudinary:", error)
      setIsUploading(false)
      setUploadProgress(0)
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      await auth.signOut()
      console.log("Logged out successfully")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleUploadDocument = async () => {
    if (isUserBlocked) {
      setUpdateMessage("Your account is blocked. You cannot upload documents.")
      setTimeout(() => setUpdateMessage(""), 5000)
      return
    }

    if (!selectedFile) {
      setUpdateMessage("Please select a document to upload.")
      setTimeout(() => setUpdateMessage(""), 3000)
      return
    }

    if (!uploadReason.trim()) {
      setUpdateMessage("Please provide a reason for uploading this document.")
      setTimeout(() => setUpdateMessage(""), 3000)
      return
    }

    try {
      setSendingDocument(true)
      const uploadedDocument = await uploadFile()

      if (!uploadedDocument) {
        throw new Error("Failed to upload document")
      }

      const documentData = {
        userId: userData.id || currentUser?.uid,
        name: `${userData.firstName || "Unknown"} ${userData.lastName || "User"}`,
        phone: userData.phoneNumber || userData.phone || "No phone",
        reason: uploadReason.trim() || "Verification Document",
        status: "pending",
        document: uploadedDocument,
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, "verified-documents"), documentData)

      setUpdateMessage("Document uploaded successfully!")
      setUploadReason("")
      setTimeout(() => setUpdateMessage(""), 3000)
    } catch (error) {
      console.error("Error uploading document:", error)
      setUpdateMessage(`Failed to upload document: ${error.message}`)
      setTimeout(() => setUpdateMessage(""), 5000)
    } finally {
      setSendingDocument(false)
    }
  }

  const handleEditName = () => {
    setIsEditingName(true)
    setEditFirstName(userData.firstName || "")
    setEditLastName(userData.lastName || "")
  }

  const handleSaveName = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      setUpdateMessage("Please enter both first and last name")
      setTimeout(() => setUpdateMessage(""), 3000)
      return
    }

    setUpdateLoading(true)
    try {
      const userDocRef = doc(db, "registrations", userData.id)
      await updateDoc(userDocRef, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        updatedAt: serverTimestamp(),
      })

      setIsEditingName(false)
      setUpdateMessage("Name updated successfully!")
      setTimeout(() => setUpdateMessage(""), 3000)
    } catch (error) {
      console.error("Error updating name:", error)
      setUpdateMessage("Error updating name. Please try again.")
      setTimeout(() => setUpdateMessage(""), 3000)
    }
    setUpdateLoading(false)
  }

  const handleCancelEditName = () => {
    setIsEditingName(false)
    setEditFirstName(userData.firstName || "")
    setEditLastName(userData.lastName || "")
  }

  const copyApplicationNumber = async () => {
    const applicationNumber = userData.applicationNumber || "Not available"
    if (applicationNumber === "Not available") return

    try {
      await navigator.clipboard.writeText(applicationNumber)
      setCopiedApplicationNo(true)
      setTimeout(() => setCopiedApplicationNo(false), 2000)
    } catch (error) {
      console.error("Failed to copy application number:", error)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = applicationNumber
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopiedApplicationNo(true)
        setTimeout(() => setCopiedApplicationNo(false), 2000)
      } catch (err) {
        console.error("Fallback copy failed:", err)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setUpdateMessage("Please fill in all password fields")
      setTimeout(() => setUpdateMessage(""), 3000)
      return
    }

    if (newPassword.length < 6) {
      setUpdateMessage("New password must be at least 6 characters long")
      setTimeout(() => setUpdateMessage(""), 3000)
      return
    }

    if (newPassword !== confirmPassword) {
      setUpdateMessage("New passwords don't match")
      setTimeout(() => setUpdateMessage(""), 3000)
      return
    }

    setUpdateLoading(true)
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, newPassword)

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsChangingPassword(false)
      setUpdateMessage("Password changed successfully!")
      setTimeout(() => setUpdateMessage(""), 3000)
    } catch (error) {
      console.error("Error changing password:", error)
      if (error.code === "auth/wrong-password") {
        setUpdateMessage("Current password is incorrect")
      } else {
        setUpdateMessage("Error changing password. Please try again.")
      }
    }
    setUpdateLoading(false)
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      messageFilter === "all" ||
      (messageFilter === "unread" && !message.read) ||
      (messageFilter === "admin" && message.sender === "admin") ||
      (messageFilter === "user" && message.sender === "user")

    return matchesSearch && matchesFilter
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
            <div className="animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 rounded-full h-16 w-16 border-4 border-white opacity-20"></div>
          </div>
          <p className="text-white text-lg font-medium animate-pulse">Loading your personalized dashboard...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping opacity-75 shadow-lg shadow-purple-500/50"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-pulse opacity-60 shadow-lg shadow-pink-500/50"></div>
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce opacity-50 shadow-lg shadow-blue-500/50"></div>
          <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full animate-ping opacity-70 shadow-lg shadow-cyan-500/50"></div>
          <div className="absolute bottom-1/3 right-1/2 w-3.5 h-3.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-pulse opacity-65 shadow-lg shadow-indigo-500/50"></div>
          <div className="absolute top-1/6 right-1/6 w-1.5 h-1.5 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-bounce opacity-80 shadow-lg shadow-emerald-500/50"></div>
          <div className="absolute bottom-1/6 left-1/6 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping opacity-60 shadow-lg shadow-yellow-500/50"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-28 w-28 border-4 border-purple-200/20 border-t-purple-500 mx-auto shadow-2xl shadow-purple-500/60 glow-purple"></div>
            <div
              className="absolute inset-0 rounded-full h-28 w-28 border-4 border-transparent border-r-pink-500 animate-spin mx-auto shadow-2xl shadow-pink-500/60 glow-pink"
              style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
            ></div>
            <div className="absolute inset-2 rounded-full h-24 w-24 border-3 border-cyan-400/30 border-b-cyan-500 animate-spin mx-auto shadow-xl shadow-cyan-500/50 glow-cyan"></div>
            <div
              className="absolute inset-4 rounded-full h-20 w-20 border-2 border-transparent border-l-indigo-500 animate-spin mx-auto shadow-lg shadow-indigo-500/40"
              style={{ animationDirection: "reverse", animationDuration: "2s" }}
            ></div>
            <div className="absolute inset-6 rounded-full h-16 w-16 border-2 border-emerald-400/40 border-t-emerald-500 animate-spin mx-auto shadow-lg shadow-emerald-500/40"></div>
          </div>
          <div className="space-y-4">
            <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text animate-pulse bg-size-200 animate-gradient-x">
              WelCome!
            </p>
            <p className="text-purple-300 animate-pulse text-xl font-medium">Fetching real-time data...</p>
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce shadow-lg shadow-purple-500/50"></div>
              <div
                className="w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-bounce shadow-lg shadow-pink-500/50"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-bounce shadow-lg shadow-cyan-500/50"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce shadow-lg shadow-indigo-500/50"
                style={{ animationDelay: "0.3s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length

  const handleViewDetails = async (notification) => {
    setSelectedNotification(notification)
    setShowDetailModal(true)

    // Automatically mark as read when viewing details
    if (!notification.isRead) {
      try {
        await updateDoc(doc(db, "notifications", notification.id), {
          isRead: true,
          readAt: new Date(),
        })

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true, readAt: new Date() } : n)),
        )
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white shadow-xl border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-shrink-0">
                {userData.profileImageUrl ? (
                  <img
                    className="h-14 w-14 rounded-full object-cover border-3 border-gradient-to-r from-blue-400 to-purple-500 shadow-lg hover:scale-105 transition-transform duration-300"
                    src={userData.profileImageUrl || "/placeholder.svg"}
                    alt="Profile"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
                    <User className="w-7 h-7 text-white" />
                  </div>
                )}
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${onlineStatus ? "bg-green-500" : "bg-gray-400"} animate-pulse`}
                ></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="text-sm text-gray-600 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {userData.email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4">
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setActiveTab("notifications")}
                  className="relative p-3 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300 transform hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center animate-bounce">
                      {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => navigate("/payment-method")}
                  className="relative p-3 sm:p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-all duration-300 transform hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Payment Methods"
                >
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <button
                onClick={() => (window.location.href = "/")}
                className="flex items-center justify-center space-x-1 sm:space-x-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 sm:px-4 py-3 rounded-full transition-all duration-300 min-w-[44px] min-h-[44px]"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto">
              {[
                { id: "dashboard", label: "Dashboard", icon: Home },
                { id: "messages", label: "Documents", icon: MessageSquare },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "biometric", label: "Biometric", icon: Fingerprint, path: "/biometric" },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.path) {
                        navigate(tab.path)
                      } else {
                        setActiveTab(tab.id)
                      }
                    }}
                    className={`${activeTab === tab.id
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-all duration-300 rounded-t-lg relative`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{tab.label}</span>
                    {tab.id === "notifications" && unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div
              className={`${applicationStatus === "Approved"
                ? "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600"
                : "bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600"
                } rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden transform transition-all duration-1000 ${showWelcomeAnimation ? "scale-105 rotate-1" : "scale-100 rotate-0"}`}
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="p-4 bg-white/20 rounded-full animate-bounce">
                    {applicationStatus === "Approved" ? (
                      <CheckCircle className="w-12 h-12" />
                    ) : (
                      <Clock className="w-12 h-12" />
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl font-bold mb-2">
                      Hi, {userData.firstName} {userData.lastName}!
                    </h1>
                    <p className="text-xl text-white/90 mb-4">
                      {applicationStatus === "Approved"
                        ? "Congratulations! Your application has been approved."
                        : "Your application is currently being processed."}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {userData.applicationNumber && (
                        <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/30">
                          <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Application Number</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-white tracking-widest leading-none">
                              {userData.applicationNumber}
                            </span>
                            <button
                              onClick={copyApplicationNumber}
                              className="flex items-center space-x-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors group"
                            >
                              {copiedApplicationNo ? (
                                <CheckCircle className="w-4 h-4 text-green-300" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                {copiedApplicationNo ? "Copied!" : "Copy"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12 animate-pulse delay-1000"></div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-500">
              <div className="text-center">
                <div className="relative inline-block">
                  {userData.profileImageUrl ? (
                    <img
                      className="h-40 w-40 rounded-full object-cover mx-auto border-4 border-gradient-to-r from-blue-400 to-purple-500 shadow-2xl hover:scale-110 transition-transform duration-500"
                      src={userData.profileImageUrl || "/placeholder.svg"}
                      alt="Profile"
                    />
                  ) : (
                    <div className="h-40 w-40 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mx-auto shadow-2xl hover:scale-110 transition-transform duration-500">
                      <User className="w-20 h-20 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white animate-pulse"></div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mt-6 hover:text-blue-600 transition-colors">
                  {userData.firstName} {userData.lastName}
                </h2>

                <div className="flex items-center justify-center mt-3 space-x-2">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <p className="text-gray-600 text-lg">{userData.email}</p>
                </div>

                {userData.phoneNumber && (
                  <div className="flex items-center justify-center mt-2 space-x-2">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <p className="text-gray-600">{userData.phoneNumber}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Account Active
                  </span>
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors">
                    <Shield className="w-4 h-4 mr-2" />
                    Verified User
                  </span>
                </div>




              </div>
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1"></div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-green-600" />
                  Upload Verified Document
                </h3>

                {isUserBlocked && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Account Blocked</p>
                        <p className="text-sm text-red-700 mt-1">{blockingMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Your Information (Auto-included)</p>
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Name:</strong> {userData?.firstName} {userData?.lastName}
                        <br />
                        <strong>Phone:</strong> {userData?.phoneNumber || userData?.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Document Upload <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={uploadReason}
                      onChange={(e) => setUploadReason(e.target.value)}
                      placeholder="Please explain why you are uploading this document (e.g., Identity verification, Address proof, Payment confirmation, etc.)"
                      rows={3}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300"
                      disabled={isUserBlocked}
                    />
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isUserBlocked
                      ? "border-red-300 bg-red-50 cursor-not-allowed opacity-50"
                      : dragActive
                        ? "border-green-500 bg-green-50"
                        : selectedFile
                          ? "border-green-300 bg-green-50"
                          : "border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100"
                      } ${!isUserBlocked ? "cursor-pointer" : ""}`}
                    onDragEnter={!isUserBlocked ? handleDrag : undefined}
                    onDragLeave={!isUserBlocked ? handleDrag : undefined}
                    onDragOver={!isUserBlocked ? handleDrag : undefined}
                    onDrop={!isUserBlocked ? handleDrop : undefined}
                    onClick={!isUserBlocked ? () => fileInputRef.current?.click() : undefined}
                  >
                    <div className="space-y-4">
                      <div
                        className={`mx-auto w-16 h-16 ${isUserBlocked ? "bg-red-400" : "bg-gradient-to-br from-green-500 to-blue-600"} rounded-full flex items-center justify-center`}
                      >
                        {isUserBlocked ? (
                          <Ban className="w-8 h-8 text-white" />
                        ) : (
                          <Shield className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          {isUserBlocked
                            ? "Upload Blocked"
                            : selectedFile
                              ? "Document Selected"
                              : "Upload Verified Document"}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          {isUserBlocked
                            ? "Your account is blocked. Contact admin for assistance."
                            : selectedFile
                              ? `Selected: ${selectedFile.name}`
                              : "Drag and drop an image here or click to browse (Max 1MB)"}
                        </p>
                        {!selectedFile && !isUserBlocked && (
                          <button
                            type="button"
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Choose Image Document
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e.target.files)}
                          className="hidden"
                          disabled={isUserBlocked}
                        />
                      </div>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-700 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        Document Ready for Upload:
                      </h4>
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-800">{selectedFile.name}</span>
                              <div className="text-xs text-gray-500 flex items-center space-x-2">
                                <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                                <span>•</span>
                                <span className="text-green-600 font-medium">Image Document</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={removeFile}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="mt-6">
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                          <span className="text-green-700 font-medium">Uploading verified document...</span>
                        </div>
                        <div className="bg-green-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-600 to-blue-600 h-3 rounded-full transition-all duration-300 shadow-sm"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          {Math.round(uploadProgress)}% Complete
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleUploadDocument}
                      disabled={!selectedFile || sendingDocument || isUserBlocked}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      {sendingDocument ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Uploading...</span>
                        </>
                      ) : isUserBlocked ? (
                        <>
                          <Ban className="w-5 h-5" />
                          <span>Upload Blocked</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          <span>Upload Document</span>
                        </>
                      )}
                    </button>
                  </div>

                  {updateMessage && updateMessage.includes("successfully") && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-green-800">{updateMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center mb-2 sm:mb-0">
                  <Bell className="w-6 h-6 sm:w-7 sm:h-7 mr-2 sm:mr-3 text-blue-600" />
                  LMIS Notifications
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="bg-gray-100 px-3 py-1 rounded-full">{notifications.length} total</span>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No notifications yet</h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    You'll see important updates and messages from LMIS here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`${notification.isRead
                        ? "bg-gray-50 border-gray-200"
                        : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md"
                        } rounded-lg sm:rounded-xl p-4 sm:p-6 border transition-all duration-300 hover:shadow-lg`}
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div
                          className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${notification.isRead ? "bg-gray-100" : "bg-blue-100"}`}
                        >
                          <Bell
                            className={`w-4 h-4 sm:w-6 sm:h-6 ${notification.isRead ? "text-gray-500" : "text-blue-600"}`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4
                              className={`font-semibold text-sm sm:text-lg ${notification.isRead ? "text-gray-700" : "text-gray-900"} pr-2`}
                            >
                              {notification.title || "Admin Notification"}
                              {!notification.isRead && (
                                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                              )}
                            </h4>
                          </div>

                          <p
                            className={`text-sm sm:text-base leading-relaxed mb-3 ${notification.isRead ? "text-gray-600" : "text-gray-700"}`}
                          >
                            {notification.message?.length > 100
                              ? `${notification.message.substring(0, 100)}...`
                              : notification.message}
                          </p>

                          {notification.imageUrl && (
                            <div className="mt-3 mb-3">
                              <div className="relative inline-block">
                                <img
                                  src={notification.imageUrl || "/placeholder.svg"}
                                  alt="Notification attachment"
                                  className="w-full sm:w-48 h-32 sm:h-36 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                  onError={(e) => {
                                    console.log("[v0] Image failed to load:", notification.imageUrl)
                                    e.target.src = "/generic-notification-icon.png"
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPreviewImage(notification.imageUrl)
                                    setShowPhotoPreview(true)
                                  }}
                                />
                                {notification.allowDownload && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      downloadImage(notification.imageUrl, `notification-${notification.id}.jpg`)
                                    }}
                                    className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all duration-200"
                                    title="Download image"
                                  >
                                    <Download className="w-4 h-4 text-gray-700" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-3 border-t border-gray-200 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>From LMIS Panel</span>
                              {notification.priority && getPriorityBadge(notification.priority)}
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewDetails(notification)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${notification.isRead
                                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  : "bg-blue-500 text-white hover:bg-blue-600"
                                  }`}
                              >
                                {notification.isRead ? "View Again" : "View Details"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Settings className="w-7 h-7 mr-3 text-blue-600" />
                Account Settings
              </h2>

              {updateMessage && (
                <div
                  className={`mb-6 p-4 rounded-xl ${updateMessage.includes("Error") || updateMessage.includes("incorrect") || updateMessage.includes("don't match") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
                >
                  <div className="flex items-center">
                    {updateMessage.includes("Error") ? (
                      <AlertCircle className="w-5 h-5 mr-2" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    {updateMessage}
                  </div>
                </div>
              )}

              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-gray-900 flex items-center">
                      <User className="w-6 h-6 mr-2 text-blue-600" />
                      Profile Information
                    </h3>
                    {!isEditingName && (
                      <button
                        onClick={handleEditName}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Name
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      {isEditingName ? (
                        <input
                          type="text"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          placeholder="Enter first name"
                        />
                      ) : (
                        <input
                          type="text"
                          value={userData.firstName || ""}
                          readOnly
                          className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      {isEditingName ? (
                        <input
                          type="text"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          placeholder="Enter last name"
                        />
                      ) : (
                        <input
                          type="text"
                          value={userData.lastName || ""}
                          readOnly
                          className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50"
                        />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={userData.email || ""}
                        readOnly
                        className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50"
                      />
                    </div>
                  </div>

                  {isEditingName && (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleSaveName}
                        disabled={updateLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        <Save className="w-4 h-4" />
                        {updateLoading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={updateLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-gray-900 flex items-center">
                      <Shield className="w-6 h-6 mr-2 text-blue-600" />
                      Security Settings
                    </h3>
                    {!isChangingPassword && (
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300"
                      >
                        <Settings className="w-4 h-4" />
                        Change Password
                      </button>
                    )}
                  </div>

                  {isChangingPassword && (
                    <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-300"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-300"
                            placeholder="Enter new password (min 6 characters)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-300"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleChangePassword}
                          disabled={updateLoading}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          <Save className="w-4 h-4" />
                          {updateLoading ? "Changing..." : "Change Password"}
                        </button>
                        <button
                          onClick={() => {
                            setIsChangingPassword(false)
                            setCurrentPassword("")
                            setNewPassword("")
                            setConfirmPassword("")
                          }}
                          disabled={updateLoading}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-all duration-300"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg sm:rounded-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-6 flex items-center justify-between">
              <h3 className="text-base sm:text-xl font-bold text-gray-900">Notification Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">
                    {selectedNotification.title || "Admin Notification"}
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
                    {selectedNotification.priority && getPriorityBadge(selectedNotification.priority)}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Full Message</h5>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                      {selectedNotification.message || "No message content available."}
                    </p>
                  </div>
                </div>

                {selectedNotification.imageUrl && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Attached Image</h5>
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={selectedNotification.imageUrl || "/placeholder.svg"}
                          alt="Notification attachment"
                          className="w-full max-w-full sm:max-w-md h-48 sm:h-64 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            console.log("[v0] Detail modal image failed to load:", selectedNotification.imageUrl)
                            e.target.src = "/notification-detail-view.png"
                          }}
                          onClick={() => {
                            setPreviewImage(selectedNotification.imageUrl)
                            setShowPhotoPreview(true)
                          }}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {selectedNotification.allowDownload && (
                          <button
                            onClick={() => {
                              downloadImage(
                                selectedNotification.imageUrl,
                                `notification-${selectedNotification.id}.jpg`,
                              )
                            }}
                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Image</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPreviewImage(selectedNotification.imageUrl)
                            setShowPhotoPreview(true)
                          }}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                        >
                          <Maximize2 className="w-4 h-4" />
                          <span>View Full Size</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {showPhotoPreview && previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowPhotoPreview(false)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200 z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => {
                const hasDownloadPrivilege = true // Set this based on your user permissions
                if (hasDownloadPrivilege) {
                  downloadImage(previewImage, "notification-image.jpg")
                } else {
                  alert("You don't have permission to download this image.")
                }
              }}
              className="absolute top-4 left-4 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200 z-10"
              title="Download image"
            >
              <Download className="w-6 h-6 text-white" />
            </button>
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                console.log("[v0] Preview image failed to load:", previewImage)
                e.target.src = "/notification-preview-error.png"
              }}
              onClick={() => setShowPhotoPreview(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Personal
