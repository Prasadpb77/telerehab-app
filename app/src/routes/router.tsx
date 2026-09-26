import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

import Home from "../pages/public/Home";
import PrivacyPolicy from "../pages/public/PrivacyPolicy";
import Terms from "../pages/public/Terms";
import DataRequest from "../pages/public/DataRequest";

import PatientDashboard from "../pages/patient/Dashboard";
import PatientBook from "../pages/patient/Book";
import PatientAppointments from "../pages/patient/Appointments";
import PatientExercises from "../pages/patient/Exercises";
import PatientSessionHistory from "../pages/patient/SessionHistory";
import PatientProgress from "../pages/patient/Progress";
import PatientChatbot from "../pages/patient/Chatbot";

import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorPatientList from "../pages/doctor/PatientList";
import DoctorPatientProfile from "../pages/doctor/PatientProfile";
import DoctorCalendar from "../pages/doctor/Calendar";
import DoctorChatbot from "../pages/doctor/Chatbot";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/privacy-policy", element: <PrivacyPolicy /> },
  { path: "/terms", element: <Terms /> },
  { path: "/data-request", element: <DataRequest /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  {
    path: "/patient",
    element: (
      <ProtectedRoute role="patient">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PatientDashboard /> },
      { path: "book", element: <PatientBook /> },
      { path: "appointments", element: <PatientAppointments /> },
      { path: "exercises", element: <PatientExercises /> },
      { path: "history", element: <PatientSessionHistory /> },
      { path: "progress", element: <PatientProgress /> },
      { path: "chatbot", element: <PatientChatbot /> },
    ],
  },
  {
    path: "/doctor",
    element: (
      <ProtectedRoute role="doctor">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DoctorDashboard /> },
      { path: "patients", element: <DoctorPatientList /> },
      { path: "patients/:patientId", element: <DoctorPatientProfile /> },
      { path: "calendar", element: <DoctorCalendar /> },
      { path: "chatbot", element: <DoctorChatbot /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
