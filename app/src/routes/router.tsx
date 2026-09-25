import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

import PatientDashboard from "../pages/patient/Dashboard";
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
  { path: "*", element: <Navigate to="/login" replace /> },
]);
