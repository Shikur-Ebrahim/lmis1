"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { auth } from "../../config/firebase"
import { LogIn, Eye, EyeOff, Shield, Lock, Mail } from "lucide-react"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [focusedField, setFocusedField] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let finalLoginId = email.trim()

      // Transform phone number to internal email format if it's a 9-digit number starting with 9 or 7
      const isPhone = /^[79]\d{8}$/.test(finalLoginId)
      if (isPhone) {
        finalLoginId = `251${finalLoginId}@lmis.gov.et`
      }

      // Authenticate with Firebase Auth
      await login(finalLoginId, password)

      // Get the current user and check for admin custom claims
      const user = auth.currentUser
      if (user) {
        // Get ID token result which contains custom claims
        const idTokenResult = await user.getIdTokenResult()

        // Check if user has admin custom claim
        if (idTokenResult.claims.admin === true) {
          // User is an admin, navigate to admin dashboard
          navigate("/admin/dashboard")
        } else {
          // Regular user, navigate to personal page
          navigate("/personal")
        }
      } else {
        setError("Authentication failed. Please try again.")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Invalid credentials. Please check your email and password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Background Animated Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 relative">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
            <Shield className="w-12 h-12 text-white animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100">
          Secure Login Portal
        </h2>
        <p className="text-center text-white/70 mb-8">LMIS – Secure Company Login Portal</p>

        {/* Error */}
        {error && (
          <div className="mb-4 w-full p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl text-red-100 text-sm flex items-center space-x-2 animate-shake">
            <Lock className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="w-full space-y-6" onSubmit={handleSubmit}>
          {/* Phone Number */}
          <div className="relative">
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Phone Number
            </label>
            <div className="relative">
              {!email || /^\d/.test(email) ? (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center pr-2 border-r border-white/20">
                  <span className="text-white font-bold text-sm">+251</span>
                </div>
              ) : (
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
              )}
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => {
                  const val = e.target.value
                  // If it starts with a number or is empty, treat as phone
                  if (/^\d*$/.test(val)) {
                    if (val.length <= 9) setEmail(val)
                  } else {
                    // Otherwise treat as potentially email for admin
                    setEmail(val)
                  }
                }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField("")}
                placeholder=""
                className={`w-full ${!email || /^\d/.test(email) ? 'pl-16' : 'pl-10'} pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border ${focusedField === "email" ? "border-blue-400/50" : "border-white/20"
                  } focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border ${focusedField === "password" ? "border-blue-400/50" : "border-white/20"
                  } focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-white/70 hover:text-blue-300" /> : <Eye className="w-5 h-5 text-white/70 hover:text-blue-300" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center space-x-2 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-sm text-white/70">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-300 hover:text-blue-100 font-medium underline">
            Register
          </Link>
        </p>
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-blue-300 hover:text-blue-200 text-sm font-medium transition-all duration-200 hover:underline"
          >
            ← Back to Public Site
          </Link>
        </div>
        {/* Footer */}
        <p className="mt-6 text-xs text-white/50">© 2025 LMIS. All rights reserved.</p>
      </div>
    </div>
  )
}
