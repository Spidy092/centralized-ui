// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { auth } from "@spidy092/auth-client";

export default function ProtectedRoute({ children }) {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
