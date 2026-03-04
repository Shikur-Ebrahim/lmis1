"use client"

import { useState } from "react"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Upload,
  Camera,
  CreditCard,
  Award,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Zap,
  UserCheck,
  Users,
  Loader2,
  ArrowRight,
  X,
  FileText,
} from "lucide-react"
import { useEffect } from "react"
import { collection, addDoc, setDoc, doc, query, where, getDocs, Timestamp } from "firebase/firestore"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth"
import { auth, db } from "../config/firebase"
import { uploadToCloudinary, uploadDocument, validateFile } from "../utils/cloudinary"

const hardcodedCountries = [
  "Saudi Arabia",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Jordan",
  "Lebanon",
  "Turkey",
  "Other"
]

const visaStatusOptions = [
  "No Visa Required",
  "Valid Work Visa",
  "Valid Tourist Visa",
  "Expired Visa",
  "Other"
]

const workPreferenceOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary"
]

export default function Register() {
  const [currentStep, setCurrentStep] = useState(0) // 0-7 for 8 steps
  const [validatedUser, setValidatedUser] = useState(null) // Store authenticated user from step 0
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitMessage, setSubmitMessage] = useState({ type: "", message: "", applicationNumber: "" })
  const [copiedRegNo, setCopiedRegNo] = useState(false)
  const [showPaymentCode, setShowPaymentCode] = useState(false)

  const [formData, setFormData] = useState({
    // Personal Information
    paymentCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",

    // Location Information
    country: "",
    state: "",
    city: "",

    // Professional Information
    jobCategory: "",
    experience: "",
    education: "",
    skills: "",
    expectedSalary: "",
    languageProficiency: "",
    workPreference: "",
    travelExperience: "",
    willingToRelocate: "",

    // International Job Preferences
    preferredCountries: "",
    preferredCountries1: "",
    preferredCountries2: "",
    preferredCountries3: "",
    preferredCountries4: "",
    preferredContractLength: "",
    preferredShift: "",

    // Passport & Visa Information
    passportNumber: "",
    passportExpiryDate: "",
    passportIssuingCountry: "",
    visaStatus: "",
    visaExpiryDate: "",

    // Emergency Contact
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",

    // Documents
    profileImage: null,
    identificationCard: null,
    finalCertificate: null,
    educationFinalPaper: null,
    skillsCertificate1: null,
    skillsCertificate2: null,
    skillsCertificate3: null,

    // Account Security
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [countriesData, setCountries] = useState([])
  const [jobCategoriesData, setJobCategories] = useState([])
  const [isUploadingSkills, setIsUploadingSkills] = useState({ 1: false, 2: false, 3: false })
  const [skillsPreviews, setSkillsPreviews] = useState({ 1: null, 2: null, 3: null })
  const [docPreviews, setDocPreviews] = useState({ profileImage: null, identificationCard: null, finalCertificate: null, educationFinalPaper: null })

  // Predefined options
  const educationLevels = [
    "High School",
    "Associate Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD/Doctorate",
    "Professional Certificate",
    "Vocational Training",
    "Other",
  ]

  const experienceLevels = [
    "Entry Level (0-1 years)",
    "Junior (1-3 years)",
    "Mid-Level (3-5 years)",
    "Senior (5-8 years)",
    "Expert (8+ years)",
    "Executive/Management",
  ]

  const languageProficiencyLevels = [
    "Beginner",
    "Elementary",
    "Intermediate",
    "Upper Intermediate",
    "Advanced",
    "Native/Fluent",
  ]



  const genderOptions = ["Male", "Female"]

  const hardcodedCountries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahrain",
    "Bangladesh",
    "Belarus",
    "Belgium",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Brazil",
    "Bulgaria",
    "Cambodia",
    "Canada",
    "Chile",
    "China",
    "Colombia",
    "Croatia",
    "Czech Republic",
    "Denmark",
    "Ecuador",
    "Egypt",
    "Estonia",

    "Finland",
    "France",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kuwait",
    "Latvia",
    "Lebanon",
    "Lithuania",
    "Luxembourg",
    "Malaysia",
    "Mexico",
    "Morocco",
    "Netherlands",
    "New Zealand",
    "Nigeria",
    "Norway",
    "Pakistan",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Saudi Arabia",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "South Africa",
    "South Korea",
    "Spain",
    "Sri Lanka",
    "Sweden",
    "Switzerland",
    "Thailand",
    "Turkey",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Venezuela",
    "Vietnam",
  ]

  const hardcodedJobCategories = [
    // Driving & Transportation
    "Light Vehicle Driver",
    "Heavy Vehicle Driver",
    "House Driver",
    "Trolley Operator",

    // Security & Safety
    "Security Guard",
    "CCTV Surveillance Operator",
    "Office Security Personnel",
    "Plumber",
    "Electrician",
    "HVAC Technician",
    "AC Technician",
    "Pumper",

    // Domestic & Facility Services
    "Housekeeper",
    "House Maid",
    "House Cleaner",
    "Housekeeping Supervisor",
    "Houseman",
    "Caretaker",
    "Steward",
    "Laundry Attendant",
    "Bellman",

    // Hospitality & Food Services
    "Receptionist",
    "Waiter/Waitress",
    "Barista",
    "Sous Chef",
    "Pastry Chef",
    "Garde Manger Chef",
    "Arabica Cuisine Chef",
    "Kitchen Assistant",
    "Private Cook",
    "Room Attendant",
    "Hotel Assistant Manager",

    // Healthcare & Caregiving
    "Nurse",
    "Junior Nurse",
    "Home Care Nurse",
    "Private Nurse",
    "Junior Midwife",
    "Clinical Nurse",
    "Elderly Care Assistant",
    "Live-in Support Assistant",
    "NICU Nurse",
    "Junior Physiotherapist",

    // Childcare Services
    "Babysitter",
    "Childcare Worker",

    // Beauty & Salon Services
    "Hairdresser",
    "Hairstylist",
    "Beauty Therapist",
    "Salon Manager",
    "Nail Technician",
    "Nail Art Instructor",
    "Massage Therapist",
    "Makeup Artist",

    // Agriculture & Farming
    "Indoor Farmer",
    "General Farm Worker",

    // Administrative & Marketing
    "Junior Administrative Assistant",
    "Junior Marketing Assistant",
    "Junior Account Manager",
    "Sales Representative",
    "Purchaser",

    // Skilled Labor
    "Construction Worker",
    "Laborer",
    "Tailor",
    "Storekeeper",
    "Supervisor",

    // Retail & Customer Services
    "Cashier",
    "Promoter"
  ]


  // Load countries and job categories from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load countries
        const countriesSnapshot = await getDocs(collection(db, "countries"))
        const countriesData = countriesSnapshot.docs.map((doc) => doc.data().name)
        setCountries(countriesData.sort())

        // Load job categories
        const jobCategoriesSnapshot = await getDocs(collection(db, "jobCategories"))
        const jobCategoriesData = jobCategoriesSnapshot.docs.map((doc) => doc.data().name)
        setJobCategories(jobCategoriesData.sort())
      } catch (error) {
        console.error("Error loading data:", error)
        // Fallback data if Firebase fails
        setCountries(hardcodedCountries)

        setJobCategories(hardcodedJobCategories)
      }
    }

    loadData()
  }, [])

  const handleSkillsCertificateUpload = (e, slot) => {
    e.preventDefault()
    const file = e.target.files[0]
    if (!file) return

    const fieldName = `skillsCertificate${slot}`

    // Generate preview URL
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSkillsPreviews(prev => ({ ...prev, [slot]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setSkillsPreviews(prev => ({ ...prev, [slot]: 'document' }));
    }

    setFormData(prev => ({ ...prev, [fieldName]: file.name }))
    setIsUploadingSkills(prev => ({ ...prev, [slot]: true }))
    setUploadProgress(prev => ({ ...prev, [fieldName]: 0 }))

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const currentProgress = prev[fieldName] || 0
        if (currentProgress >= 100) {
          clearInterval(interval)
          setIsUploadingSkills(prevUpload => ({ ...prevUpload, [slot]: false }))
          return { ...prev, [fieldName]: 100 }
        }
        return { ...prev, [fieldName]: currentProgress + 10 }
      })
    }, 200)
  }

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target

    if (type === "file") {
      const file = files[0]
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }))

      // Handle Preview Generation
      if (file && (name === "profileImage" || name === "identificationCard" || name === "finalCertificate" || name === "educationFinalPaper")) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setDocPreviews(prev => ({ ...prev, [name]: reader.result }));
          };
          reader.readAsDataURL(file);
        } else {
          setDocPreviews(prev => ({ ...prev, [name]: 'document' }));
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }

    if (submitMessage.message) {
      setSubmitMessage({ type: "", message: "" })
    }
  }

  const handleFileUpload = async (file, fieldName) => {
    if (!file) return null

    try {
      const maxSize = 1 * 1024 * 1024 // 1MB
      if (file.size > maxSize) {
        throw new Error(`File size must be less than 1MB`)
      }

      const fileType = fieldName === "profileImage" || fieldName === "identificationCard" ? "image" : "document"
      validateFile(file, fileType)

      setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }))

      let uploadResult
      if (fieldName === "profileImage" || fieldName === "identificationCard") {
        uploadResult = await uploadToCloudinary(file)
      } else {
        uploadResult = await uploadDocument(file)
      }

      setUploadProgress((prev) => ({ ...prev, [fieldName]: 100 }))
      return uploadResult.url
    } catch (error) {
      console.error(`Upload error for ${fieldName}:`, error)
      setErrors((prev) => ({ ...prev, [fieldName]: error.message }))
      setUploadProgress((prev) => ({ ...prev, [fieldName]: 0 }))
      return null
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields validation
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "dateOfBirth",
      "gender",
      "country",
      "state",
      "city",

      "jobCategory",
      "experience",
      "education",
      "expectedSalary",

      "languageProficiency",

      "emergencyContactName",
      "emergencyContactPhone",
      "emergencyContactRelation",

      "password",
      "confirmPassword",
      "profileImage",
      "identificationCard",
    ]

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = `${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} is required`
      }
    })

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Phone validation
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number"
    }

    // Age validation (must be 18+)
    if (formData.dateOfBirth) {
      const today = new Date()
      const birthDate = new Date(formData.dateOfBirth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old to register"
      }
    }

    // Passport expiry validation
    if (formData.passportExpiryDate) {
      const today = new Date()
      const expiryDate = new Date(formData.passportExpiryDate)
      const sixMonthsFromNow = new Date()
      sixMonthsFromNow.setMonth(today.getMonth() + 6)

      if (expiryDate <= sixMonthsFromNow) {
        newErrors.passportExpiryDate = "Passport must be valid for at least 6 months"
      }
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long"
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Reference email validation
    if (formData.reference1Email && !emailRegex.test(formData.reference1Email)) {
      newErrors.reference1Email = "Please enter a valid email address"
    }

    if (formData.reference2Email && formData.reference2Email && !emailRegex.test(formData.reference2Email)) {
      newErrors.reference2Email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkDuplicates = async () => {
    try {
      // Check for duplicate email
      const emailQuery = query(collection(db, "registrations"), where("email", "==", formData.email))
      const emailSnapshot = await getDocs(emailQuery)

      if (!emailSnapshot.empty) {
        setErrors((prev) => ({
          ...prev,
          email: "This email already has an account. Please use a different email.",
        }))
        return false
      }

      // Check for duplicate phone number
      const phoneQuery = query(collection(db, "registrations"), where("phoneNumber", "==", formData.phoneNumber))
      const phoneSnapshot = await getDocs(phoneQuery)

      if (!phoneSnapshot.empty) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: "This phone number already has an account. Please use a different phone number.",
        }))
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking duplicates:", error)
      // Don't wrongly block the user if we fail to read (e.g. strict Firestore rules).
      // Allow registration to continue; real duplicates will still be prevented by Firebase Auth on email.
      return true
    }
  }

  // Step validation for multi-step form
  const validateStep = async (step) => {
    const newErrors = {}

    if (step === 0) {
      // Payment Code & Phone Number validation
      if (!formData.paymentCode) newErrors.paymentCode = "Payment Code is required"
      if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required"

      setErrors(newErrors)
      if (Object.keys(newErrors).length > 0) return false

      // Authenticate and verify Payment Code
      try {
        setLoading(true)

        // Check if phone number already exists in 'users' or 'registrations' collection
        const userQuery = query(collection(db, "users"), where("phoneNumber", "==", formData.phoneNumber))
        const userSnapshot = await getDocs(userQuery)

        if (!userSnapshot.empty) {
          setSubmitMessage({
            type: "success",
            message: `This phone number ${formData.phoneNumber} registered before`,
          })
          setLoading(false)
          return false // Stop here to show the message
        }

        const emailPrefix = formData.phoneNumber.replace('+', '')
        const authEmail = `${emailPrefix}@lmis.gov.et`
        const authPassword = formData.phoneNumber

        const userCredential = await signInWithEmailAndPassword(auth, authEmail, authPassword)
        const user = userCredential.user

        if (user.uid !== formData.paymentCode.trim()) {
          setErrors({ paymentCode: "Invalid Payment Code for this phone number" })
          setLoading(false)
          return false
        }

        setValidatedUser(user)
        setLoading(false)
        return true
      } catch (error) {
        console.error("Auth Error:", error)
        setErrors({ paymentCode: "Authentication failed. Please check your credentials." })
        setLoading(false)
        return false
      }
    }

    if (step === 1) {
      // Personal Information
      if (!formData.firstName) newErrors.firstName = "First name is required"
      if (!formData.lastName) newErrors.lastName = "Last name is required"
      if (!formData.email) newErrors.email = "Email is required"
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
      if (!formData.gender) newErrors.gender = "Gender is required"
    }

    if (step === 2) {
      // Location Information
      if (!formData.country) newErrors.country = "Country is required"
      if (!formData.city) newErrors.city = "City is required"
    }

    if (step === 3) {
      // Professional Information
      if (!formData.jobCategory) newErrors.jobCategory = "Job category is required"
      if (!formData.experience) newErrors.experience = "Experience is required"
      if (!formData.education) newErrors.education = "Education is required"
    }

    if (step === 4) {
      // Emergency Contact
      if (!formData.emergencyContactName) newErrors.emergencyContactName = "Emergency contact name is required"
      if (!formData.emergencyContactPhone) newErrors.emergencyContactPhone = "Emergency contact phone is required"
    }

    if (step === 5) {
      // Documents
      if (!formData.profileImage) newErrors.profileImage = "Profile image is required"
      if (!formData.identificationCard) newErrors.identificationCard = "Identification card is required"
    }

    // Step 6 (Passport & Visa) is optional

    if (step === 7) {
      // Account Security
      if (!formData.password) newErrors.password = "Password is required"
      if (formData.password && formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters"
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // If not on the final step, treat Enter/Submit as clicking "Next"
    if (currentStep < 7) {
      handleNext()
      return
    }

    setSubmitMessage({ type: "", message: "" })

    // Validate final step
    const isValid = await validateStep(7)
    if (!isValid) {
      setSubmitMessage({
        type: "error",
        message: "Please fill in all required fields correctly before submitting.",
      })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      setSubmitMessage({
        type: "info",
        message: "Checking for duplicate accounts...",
      })

      // Check for duplicates
      const noDuplicates = await checkDuplicates()
      if (!noDuplicates) {
        setLoading(false)
        setSubmitMessage({
          type: "error",
          message: "Account with this email or phone number already exists.",
        })
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }

      setSubmitMessage({
        type: "info",
        message: "Uploading documents... Please wait.",
      })

      const uploadedFiles = {}

      // Upload profile image
      if (formData.profileImage) {
        uploadedFiles.profileImageUrl = await handleFileUpload(formData.profileImage, "profileImage")
        if (!uploadedFiles.profileImageUrl) {
          throw new Error("Failed to upload profile image")
        }
      }

      // Upload identification card
      if (formData.identificationCard) {
        uploadedFiles.identificationCardUrl = await handleFileUpload(formData.identificationCard, "identificationCard")
        if (!uploadedFiles.identificationCardUrl) {
          throw new Error("Failed to upload identification card")
        }
      }

      // Upload back identification card (was finalCertificate)
      if (formData.finalCertificate) {
        await handleFileUpload(formData.finalCertificate, "finalCertificate")
      }

      // Upload education final paper
      if (formData.educationFinalPaper) {
        await handleFileUpload(formData.educationFinalPaper, "educationFinalPaper")
      }

      setSubmitMessage({
        type: "info",
        message: "Updating security settings...",
      })

      // Use validatedUser from step 0 (already authenticated)
      const user = validatedUser

      // Update Password to user's choice
      await updatePassword(user, formData.password)

      setSubmitMessage({
        type: "info",
        message: "Saving your application data...",
      })

      // Prepare registration data - include ONLY fields that are in the form
      // Define all fields that exist in the form (excluding password, file objects, and fields not in form)
      const formFields = [
        // Personal Information
        'paymentCode', 'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'gender',

        // Location Information
        'country', 'state', 'city',

        // Professional Information (16 fields total)
        'jobCategory', 'experience', 'education', 'languageProficiency', 'expectedSalary',
        'workPreference', 'willingToRelocate', 'travelExperience',
        'preferredCountries',
        'preferredCountries1',
        'preferredCountries2',
        'preferredCountries3',
        'preferredCountries4',
        'preferredContractLength', 'preferredShift',
        'skills', 'skillsCertificate1', 'skillsCertificate2', 'skillsCertificate3',

        // Passport & Visa Information
        'passportNumber', 'passportExpiryDate', 'passportIssuingCountry',
        'visaStatus', 'visaExpiryDate',

        // Emergency Contact
        'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation'
      ]

      // Build registration data object with only form fields
      const registrationData = {}

      // Add all form fields with their values (default to empty string if null/undefined)
      formFields.forEach(field => {
        registrationData[field] = formData[field] || ""
      })

      // Add uploaded file URLs (only for files we want to save in collection)
      // Note: resumeUrl and coverLetterUrl are NOT included - files are uploaded but URLs not saved
      if (uploadedFiles.profileImageUrl) {
        registrationData.profileImageUrl = uploadedFiles.profileImageUrl
      }
      if (uploadedFiles.identificationCardUrl) {
        registrationData.identificationCardUrl = uploadedFiles.identificationCardUrl
      }

      // Add system fields
      registrationData.uid = user.uid
      registrationData.createdAt = new Date().toISOString()
      registrationData.status = "Pending"
      registrationData.applicationNumber = `APP-${Date.now()}`
      registrationData.isRead = false // For admin notification count

      // Save to Firestore 'users' collection (as requested)
      await setDoc(doc(db, "users", user.uid), registrationData)

      // Create welcome notification if auto welcome is enabled
      try {
        const settingsSnapshot = await getDocs(collection(db, "notificationSettings"))
        let settingsData = null

        if (!settingsSnapshot.empty) {
          settingsData = settingsSnapshot.docs[0].data()
        }

        // Use default settings if none exist (default autoWelcome is true)
        const autoWelcome = settingsData?.autoWelcome !== undefined ? settingsData.autoWelcome : true
        const welcomeTitle = settingsData?.welcomeTitle || "Welcome to Our Platform!"
        const welcomeMessage = settingsData?.welcomeMessage || "Thank you for joining us. We're excited to have you on board!"
        const welcomeExpiry = settingsData?.welcomeExpiry || 24
        const welcomeImage = settingsData?.welcomeImage || ""

        if (autoWelcome) {
          const expiryDate = new Date()
          expiryDate.setHours(expiryDate.getHours() + welcomeExpiry)

          await addDoc(collection(db, "notifications"), {
            userId: user.uid,
            userEmail: formData.email,
            title: welcomeTitle,
            message: welcomeMessage,
            priority: "medium",
            type: "general",
            imageUrl: welcomeImage,
            allowDownload: false,
            isRead: false,
            createdAt: Timestamp.now(),
            scheduledFor: Timestamp.now(),
            expiresAt: Timestamp.fromDate(expiryDate),
            sentBy: "system",
            status: "sent",
            template: "welcome",
            readAt: null,
            clickCount: 0,
            downloadCount: 0,
          })
        }
      } catch (notificationError) {
        // Don't fail registration if notification creation fails
        console.error("Error creating welcome notification:", notificationError)
      }

      setSubmitMessage({
        type: "success",
        message: "Registration successful! Your application has been submitted.",
        applicationNumber: registrationData.applicationNumber
      })

      setTimeout(() => {
        window.location.href = "/login"
      }, 3000)
    } catch (error) {
      console.error("Registration error:", error)
      setSubmitMessage({
        type: "error",
        message: `Registration failed: ${error.message}. Please try again.`,
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden font-sans">
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-6 shadow-xl">
              <UserCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              International Job Application
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Official application form for international career opportunities.
            </p>
            <div className="mt-6 w-24 h-1 bg-black mx-auto rounded-full"></div>
          </div>




          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Progress Indicator */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-600">Step {currentStep + 1} of 8</span>
                <span className="text-sm text-gray-500">
                  {['Payment Code', 'Personal Info', 'Location', 'Professional', 'Emergency Contact', 'Documents', 'Passport & Visa', 'Account Security'][currentStep]}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / 8) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step 0: Payment Code & Phone Number */}
            {currentStep === 0 && (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-200">
                <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mr-4 shadow-sm">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Verification</h2>
                    <p className="text-gray-500 text-sm">Enter your payment code and phone number</p>
                  </div>
                </div>

                {/* Payment Code Section - Simplified */}
                <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-gray-900">Payment Code *</label>
                      <button
                        type="button"
                        onClick={() => window.location.href = "/registration-payment"}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                      >
                        <Zap className="w-3 h-3" />
                        Get Code
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPaymentCode ? "text" : "password"}
                        name="paymentCode"
                        value={formData.paymentCode}
                        onChange={handleInputChange}
                        className={`w-full px-6 py-4 bg-white border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 font-mono text-lg tracking-wide ${errors.paymentCode ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Enter code"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPaymentCode(!showPaymentCode)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-all"
                      >
                        {showPaymentCode ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                      </button>
                    </div>

                    {errors.paymentCode && (
                      <p className="text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.paymentCode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <span className="text-gray-500 font-extrabold border-r border-gray-200 pr-3">+251</span>
                    </div>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber ? formData.phoneNumber.replace('+251', '') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        if (value.length <= 9) {
                          setFormData(prev => ({
                            ...prev,
                            phoneNumber: value ? `+251${value}` : ""
                          }))
                          if (value.length === 9) {
                            setErrors(prev => ({ ...prev, phoneNumber: "" }))
                          }
                        }
                      }}
                      className={`w-full pl-20 pr-4 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.phoneNumber ? "border-red-500" : "border-gray-300"}`}
                      placeholder="913..."
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-200">
                <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-black rounded-lg mr-4 shadow-sm">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Personal Information</h2>
                    <p className="text-gray-500 text-sm">Basic applicants details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.firstName ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="First Name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="Last Name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.email ? "border-red-500" : "border-gray-300"
                          }`}
                        placeholder="email@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-gray-500 font-extrabold border-r border-gray-200 pr-3">+251</span>
                      </div>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber ? formData.phoneNumber.replace('+251', '') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          if (value.length <= 9) {
                            setFormData(prev => ({
                              ...prev,
                              phoneNumber: value ? `+251${value}` : ""
                            }))
                            // Clear error if valid
                            if (value.length === 9) {
                              setErrors(prev => ({ ...prev, phoneNumber: "" }))
                            }
                          }
                        }}
                        className={`w-full pl-20 pr-4 py-3 bg-gray-100 border rounded-lg focus:ring-0 cursor-not-allowed transition-all text-gray-500 placeholder-gray-400 ${errors.phoneNumber ? "border-red-500" : "border-gray-300"
                          }`}
                        placeholder="913..."
                        readOnly
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 ${errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 ${errors.gender ? "border-red-500" : "border-gray-300"
                        }`}
                    >
                      <option value="" className="text-gray-500">
                        Select Gender
                      </option>
                      {genderOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.gender}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location Information */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-200">
                <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-black rounded-lg mr-4 shadow-sm">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Location Information</h2>
                    <p className="text-gray-500 text-sm">Where are you located?</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Destination Country *</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 ${errors.country ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">
                        Select Country
                      </option>
                      {hardcodedCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.country}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Region of residence *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.state ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Region or State"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.state}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City of residence *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.city ? "border-red-500" : "border-gray-300"}`}
                      placeholder="City"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.city}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Professional Information */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-200">
                <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-black rounded-lg mr-4 shadow-sm">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Professional Information</h2>
                    <p className="text-gray-500 text-sm">Your career details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-900">
                  {/* Job Category */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Job Category *</label>
                    <select
                      name="jobCategory"
                      value={formData.jobCategory}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all ${errors.jobCategory ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">Select Job Category</option>
                      {hardcodedJobCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.jobCategory && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.jobCategory}
                      </p>
                    )}
                  </div>


                  {/* Experience Level */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Experience Level *</label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all ${errors.experience ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">Select Experience Level</option>
                      {experienceLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors.experience && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.experience}
                      </p>
                    )}
                  </div>


                  {/* Education Level */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Education Level *</label>
                    <select
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all ${errors.education ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">Select Education Level</option>
                      {educationLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors.education && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.education}
                      </p>
                    )}
                  </div>


                  {/* Language Proficiency */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Language Proficiency *</label>
                    <select
                      name="languageProficiency"
                      value={formData.languageProficiency}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all ${errors.languageProficiency ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">Select Language Proficiency</option>
                      {languageProficiencyLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors.languageProficiency && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.languageProficiency}
                      </p>
                    )}
                  </div>


                  {/* Expected Salary */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Expected Salary *</label>
                    <input
                      type="text"
                      name="expectedSalary"
                      value={formData.expectedSalary}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 placeholder-gray-400 transition-all ${errors.expectedSalary ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.expectedSalary && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.expectedSalary}
                      </p>
                    )}
                  </div>


                  {/* Work Preference */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Work Preference</label>
                    <select
                      name="workPreference"
                      value={formData.workPreference}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all ${errors.workPreference ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">Select Work Preference</option>
                      {workPreferenceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.workPreference && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.workPreference}
                      </p>
                    )}
                  </div>


                  {/* Willing to Relocate */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Willing to Relocate?</label>
                    <select
                      name="willingToRelocate"
                      value={formData.willingToRelocate}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all ${errors.willingToRelocate ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">Select Option</option>
                      <option value="yes">Yes, anywhere</option>
                      <option value="specific-countries">Yes, to specific countries</option>
                      <option value="no">No, prefer current location</option>
                    </select>
                    {errors.willingToRelocate && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.willingToRelocate}
                      </p>
                    )}
                  </div>


                  {/* Travel Experience */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Travel Experience</label>
                    <select
                      name="travelExperience"
                      value={formData.travelExperience}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all ${errors.travelExperience ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">Select Experience</option>
                      <option value="extensive">Extensive (10+ countries)</option>
                      <option value="moderate">Moderate (5–10 countries)</option>
                      <option value="limited">Limited (1–5 countries)</option>
                      <option value="none">No international travel</option>
                    </select>
                    {errors.travelExperience && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.travelExperience}
                      </p>
                    )}
                  </div>


                  {/* International Job Preferences */}
                  <div className="md:col-span-2 space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Preferred Destination Countries (Up to 4 additional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((num) => {
                        const fieldName = `preferredCountries${num}`
                        const prevFieldName = num > 1 ? `preferredCountries${num - 1}` : null
                        const isVisible = num === 1 || (formData[prevFieldName] && formData[prevFieldName] !== "")

                        if (!isVisible) return null

                        // Get all previously selected countries to filter them out
                        const selectedCountries = [
                          formData.country,
                          formData.preferredCountries1,
                          formData.preferredCountries2,
                          formData.preferredCountries3,
                          formData.preferredCountries4
                        ].filter((c, index) => {
                          // index 0 is formData.country
                          // index 1-4 are preferredCountries1-4
                          // We want to filter out everything EXCEPT the current field being rendered
                          if (index === 0) return true // Always filter out the primary destination
                          return index < num && c && c !== ""
                        })

                        return (
                          <div
                            key={num}
                            className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300"
                          >
                            <label className="text-xs font-medium text-gray-500">Option {num}</label>
                            <select
                              name={fieldName}
                              value={formData[fieldName]}
                              onChange={handleInputChange}
                              className="w-full px-5 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all font-medium"
                            >
                              <option value="">Select Country</option>
                              {hardcodedCountries
                                .filter(c => !selectedCountries.includes(c))
                                .map((country) => (
                                  <option key={country} value={country}>
                                    {country}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-gray-500 italic mt-2">
                      * Select countries in order of preference. Next option will appear once current is selected.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Preferred Contract Length
                    </label>
                    <select
                      name="preferredContractLength"
                      value={formData.preferredContractLength}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all"
                    >
                      <option value="" className="text-gray-500">Select contract length</option>
                      <option value="1-year">1 year</option>
                      <option value="2-year">2 years</option>
                      <option value="3-year">3 years</option>
                      <option value="flexible">Flexible / negotiable</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Preferred Working Shift
                    </label>
                    <select
                      name="preferredShift"
                      value={formData.preferredShift}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 transition-all"
                    >
                      <option value="" className="text-gray-500">Select shift preference</option>
                      <option value="day">Day shift only</option>
                      <option value="night">Night shift only</option>
                      <option value="rotational">Rotational shifts</option>
                      <option value="any">Any shift</option>
                    </select>
                  </div>

                  {/* Skills & Qualifications */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">Skills & Qualifications</label>
                      <textarea
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-5 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-gray-900 placeholder-gray-400 transition-all resize-none"
                        placeholder="List your relevant skills and qualifications"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-900">
                        Skills & Qualifications Certificates (Up to 3 - Optional)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((slot) => {
                          const fieldName = `skillsCertificate${slot}`
                          const certificate = formData[fieldName]
                          const isUploading = isUploadingSkills[slot]
                          const progress = uploadProgress[fieldName] || 0

                          // Sequential Visibility: Show Slot 1 always, others only if previous filled
                          const isPreviousFilled = slot === 1 || !!formData[`skillsCertificate${slot - 1}`]
                          if (!isPreviousFilled) return null

                          return (
                            <div key={slot} className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 transition-all hover:border-black min-h-[140px] flex flex-col items-center justify-center text-center">
                                {isUploading ? (
                                  <div className="w-full space-y-3 px-2">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-600">
                                      <span>Uploading {slot}...</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-black h-full transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ) : certificate ? (
                                  <div className="w-full space-y-3 animate-in zoom-in-95 duration-200">
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center overflow-hidden">
                                      {skillsPreviews[slot] && skillsPreviews[slot] !== 'document' ? (
                                        <div className="w-full h-20 mb-2 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                          <img
                                            src={skillsPreviews[slot]}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <Award className="w-6 h-6 text-green-600 mb-1" />
                                      )}
                                      <span className="text-xs font-medium text-gray-900 truncate w-full px-2">{certificate}</span>
                                      <span className="text-[9px] text-green-600 uppercase tracking-wider font-bold mt-1">Ready (Mock)</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Clear all subsequent slots to maintain sequence
                                        const updates = { [fieldName]: null }
                                        const previewUpdates = { [slot]: null }

                                        if (slot === 1) {
                                          updates.skillsCertificate2 = null
                                          updates.skillsCertificate3 = null
                                          previewUpdates[2] = null
                                          previewUpdates[3] = null
                                        } else if (slot === 2) {
                                          updates.skillsCertificate3 = null
                                          previewUpdates[3] = null
                                        }

                                        setFormData(prev => ({ ...prev, ...updates }))
                                        setSkillsPreviews(prev => ({ ...prev, ...previewUpdates }))
                                      }}
                                      className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center justify-center space-x-1 mx-auto"
                                    >
                                      <X className="w-3 h-3" />
                                      <span>Remove</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2 cursor-pointer relative w-full h-full flex flex-col items-center justify-center">
                                    <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-black" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-900">Upload Cert {slot}</p>
                                    <input
                                      type="file"
                                      onChange={(e) => handleSkillsCertificateUpload(e, slot)}
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Emergency Contact */}
            {currentStep === 4 && (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-200">
                <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-black rounded-lg mr-4 shadow-sm">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Emergency Contact</h2>
                    <p className="text-gray-500 text-sm">In case of emergency</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Name *</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 border-gray-300"
                      placeholder="Full name"
                    />
                    {errors.emergencyContactName && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.emergencyContactName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-gray-500 font-extrabold border-r border-gray-200 pr-3">+251</span>
                      </div>
                      <input
                        type="text"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone ? formData.emergencyContactPhone.replace('+251', '') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          if (value.length <= 9) {
                            setFormData(prev => ({
                              ...prev,
                              emergencyContactPhone: value ? `+251${value}` : ""
                            }))
                            // Clear error if valid
                            if (value.length === 9) {
                              setErrors(prev => ({ ...prev, emergencyContactPhone: "" }))
                            }
                          }
                        }}
                        className={`w-full pl-20 pr-4 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.emergencyContactPhone ? "border-red-500" : "border-gray-300"}`}
                        placeholder="913..."
                      />
                    </div>
                    {errors.emergencyContactPhone && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.emergencyContactPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship *</label>
                    <select
                      name="emergencyContactRelation"
                      value={formData.emergencyContactRelation}
                      onChange={handleInputChange}
                      className="w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 border-gray-300"
                    >
                      <option value="" className="text-gray-500">
                        Select Relationship
                      </option>
                      <option value="parent">Parent</option>
                      <option value="spouse">Spouse</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="relative">Relative</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.emergencyContactRelation && (
                      <p className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.emergencyContactRelation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Document Upload */}
            {currentStep === 5 && (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-200">
                <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-black rounded-lg mr-4 shadow-sm">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Document Upload</h2>
                    <p className="text-gray-500 text-sm">Upload your required documents (Max: 1MB each)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Profile Image */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image *</label>
                    <div className="relative group">
                      {docPreviews.profileImage ? (
                        <div className="mb-3 relative animate-in zoom-in-95 duration-200">
                          <div className="w-full h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                            {docPreviews.profileImage === 'document' ? (
                              <Camera className="w-8 h-8 text-gray-300" />
                            ) : (
                              <img src={docPreviews.profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, profileImage: null }));
                              setDocPreviews(prev => ({ ...prev, profileImage: null }));
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            name="profileImage"
                            onChange={handleInputChange}
                            accept="image/*"
                            className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 ${errors.profileImage ? "border-red-500" : "border-gray-300"}`}
                          />
                          <Camera className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                        </div>
                      )}
                    </div>
                    {uploadProgress.profileImage > 0 && uploadProgress.profileImage < 100 && (
                      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-black h-2 rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress.profileImage}%` }}
                        />
                      </div>
                    )}
                    {errors.profileImage && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.profileImage}
                      </p>
                    )}
                  </div>

                  {/* Front Identification Card */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Front Identification Card *</label>
                    <div className="relative group">
                      {docPreviews.identificationCard ? (
                        <div className="mb-3 relative animate-in zoom-in-95 duration-200">
                          <div className="w-full h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                            {docPreviews.identificationCard === 'document' ? (
                              <CreditCard className="w-8 h-8 text-gray-300" />
                            ) : (
                              <img src={docPreviews.identificationCard} alt="ID Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, identificationCard: null }));
                              setDocPreviews(prev => ({ ...prev, identificationCard: null }));
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            name="identificationCard"
                            onChange={handleInputChange}
                            accept="image/*"
                            className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 ${errors.identificationCard ? "border-red-500" : "border-gray-300"}`}
                          />
                          <CreditCard className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                        </div>
                      )}
                    </div>
                    {uploadProgress.identificationCard > 0 && uploadProgress.identificationCard < 100 && (
                      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-black h-2 rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress.identificationCard}%` }}
                        />
                      </div>
                    )}
                    {errors.identificationCard && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.identificationCard}
                      </p>
                    )}
                  </div>

                  {/* Back Identification Card */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Back Identification Card</label>
                    <div className="relative group">
                      {docPreviews.finalCertificate ? (
                        <div className="mb-3 relative animate-in zoom-in-95 duration-200">
                          <div className="w-full h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                            {docPreviews.finalCertificate === 'document' ? (
                              <Award className="w-8 h-8 text-gray-300" />
                            ) : (
                              <img src={docPreviews.finalCertificate} alt="Cert Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, finalCertificate: null }));
                              setDocPreviews(prev => ({ ...prev, finalCertificate: null }));
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            name="finalCertificate"
                            onChange={handleInputChange}
                            accept="image/*"
                            className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 ${errors.finalCertificate ? "border-red-500" : "border-gray-300"}`}
                          />
                          <Award className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                        </div>
                      )}
                    </div>
                    {uploadProgress.finalCertificate > 0 && uploadProgress.finalCertificate < 100 && (
                      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-black h-2 rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress.finalCertificate}%` }}
                        />
                      </div>
                    )}
                    {errors.finalCertificate && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.finalCertificate}
                      </p>
                    )}
                  </div>

                  {/* Education Final Paper */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Education Final Paper</label>
                    <div className="relative group">
                      {docPreviews.educationFinalPaper ? (
                        <div className="mb-3 relative animate-in zoom-in-95 duration-200">
                          <div className="w-full h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                            {docPreviews.educationFinalPaper === 'document' ? (
                              <FileText className="w-8 h-8 text-gray-300" />
                            ) : (
                              <img src={docPreviews.educationFinalPaper} alt="Education Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, educationFinalPaper: null }));
                              setDocPreviews(prev => ({ ...prev, educationFinalPaper: null }));
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            name="educationFinalPaper"
                            onChange={handleInputChange}
                            accept=".pdf,.doc,.docx,image/*"
                            className="w-full px-5 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                          />
                          <FileText className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                        </div>
                      )}
                    </div>
                    {uploadProgress.educationFinalPaper > 0 && uploadProgress.educationFinalPaper < 100 && (
                      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-black h-2 rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress.educationFinalPaper}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Passport & Visa Information */}
            {currentStep === 6 && (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-200 mt-10">
                <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-black rounded-lg mr-4 shadow-sm">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-2xl font-bold text-gray-900">
                        Passport & Visa Information
                      </h4>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold tracking-wider rounded-sm border border-gray-300">
                        OPTIONAL
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">Your travel documents</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Passport Number *</label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.passportNumber ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Enter your passport number"
                    />
                    {errors.passportNumber && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.passportNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Passport Expiry Date *</label>
                    <input
                      type="date"
                      name="passportExpiryDate"
                      value={formData.passportExpiryDate}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 ${errors.passportExpiryDate ? "border-red-500" : "border-gray-300"}`}
                    />
                    {errors.passportExpiryDate && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.passportExpiryDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Passport Issuing Country *
                    </label>
                    <select
                      name="passportIssuingCountry"
                      value={formData.passportIssuingCountry}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 ${errors.passportIssuingCountry ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">
                        Select Issuing Country
                      </option>
                      {hardcodedCountries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {errors.passportIssuingCountry && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.passportIssuingCountry}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Visa Status *</label>
                    <select
                      name="visaStatus"
                      value={formData.visaStatus}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 ${errors.visaStatus ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="" className="text-gray-500">
                        Select Visa Status
                      </option>
                      {visaStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {errors.visaStatus && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.visaStatus}
                      </p>
                    )}
                  </div>

                  {formData.visaStatus && formData.visaStatus !== "No Visa Required" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Visa Expiry Date</label>
                      <input
                        type="date"
                        name="visaExpiryDate"
                        value={formData.visaExpiryDate}
                        onChange={handleInputChange}
                        className="w-full px-5 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 border-gray-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 7: Account Security */}
            {currentStep === 7 && (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-200 mt-10">
                <div className="flex items-center mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-black rounded-lg mr-4 shadow-sm">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Account Security</h2>
                    <p className="text-gray-500 text-sm">Secure your account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-5 py-3 pr-14 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.password ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors p-1"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 6 characters
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-5 py-3 pr-14 bg-white border rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-gray-900 placeholder-gray-400 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors p-1"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Navigation Buttons */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex gap-4">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-8 rounded-xl transition-all"
                  >
                    ← Back
                  </button>
                )}

                {currentStep < 7 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Next
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Complete Registration
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </span>
                    )}
                  </button>
                )}
              </div>

              <p className="text-center text-gray-500 mt-6">
                Already have an account?{" "}
                <a href="/login" className="text-black font-semibold hover:text-gray-700 underline transition-colors">
                  Sign in
                </a>
              </p>
            </div>

            {submitMessage.message && (
              <div
                className={`mt-6 mb-8 p-4 rounded-xl border flex items-center ${submitMessage.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : submitMessage.type === "error"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                  <div className="flex items-center">
                    {submitMessage.type === "success" && <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                    {submitMessage.type === "error" && <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                    {submitMessage.type === "info" && <Zap className="w-5 h-5 mr-3 flex-shrink-0" />}
                    <div>
                      <span className="font-bold block">{submitMessage.message}</span>
                      {submitMessage.applicationNumber && (
                        <p className="text-sm mt-1">
                          Application Number: <span className="font-mono font-bold">{submitMessage.applicationNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {submitMessage.type === "success" && submitMessage.applicationNumber && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(submitMessage.applicationNumber);
                          setCopiedRegNo(true);
                          setTimeout(() => setCopiedRegNo(false), 2000);
                        } catch (err) {
                          console.error("Failed to copy:", err);
                        }
                      }}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg border border-current transition-all flex items-center gap-2 text-sm font-bold"
                    >
                      {copiedRegNo ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Number
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div >
      </div >

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div >
  )
}