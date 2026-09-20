"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminBypassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const key = searchParams.get("key");

    if (!key) {
      setAuthorized(false);
      return;
    }

    async function verifyKey() {
      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        const data = await res.json();

        if (data.success) {
          sessionStorage.setItem("quickapply_access_token", "admin-bypass-token");
          setAuthorized(true);
          router.push("/jobs");
        } else {
          setAuthorized(false);
        }
      } catch {
        setAuthorized(false);
      }
    }

    verifyKey();
  }, [searchParams, router]);

  if (authorized === null) {
    return null;
  }

  if (!authorized) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "#000",
          color: "#fff",
          fontFamily: "sans-serif",
          fontSize: "1.25rem",
          margin: 0,
          padding: 0,
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
        }}
      >
        404 - Page Not Found
      </div>
    );
  }

  return null;
}
