import React, { useState } from "react";
import { Role } from "../../types";
import { useRipple } from "../../hooks/useRipple";
import RippleButton from "../RippleButton";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

type AuthState = "landing" | "adminLogin" | "studentLogin" | "studentSignup" | "parentLogin" | "parentSignup" | "adminReset" | "studentReset" | "parentReset";

function PasswordInput({ value, onChange, placeholder = "Password", className = "" }: { value: string, onChange: (e: any) => void, placeholder?: string, className?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input 
        required 
        type={show ? "text" : "password"} 
        placeholder={placeholder} 
        className={className || "w-full px-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"} 
        value={value} 
        onChange={onChange} 
      />
      <button 
        type="button" 
        onClick={() => setShow(!show)} 
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
      >
        {show ? "👁️" : "👁️‍🗨️"}
      </button>
    </div>
  );
}

interface AuthProps {
  onLogin: (role: Role, user: any) => void;
}

export default function AuthFlow({ onLogin }: AuthProps) {
  const [authState, setAuthState] = useState<AuthState>("landing");

  // Auth Forms State
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [studentReg, setStudentReg] = useState("");
  const [studentPass, setStudentPass] = useState("");

  const [studentForm, setStudentForm] = useState({
    name: "", fatherName: "", phone: "", registrationNumber: "", department: "", currentSemester: "1st Semester", email: "", password: ""
  });
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);

  const [parentEmail, setParentEmail] = useState("");
  const [parentPass, setParentPass] = useState("");

  const [parentForm, setParentForm] = useState({
    name: "", phone: "", address: "", email: "", password: "", registrationNumber: ""
  });
  const [parentPhoto, setParentPhoto] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const adminLoginSchema = Yup.object().shape({
    adminId: Yup.string().required("Admin ID is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleAdminLogin = async (values: any, { setSubmitting }: any) => {
    setError("");
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: values.adminId, password: values.password })
      });
      const data = await res.json();
      if (res.ok) onLogin("admin", data.user);
      else setError(data.message);
    } catch (err) { setError("Network error. Please check if the backend is running."); }
    setSubmitting(false);
  };

  const studentLoginSchema = Yup.object().shape({
    registrationNumber: Yup.string().required("Registration Number is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleStudentLogin = async (values: any, { setSubmitting }: any) => {
    setError("");
    try {
      const res = await fetch("/api/auth/student/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: values.registrationNumber, password: values.password })
      });
      const data = await res.json();
      if (res.ok) onLogin("student", data.user);
      else setError(data.message);
    } catch (err) { setError("Network error"); }
    setSubmitting(false);
  };

  const parentLoginSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleParentLogin = async (values: any, { setSubmitting }: any) => {
    setError("");
    try {
      const res = await fetch("/api/auth/parent/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin("parent", { ...data.user, linkedStudent: data.linkedStudent });
      } else setError(data.message);
    } catch (err) { setError("Network error"); }
    setSubmitting(false);
  };

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(studentForm).forEach(([k, v]) => formData.append(k, v));
      if (studentPhoto) formData.append("profilePicture", studentPhoto);

      const res = await fetch("/api/auth/student/signup", {
        method: "POST", body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert("Student registered successfully! Please login.");
        setAuthState("studentLogin");
      } else setError(data.message);
    } catch (err) { setError("Network error"); }
    setLoading(false);
  };

  const handleParentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      // Step 1: Verify student exists
      const checkRes = await fetch("/api/auth/parent/verify-student", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: parentForm.registrationNumber })
      });
      const checkData = await checkRes.json();
      
      if (!checkRes.ok) {
        setError(checkData.message);
        setLoading(false);
        return;
      }

      if (!confirm(`Found Student: ${checkData.studentName}. Do you want to link your account to this student?`)) {
        setLoading(false);
        return;
      }

      // Step 2: Proceed with signup
      const formData = new FormData();
      Object.entries(parentForm).forEach(([k, v]) => formData.append(k, v));
      if (parentPhoto) formData.append("profilePicture", parentPhoto);

      const res = await fetch("/api/auth/parent/signup", {
        method: "POST", body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert("Parent registered successfully! Please login.");
        setAuthState("parentLogin");
      } else setError(data.message);
    } catch (err) { setError("Network error"); }
    setLoading(false);
  };

  const handleAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, newPassword: adminPassword })
      });
      const data = await res.json();
      if (res.ok) setSuccess(data.message);
      else setError(data.message);
    } catch (err) { setError("Network error"); }
    setLoading(false);
  };

  const handleStudentReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/student/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: studentReg, newPassword: studentPass })
      });
      const data = await res.json();
      if (res.ok) setSuccess(data.message);
      else setError(data.message);
    } catch (err) { setError("Network error"); }
    setLoading(false);
  };

  const handleParentReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/parent/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parentEmail, newPassword: parentPass })
      });
      const data = await res.json();
      if (res.ok) setSuccess(data.message);
      else setError(data.message);
    } catch (err) { setError("Network error"); }
    setLoading(false);
  };

  const renderLanding = () => {
    const roles = [
      { role: "admin", label: "Administrator", desc: "Full system access", icon: "🔐", color: "from-indigo-600 to-slate-800", bg: "border-slate-700 hover:border-indigo-500", action: () => setAuthState("adminLogin") },
      { role: "student", label: "Student", desc: "View safety status & incidents", icon: "🎓", color: "from-blue-600 to-blue-800", bg: "border-slate-700 hover:border-blue-500", action: () => setAuthState("studentLogin") },
      { role: "parent", label: "Parent / Guardian", desc: "Monitor child's campus safety", icon: "👨‍👩‍👧", color: "from-teal-600 to-slate-700", bg: "border-slate-700 hover:border-teal-500", action: () => setAuthState("parentLogin") },
    ];

    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">University Harassment<br />Detection System</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-12">A real-time AI campus safety platform protecting students.</p>
          <div className="grid grid-cols-3 gap-5">
            {roles.map((r) => (
              <button key={r.role} onClick={r.action} className={`text-left p-6 rounded-2xl border bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-2xl ${r.bg} group`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>{r.icon}</div>
                <h3 className="text-white font-bold text-base mb-1.5">{r.label}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderForm = (title: string, onSubmit: any, children: React.ReactNode, footer?: React.ReactNode) => (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 w-full max-w-md relative">
        <button onClick={() => { setAuthState("landing"); setError(""); setSuccess(""); }} className="absolute top-4 left-4 text-slate-400 hover:text-white">← Back</button>
        <h2 className="text-2xl font-bold text-center text-white mb-6 mt-4">{title}</h2>
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-500/20">{error}</div>}
        {success && <div className="bg-green-500/20 text-green-400 p-3 rounded-lg text-sm mb-4 border border-green-500/20">{success}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <RippleButton type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Submit"}
          </RippleButton>
        </form>
        {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
      </div>
    </div>
  );

  const semesters = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <header className="flex items-center gap-3 px-8 py-6">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">🛡️</div>
        <div><p className="font-bold text-white">SafeCampus HDS</p></div>
      </header>

      {authState === "landing" && renderLanding()}
      
      {authState === "adminLogin" && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 w-full max-w-md relative">
            <button onClick={() => setAuthState("landing")} className="absolute top-4 left-4 text-slate-400 hover:text-white">← Back</button>
            <h2 className="text-2xl font-bold text-center text-white mb-6 mt-4">Admin Login</h2>
            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-500/20">{error}</div>}
            <Formik
              initialValues={{ adminId: "", password: "" }}
              validationSchema={adminLoginSchema}
              onSubmit={handleAdminLogin}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-4">
                  <div>
                    <Field name="adminId" type="text" placeholder="Admin ID" className="w-full px-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" />
                    <ErrorMessage name="adminId" component="div" className="text-red-400 text-xs mt-1" />
                  </div>
                  <div>
                    <PasswordInput value={values.password} onChange={e => setFieldValue("password", e.target.value)} />
                    <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
                  </div>
                  <RippleButton type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Submit"}
                  </RippleButton>
                </Form>
              )}
            </Formik>
            <div className="mt-4 text-center text-sm">
              <button type="button" onClick={() => { setAuthState("adminReset"); setError(""); setSuccess(""); }} className="text-slate-400 hover:text-white transition-colors">Forgot Password?</button>
            </div>
          </div>
        </div>
      )}

      {authState === "adminReset" && renderForm("Admin Reset Password", handleAdminReset, (
        <>
          <input required placeholder="Admin ID" className="w-full px-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={adminId} onChange={e => setAdminId(e.target.value)} />
          <PasswordInput placeholder="New Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
        </>
      ), <button type="button" onClick={() => { setAuthState("adminLogin"); setError(""); setSuccess(""); }} className="text-blue-400 hover:text-blue-300 transition-colors">Back to Login</button>)}

      {authState === "studentLogin" && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 w-full max-w-md relative">
            <button onClick={() => setAuthState("landing")} className="absolute top-4 left-4 text-slate-400 hover:text-white">← Back</button>
            <h2 className="text-2xl font-bold text-center text-white mb-6 mt-4">Student Login</h2>
            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-500/20">{error}</div>}
            <Formik
              initialValues={{ registrationNumber: "", password: "" }}
              validationSchema={studentLoginSchema}
              onSubmit={handleStudentLogin}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-4">
                  <div>
                    <Field name="registrationNumber" type="text" placeholder="Registration Number" className="w-full px-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" />
                    <ErrorMessage name="registrationNumber" component="div" className="text-red-400 text-xs mt-1" />
                  </div>
                  <div>
                    <PasswordInput value={values.password} onChange={e => setFieldValue("password", e.target.value)} />
                    <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
                  </div>
                  <RippleButton type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Submit"}
                  </RippleButton>
                </Form>
              )}
            </Formik>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
              <button type="button" onClick={() => { setAuthState("studentReset"); setError(""); setSuccess(""); }} className="text-slate-400 hover:text-white transition-colors">Forgot Password?</button>
              <button type="button" onClick={() => setAuthState("studentSignup")} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Create account</button>
            </div>
          </div>
        </div>
      )}

      {authState === "studentReset" && renderForm("Student Reset Password", handleStudentReset, (
        <>
          <input required placeholder="Registration Number" className="w-full px-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={studentReg} onChange={e => setStudentReg(e.target.value)} />
          <PasswordInput placeholder="New Password" value={studentPass} onChange={e => setStudentPass(e.target.value)} />
        </>
      ), <button type="button" onClick={() => { setAuthState("studentLogin"); setError(""); setSuccess(""); }} className="text-blue-400 hover:text-blue-300 transition-colors">Back to Login</button>)}

      {authState === "studentSignup" && renderForm("Student Signup", handleStudentSignup, (
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Full Name" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
          <input required placeholder="Father Name" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={studentForm.fatherName} onChange={e => setStudentForm({...studentForm, fatherName: e.target.value})} />
          <input required placeholder="Phone Number" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} />
          <input required placeholder="Registration Number" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={studentForm.registrationNumber} onChange={e => setStudentForm({...studentForm, registrationNumber: e.target.value})} />
          <input required placeholder="Department" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={studentForm.department} onChange={e => setStudentForm({...studentForm, department: e.target.value})} />
          <select className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={studentForm.currentSemester} onChange={e => setStudentForm({...studentForm, currentSemester: e.target.value})}>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input required type="email" placeholder="Email Address" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} />
          <div className="col-span-2"><PasswordInput className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} /></div>
          <div className="col-span-2 mt-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Picture</label>
            <input required type="file" accept="image/*" onChange={e => e.target.files && setStudentPhoto(e.target.files[0])} className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer" />
          </div>
        </div>
      ), <button type="button" onClick={() => setAuthState("studentLogin")} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Already have an account? Login</button>)}

      {authState === "parentLogin" && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 w-full max-w-md relative">
            <button onClick={() => setAuthState("landing")} className="absolute top-4 left-4 text-slate-400 hover:text-white">← Back</button>
            <h2 className="text-2xl font-bold text-center text-white mb-6 mt-4">Parent Login</h2>
            {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-500/20">{error}</div>}
            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={parentLoginSchema}
              onSubmit={handleParentLogin}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-4">
                  <div>
                    <Field name="email" type="email" placeholder="Email Address" className="w-full px-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" />
                    <ErrorMessage name="email" component="div" className="text-red-400 text-xs mt-1" />
                  </div>
                  <div>
                    <PasswordInput value={values.password} onChange={e => setFieldValue("password", e.target.value)} />
                    <ErrorMessage name="password" component="div" className="text-red-400 text-xs mt-1" />
                  </div>
                  <RippleButton type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Submit"}
                  </RippleButton>
                </Form>
              )}
            </Formik>
            <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
              <button type="button" onClick={() => { setAuthState("parentReset"); setError(""); setSuccess(""); }} className="text-slate-400 hover:text-white transition-colors">Forgot Password?</button>
              <button type="button" onClick={() => setAuthState("parentSignup")} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Create account</button>
            </div>
          </div>
        </div>
      )}

      {authState === "parentReset" && renderForm("Parent Reset Password", handleParentReset, (
        <>
          <input required type="email" placeholder="Email Address" className="w-full px-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
          <PasswordInput placeholder="New Password" value={parentPass} onChange={e => setParentPass(e.target.value)} />
        </>
      ), <button type="button" onClick={() => { setAuthState("parentLogin"); setError(""); setSuccess(""); }} className="text-blue-400 hover:text-blue-300 transition-colors">Back to Login</button>)}

      {authState === "parentSignup" && renderForm("Parent Signup", handleParentSignup, (
        <div className="space-y-3">
          <input required placeholder="Full Name" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={parentForm.name} onChange={e => setParentForm({...parentForm, name: e.target.value})} />
          <input required placeholder="Phone Number" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={parentForm.phone} onChange={e => setParentForm({...parentForm, phone: e.target.value})} />
          <input required placeholder="Address" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={parentForm.address} onChange={e => setParentForm({...parentForm, address: e.target.value})} />
          <input required type="email" placeholder="Email Address" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={parentForm.email} onChange={e => setParentForm({...parentForm, email: e.target.value})} />
          <PasswordInput className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={parentForm.password} onChange={e => setParentForm({...parentForm, password: e.target.value})} />
          <hr className="my-2 border-slate-700" />
          <p className="text-xs font-semibold text-slate-400">Student Linking</p>
          <input required placeholder="Student Registration Number" className="w-full px-3 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" value={parentForm.registrationNumber} onChange={e => setParentForm({...parentForm, registrationNumber: e.target.value})} />
          <div className="mt-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Picture</label>
            <input required type="file" accept="image/*" onChange={e => e.target.files && setParentPhoto(e.target.files[0])} className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer" />
          </div>
        </div>
      ), <button type="button" onClick={() => setAuthState("parentLogin")} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Already have an account? Login</button>)}
      
    </div>
  );
}
