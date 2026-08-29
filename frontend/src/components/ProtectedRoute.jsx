import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "@/components/common";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading || user === null) return <div className="min-h-screen bg-askool-cream"><Loader label="Vérification…" /></div>;
  if (!user) return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role) && user.role !== "ADMIN")
    return <Navigate to="/dashboard" replace />;
  return children;
}
