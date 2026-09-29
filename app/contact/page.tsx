"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { Send, CircleCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CardIcon } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/Menu";

const SUBJECT_OPTIONS = [
  "Bug Report",
  "Feature Request",
  "General Feedback",
  "Technical Support",
  "Partnership/Collaboration",
  "Other",
];

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
    api.contactMessages.submitContactMessage,
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
          : "Failed to send message. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-(--background) flex items-center justify-center">
        <div className="container-responsive py-8 max-w-2xl">
          <div className="timer-card text-center">
            <CardIcon
              tone="success"
              className="mx-auto mb-6 w-14 h-14 [&_svg]:w-7 [&_svg]:h-7"
            >
              <CircleCheck />
            </CardIcon>
            <h1 className="text-3xl font-bold text-(--text-primary) mb-4 font-statement">
              Message Sent Successfully!
            </h1>
            <p className="text-(--text-secondary) font-inter mb-6 leading-relaxed">
              Thank you for reaching out! We&apos;ve received your message and
              will get back to you as soon as possible. You should also receive
              a confirmation email shortly.
            </p>
            <Button size="lg" onClick={() => setSubmitted(false)}>
              Send another message
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <div className="container-responsive py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-(--text-primary) mb-4 font-statement">
            Contact <span className="text-(--primary)">CubeDev</span>
          </h1>
          <p className="text-xl text-(--text-secondary) max-w-2xl mx-auto font-inter">
            Have a question, suggestion, or feedback? I'd love to hear from you!
            Your input helps make CubeDev better.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="timer-card">
              <h2 className="text-2xl font-bold text-(--text-primary) mb-6 font-statement">
                Send a Message
              </h2>

              {error && (
                <Alert tone="error" className="mb-6">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Name" required>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                    />
                  </Field>

                  <Field label="Email" required>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                    />
                  </Field>
                </div>

                <Field label="WCA ID or CubeDev ID" hint="Optional">
                  <Input
                    id="wcaId"
                    name="wcaId"
                    value={formData.wcaId}
                    onChange={handleInputChange}
                    placeholder="e.g. 2015XXXX01 or CD15XXX01"
                  />
                </Field>

                <Field label="Subject" required>
                  <SelectMenu
                    id="subject"
                    label="Subject"
                    placeholder="Select a subject"
                    value={formData.subject || null}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, subject: value }))
                    }
                    options={SUBJECT_OPTIONS.map((subject) => ({
                      value: subject,
                      label: subject,
                    }))}
                  />
                </Field>

                <Field
                  label="Message"
                  required
                  hint={`${formData.message.length}/2000 characters`}
                >
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    maxLength={2000}
                    placeholder="Tell me about your question, feedback, or suggestion…"
                  />
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  loadingText="Sending message…"
                  iconLeft={<Send className="w-5 h-5" />}
                >
                  Send message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}