"use client";

import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import {
  CheckCircle2,
  Youtube,
  Instagram,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CardIcon } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { SelectMenu } from "@/components/ui/Menu";
import { Modal } from "@/components/ui/Modal";

interface CoachVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SocialLinks {
  youtube: string;
  instagram: string;
  twitter: string;
  other: string;
}

interface EventAverage {
  event: string;
  average: string;
}

interface FormData {
  name: string;
  wcaId: string;
  email: string;
  eventAverages: EventAverage[];
  skillLevel: string;
  achievements: string;
  availability: string;
  whyInterested: string;
  socialLinks: SocialLinks;
}

const EVENTS = [
  { value: "333", label: "3x3 Cube" },
  { value: "222", label: "2x2 Cube" },
  { value: "444", label: "4x4 Cube" },
  { value: "555", label: "5x5 Cube" },
  { value: "666", label: "6x6 Cube" },
  { value: "777", label: "7x7 Cube" },
  { value: "333bf", label: "3x3 Blindfolded" },
  { value: "333oh", label: "3x3 One-Handed" },
  { value: "333fm", label: "Fewest Moves" },
  { value: "clock", label: "Clock" },
  { value: "minx", label: "Megaminx" },
  { value: "pyram", label: "Pyraminx" },
  { value: "skewb", label: "Skewb" },
  { value: "sq1", label: "Square-1" },
  { value: "444bf", label: "4x4 Blindfolded" },
  { value: "555bf", label: "5x5 Blindfolded" },
  { value: "333mbf", label: "Multi-Blind" },
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner (sub-60)" },
  { value: "intermediate", label: "Intermediate (sub-30)" },
  { value: "advanced", label: "Advanced (sub-15)" },
  { value: "expert", label: "Expert (sub-10)" },
  { value: "worldclass", label: "World Class (sub-8)" },
];

const SOCIAL_FIELDS: {
  key: keyof SocialLinks;
  icon: ReactNode;
  placeholder: string;
}[] = [
  { key: "youtube", icon: <Youtube />, placeholder: "YouTube channel URL" },
  { key: "instagram", icon: <Instagram />, placeholder: "Instagram @username" },
  {
    key: "twitter",
    // lucide has no brand marks; 𝕏 is the mark itself, not an emoji.
    icon: <span className="text-sm font-medium">𝕏</span>,
    placeholder: "Twitter/X @handle",
  },
  {
    key: "other",
    icon: <ExternalLink />,
    placeholder: "Other link (website, etc.)",
  },
];

