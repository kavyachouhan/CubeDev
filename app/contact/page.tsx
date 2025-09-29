"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { Send, CircleCheck, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    wcaId: user?.wcaId || "",
    subject: "",
    message: "",
  });

  const submitContactMessage = useMutation(
    api.contactMessages.submitContactMessage
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.subject.trim() ||
        !formData.message.trim()
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Submit to database
      await submitContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        wcaId: formData.wcaId.trim() || undefined,
        userId: user?.convexId || undefined,
      });

      // Send email notification
      const emailResponse = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          wcaId: formData.wcaId.trim() || undefined,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error("Failed to send email notification");
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", wcaId: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="container-responsive py-8 max-w-2xl">
          <div className="timer-card text-center">
            <div className="w-16 h-16 bg-[var(--success)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CircleCheck className="w-8 h-8 text-[var(--success)]" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4 font-statement">
              Message Sent Successfully!
            </h1>
            <p className="text-[var(--text-secondary)] font-inter mb-6 leading-relaxed">
              Thank you for reaching out! I've received your message and will
              get back to you as soon as possible. You should also receive a
              confirmation email shortly.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-all duration-200 font-button"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
        <Header />
      <div className="container-responsive py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 font-statement">
            Contact <span className="text-[var(--primary)]">CubeDev</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-inter">
            Have a question, suggestion, or feedback? I'd love to hear from you!
            Your input helps make CubeDev better.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="timer-card">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 font-statement">
                Send a Message
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
                  <p className="text-[var(--error)] font-inter">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter"
                    >
                      Name <span className="text-[var(--error)]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-[var(--text-primary)] font-inter"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter"
                    >
                      Email <span className="text-[var(--error)]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-[var(--text-primary)] font-inter"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="wcaId"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter"
                  >
                    WCA ID{" "}
                    <span className="text-[var(--text-muted)]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="wcaId"
                    name="wcaId"
                    value={formData.wcaId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-[var(--text-primary)] font-inter"
                    placeholder="WCA ID"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter"
                  >
                    Subject <span className="text-[var(--error)]">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-[var(--text-primary)] font-inter"
                  >
                    <option value="">Select a subject</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="General Feedback">General Feedback</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Partnership/Collaboration">
                      Partnership/Collaboration
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter"
                  >
                    Message <span className="text-[var(--error)]">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-[var(--text-primary)] font-inter resize-vertical"
                    placeholder="Tell me about your question, feedback, or suggestion..."
                  />
                  <div className="mt-2 text-right text-sm text-[var(--text-muted)] font-inter">
                    {formData.message.length}/2000 characters
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-button text-lg transition-all duration-200 ${
                    isSubmitting
                      ? "bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed"
                      : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white hover:scale-105"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
        <Footer />
    </div>
  );
}