import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/apiService"; // adjust path if needed

export default function RequireAdmin({ children }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function checkAdmin() {
      try {
        // You can use API method or fetch directly
        // The endpoint must return {isAdmin: true/false}
        const { data } = await API.checkAdmin();
        if (!cancelled) {
          setIsAdmin(data.isAdmin);
          setChecking(false);
          if (!data.isAdmin) {
            navigate("/admin/login", { replace: true });
          }
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setChecking(false);
          navigate("/admin/login", { replace: true });
        }
      }
    }
    checkAdmin();
    return () => { cancelled = true; };
  }, [navigate]);

  if (checking) return null; // or a spinner

  return isAdmin ? children : null;
}