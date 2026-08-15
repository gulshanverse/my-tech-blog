"use client";

import { FormEvent, useState } from "react";

type FormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type SubmissionState = "idle" | "loading" | "success" | "error";

const initialValues: FormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (!name) errors.name = "Please enter your name.";
  else if (name.length > 100) errors.name = "Please keep your name under 100 characters.";

  if (!email) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";

  if (values.subject.trim().length > 160) errors.subject = "Please keep the subject under 160 characters.";

  if (!message) errors.message = "Please add a message.";
  else if (message.length < 10) errors.message = "Please include a little more detail (at least 10 characters).";
  else if (message.length > 5000) errors.message = "Please keep your message under 5,000 characters.";

  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== "idle") {
      setStatus("idle");
      setStatusMessage("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setStatusMessage("");

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setStatusMessage("Please review the highlighted fields and try again.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "The message could not be sent right now.");
      }

      setStatus("success");
      setStatusMessage(result.message || "Message sent successfully. Thanks for reaching out!");
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "The message could not be sent right now.");
    }
  }

  const describedBy = (field: keyof FormValues) => errors[field] ? `${field}-error` : undefined;

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form-grid">
        <div className="form-field">
          <label htmlFor="contact-name">Name <span aria-hidden="true">*</span></label>
          <input id="contact-name" name="name" type="text" autoComplete="name" placeholder="Your name" value={values.name} onChange={(event) => updateField("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} />
          {errors.name && <p id="name-error" className="field-error" role="alert">{errors.name}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="contact-email">Email <span aria-hidden="true">*</span></label>
          <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="your@email.com" value={values.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} />
          {errors.email && <p id="email-error" className="field-error" role="alert">{errors.email}</p>}
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="contact-subject">Subject</label>
        <input id="contact-subject" name="subject" type="text" autoComplete="off" placeholder="What&apos;s this about?" value={values.subject} onChange={(event) => updateField("subject", event.target.value)} aria-invalid={Boolean(errors.subject)} aria-describedby={describedBy("subject")} />
        {errors.subject && <p id="subject-error" className="field-error" role="alert">{errors.subject}</p>}
      </div>
      <div className="form-field">
        <label htmlFor="contact-message">Message <span aria-hidden="true">*</span></label>
        <textarea id="contact-message" name="message" rows={7} placeholder="Your message..." value={values.message} onChange={(event) => updateField("message", event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={describedBy("message")} />
        {errors.message && <p id="message-error" className="field-error" role="alert">{errors.message}</p>}
      </div>
      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => updateField("website", event.target.value)} />
      </div>
      <div className="contact-submit-row">
        <button className="btn btn-gold" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Send Message"}
        </button>
        <p className={`form-status form-status--${status}`} role={status === "error" ? "alert" : undefined} aria-live="polite">
          {statusMessage}
        </p>
      </div>
    </form>
  );
}
