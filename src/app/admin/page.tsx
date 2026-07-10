"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
    } else {
      const allTickets = data || [];
      setPendingTickets(allTickets.filter(t => t.status === "pending"));
      setResolvedTickets(allTickets.filter(t => t.status === "resolved"));
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "this_is_hash") {
      setAuthenticated(true);
      fetchTickets();
    } else {
      alert("Incorrect password!");
    }
  };

  const handleAnswerChange = (ticketId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [ticketId]: value }));
  };

  const handleSubmit = async (ticketId: string) => {
    const answer = answers[ticketId];
    if (!answer || answer.trim() === "") return;

    setSubmitting(ticketId);
    try {
      const response = await fetch("/api/admin/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, answer }),
      });

      if (response.ok) {
        // Move ticket from pending to resolved locally
        const ticketToMove = pendingTickets.find(t => t.id === ticketId);
        if (ticketToMove) {
          setPendingTickets((prev) => prev.filter((t) => t.id !== ticketId));
          setResolvedTickets((prev) => [{ ...ticketToMove, status: "resolved" }, ...prev]);
        }
      } else {
        const err = await response.json();
        alert("Error submitting answer: " + err.error);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit answer.");
    }
    setSubmitting(null);
  };

  if (!authenticated) {
    return (
      <div style={{ padding: "4rem 2rem", maxWidth: "400px", margin: "auto", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "#00ffff", marginBottom: "2rem" }}>Admin Access Required</h2>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "10px", background: "#111", color: "#fff", border: "1px solid #333", borderRadius: "5px" }}
          />
          <button type="submit" style={{ background: "#00ffff", color: "#000", padding: "10px", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "auto" }}>
      <h1 style={{ color: "#00ffff", borderBottom: "2px solid #00ffff", paddingBottom: "10px" }}>Hash 12.0 Support Dashboard</h1>
      <p style={{ color: "#aaa", marginBottom: "2rem" }}>Answer questions here. Answers will be emailed to users and fed into the AI's permanent knowledge base.</p>

      {loading ? (
        <p>Loading tickets...</p>
      ) : (
        <>
          <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Pending Questions ({pendingTickets.length})</h2>
          {pendingTickets.length === 0 ? (
            <div style={{ padding: "2rem", background: "#111", borderRadius: "10px", textAlign: "center", color: "#0f0", marginBottom: "3rem" }}>
              <h3>All caught up! 🎉</h3>
              <p>There are no pending questions at the moment.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "3rem" }}>
              {pendingTickets.map((ticket) => (
                <div key={ticket.id} style={{ background: "#1a1a1a", padding: "1.5rem", borderRadius: "10px", borderLeft: "5px solid #00ffff" }}>
                  <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: "10px" }}>
                    <strong>User Contact:</strong> {ticket.user_contact}
                    <span style={{ float: "right" }}>{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                  <blockquote style={{ fontSize: "1.1rem", background: "#222", padding: "15px", margin: "0 0 15px 0", borderRadius: "5px" }}>
                    "{ticket.question}"
                  </blockquote>
                  <textarea
                    placeholder="Type your official answer here..."
                    style={{ width: "100%", height: "100px", padding: "10px", background: "#000", color: "#fff", border: "1px solid #333", borderRadius: "5px", marginBottom: "10px", fontFamily: "inherit" }}
                    value={answers[ticket.id] || ""}
                    onChange={(e) => handleAnswerChange(ticket.id, e.target.value)}
                  />
                  <button
                    onClick={() => handleSubmit(ticket.id)}
                    disabled={submitting === ticket.id || !answers[ticket.id]}
                    style={{
                      background: submitting === ticket.id ? "#555" : "#00ffff",
                      color: submitting === ticket.id ? "#ccc" : "#000",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: submitting === ticket.id ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {submitting === ticket.id ? "Sending..." : "Submit Answer"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ color: "#888", marginBottom: "1rem", borderTop: "1px solid #333", paddingTop: "2rem" }}>Resolved Questions ({resolvedTickets.length})</h2>
          {resolvedTickets.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {resolvedTickets.map((ticket) => (
                <div key={ticket.id} style={{ background: "#111", padding: "1rem", borderRadius: "10px", borderLeft: "3px solid #333", opacity: 0.7 }}>
                  <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "5px" }}>
                    <strong>Resolved:</strong> {ticket.user_contact}
                    <span style={{ float: "right" }}>{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                  <blockquote style={{ fontSize: "0.95rem", margin: 0, color: "#aaa" }}>
                    "{ticket.question}"
                  </blockquote>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