export default function CoachVolunteerModal({
  isOpen,
  onClose,
}: CoachVolunteerModalProps) {
  const { user } = useUser();
  const submitFeedback = useMutation(api.feedbackResponses.submitFeedback);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    wcaId: "",
    email: "",
    eventAverages: [],
    skillLevel: "",
    achievements: "",
    availability: "",
    whyInterested: "",
    socialLinks: {
      youtube: "",
      instagram: "",
      twitter: "",
      other: "",
    },
  });

  // The submit button lives in the modal footer, outside the <form>.
  const formId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For adding new event averages
  const [newEvent, setNewEvent] = useState("");
  const [newAverage, setNewAverage] = useState("");

  // Prefill user data when available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        wcaId: user.wcaId || prev.wcaId,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const addEventAverage = () => {
    if (!newEvent || !newAverage.trim()) return;

    // Check if event already exists
    if (formData.eventAverages.some((ea) => ea.event === newEvent)) {
      setError("This event has already been added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      eventAverages: [
        ...prev.eventAverages,
        { event: newEvent, average: newAverage.trim() },
      ],
    }));
    setNewEvent("");
    setNewAverage("");
    setError(null);
  };

  const removeEventAverage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      eventAverages: prev.eventAverages.filter((_, i) => i !== index),
    }));
  };

  const getEventLabel = (eventValue: string) => {
    return EVENTS.find((e) => e.value === eventValue)?.label || eventValue;
  };

  // Get already added events for disabling in dropdown
  const addedEvents = formData.eventAverages.map((ea) => ea.event);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate required fields
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.skillLevel ||
      !formData.whyInterested.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format event averages for storage
      const eventAveragesFormatted = formData.eventAverages.reduce(
        (acc, ea) => {
          acc[ea.event] = ea.average;
          return acc;
        },
        {} as Record<string, string>,
      );

      // Save to Convex
      await submitFeedback({
        userId: user?.convexId as Id<"users"> | undefined,
        surveyType: "coach-volunteer",
        surveyVersion: "1.1",
        customResponses: {
          name: formData.name.trim(),
          wcaId: formData.wcaId.trim(),
          email: formData.email.trim(),
          eventAverages: eventAveragesFormatted,
          skillLevel: formData.skillLevel,
          achievements: formData.achievements.trim(),
          availability: formData.availability.trim(),
          whyInterested: formData.whyInterested.trim(),
          socialLinks: formData.socialLinks,
          submittedAt: new Date().toISOString(),
        },
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      // Format event averages for email
      const eventAveragesText =
        formData.eventAverages.length > 0
          ? formData.eventAverages
              .map((ea) => `  - ${getEventLabel(ea.event)}: ${ea.average}`)
              .join("\n")
          : "Not provided";

      // Send confirmation email
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          wcaId: formData.wcaId.trim(),
          subject: "Coach Contributor Application",
          message: `Thank you for applying to become a CubeDev Coach contributor!

Here's a summary of your application:

Name: ${formData.name.trim()}
WCA ID: ${formData.wcaId.trim() || "Not provided"}
Skill Level: ${formData.skillLevel}
Availability: ${formData.availability.trim() || "Not provided"}

Event Averages:
${eventAveragesText}

Why you want to contribute:
${formData.whyInterested.trim()}

We'll review your application and get back to you soon!`,
          type: "volunteer",
        }),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit volunteer application:", err);
      setError("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Success state
  if (submitted) {
    return (
      <Modal open onClose={handleClose} size="sm" mobile="sheet">
        <Modal.Header title="Application received" />
        <Modal.Body className="text-center">
          <CardIcon tone="success" className="mx-auto mb-4 w-12 h-12 [&_svg]:w-6 [&_svg]:h-6">
            <CheckCircle2 />
          </CardIcon>
          <p className="type-body">
            Thank you for your interest! We&apos;ve sent a confirmation email to{" "}
            {formData.email}. We&apos;ll review your application and get back to
            you soon.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} fullWidth>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal open onClose={handleClose} size="lg" mobile="fullscreen">
      <Modal.Header title="Become a contributor" />
      <Modal.Body>
        {/* Perks Section */}
        <div className="mb-6 p-4 bg-(--primary)/5 border border-(--primary)/20 rounded-(--radius-panel)">
          <h3 className="text-sm font-semibold text-(--text-primary) mb-3 font-statement">
            Contributor Perks
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-xs text-(--text-secondary)">
              <span className="w-1.5 h-1.5 rounded-full bg-(--primary) mt-1.5 shrink-0" />
              <span>Get credited on the Credits page</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-(--text-secondary)">
              <span className="w-1.5 h-1.5 rounded-full bg-(--primary) mt-1.5 shrink-0" />
              <span>Exclusive contributor badge on your profile</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-(--text-secondary)">
              <span className="w-1.5 h-1.5 rounded-full bg-(--primary) mt-1.5 shrink-0" />
              <span>Early access to new CubeDev features</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-(--text-secondary)">
              <span className="w-1.5 h-1.5 rounded-full bg-(--primary) mt-1.5 shrink-0" />
              <span>Make a positive impact on the cubing community</span>
            </li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <Alert tone="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Field label="Name" required>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Your name"
            />
          </Field>

          <Field label="WCA ID">
            <Input
              value={formData.wcaId}
              onChange={(e) =>
                setFormData({ ...formData, wcaId: e.target.value })
              }
              placeholder="e.g. 2023XXXX01"
            />
          </Field>

          <Field label="Email" required>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="your@email.com"
            />
          </Field>

          {/* Event Averages Section */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Your Averages
            </label>
            <p className="text-xs text-(--text-muted) mb-3">
              Add your average times for events you specialize in
            </p>

            {/* Added Event Averages */}
            {formData.eventAverages.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.eventAverages.map((ea, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 bg-(--surface-elevated) border border-(--border) rounded-(--radius-panel)"
                  >
                    <span className="flex-1 text-sm text-(--text-primary) font-inter">
                      {getEventLabel(ea.event)}
                    </span>
                    <span className="text-sm text-(--text-secondary) font-mono">
                      {ea.average}
                    </span>
                    <IconButton
                      size="sm"
                      variant="danger"
                      onClick={() => removeEventAverage(index)}
                      aria-label="Remove event"
                      icon={<Trash2 />}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Add New Event Average */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SelectMenu
                  label="Event"
                  value={newEvent}
                  onChange={setNewEvent}
                  placeholder="Select event"
                  options={EVENTS.map((event) => ({
                    value: event.value,
                    label: event.label,
                    disabled: addedEvents.includes(event.value),
                  }))}
                />
                <Input
                  value={newAverage}
                  onChange={(e) => setNewAverage(e.target.value)}
                  placeholder="e.g. 12.50"
                  aria-label="Average time"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={addEventAverage}
                disabled={!newEvent || !newAverage.trim()}
                iconLeft={<Plus className="w-4 h-4" />}
              >
                Add event
              </Button>
            </div>
          </div>

          <Field label="Skill level" required>
            <SelectMenu
              label="Skill level"
              options={SKILL_LEVELS}
              value={formData.skillLevel}
              onChange={(value) =>
                setFormData({ ...formData, skillLevel: value })
              }
              placeholder="Select your level"
            />
          </Field>

          <Field label="Notable achievements">
            <Textarea
              value={formData.achievements}
              onChange={(e) =>
                setFormData({ ...formData, achievements: e.target.value })
              }
              rows={2}
              placeholder="Competition results, personal bests, teaching experience"
            />
          </Field>

          <Field label="Weekly availability">
            <Input
              value={formData.availability}
              onChange={(e) =>
                setFormData({ ...formData, availability: e.target.value })
              }
              placeholder="e.g. 2-4 hours per week"
            />
          </Field>

          {/* Social Accounts */}
          <div className="p-4 bg-(--surface-elevated) border border-(--border) rounded-(--radius-panel)">
            <h3 className="text-sm font-medium text-(--text-primary) mb-3">
              Social Accounts (Optional)
            </h3>
            <div className="space-y-3">
              {SOCIAL_FIELDS.map(({ key, icon, placeholder }) => (
                <Input
                  key={key}
                  size="sm"
                  leading={icon}
                  value={formData.socialLinks[key]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: {
                        ...formData.socialLinks,
                        [key]: e.target.value,
                      },
                    })
                  }
                  placeholder={placeholder}
                  aria-label={placeholder}
                />
              ))}
            </div>
          </div>

          <Field label="Why do you want to contribute?" required>
            <Textarea
              value={formData.whyInterested}
              onChange={(e) =>
                setFormData({ ...formData, whyInterested: e.target.value })
              }
              rows={3}
              placeholder="Tell us about your cubing journey and why you want to help improve the coach"
            />
          </Field>

        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form={formId}
          loading={isSubmitting}
          loadingText="Submitting…"
        >
          Submit application
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
