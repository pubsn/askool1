import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "@/components/common";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = location.hash || window.location.hash;
    const sid = new URLSearchParams(hash.replace("#", "")).get("session_id");
    const role = sessionStorage.getItem("askool_signup_role") || undefined;
    if (!sid) { navigate("/connexion"); return; }
    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id: sid, role });
        setUser(data.user);
        window.history.replaceState(null, "", "/dashboard");
        navigate("/dashboard", { replace: true, state: { user: data.user } });
      } catch {
        navigate("/connexion");
      }
    })();
  }, [location.hash, navigate, setUser]);

  return <div className="min-h-screen bg-askool-cream"><Loader label="Connexion en cours…" /></div>;
}
