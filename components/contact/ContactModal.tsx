"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { contact } from "@/lib/content";
import styles from "./ContactModal.module.css";

export type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  /** Honeypot: hidden from people, filled by bots. */
  website?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Defaults to POST /api/contact. Throw to show the failure state. */
  submit?: (data: ContactPayload) => Promise<void>;
};

type Errors = Partial<Record<keyof ContactPayload, string>>;
type Status = "idle" | "sending" | "sent" | "failed";

const EMPTY: ContactPayload = { name: "", email: "", phone: "", reason: "", message: "", website: "" };

async function postContact(data: ContactPayload) {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`contact ${res.status}`);
}

function validate(d: ContactPayload): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = contact.errors.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = contact.errors.email;
  if (d.phone.replace(/\D/g, "").length < 7) e.phone = contact.errors.phone;
  if (!d.reason) e.reason = contact.errors.reason;
  return e;
}

export default function ContactModal({ open, onClose, submit = postContact }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false); // drives the exit animation
  const [data, setData] = useState<ContactPayload>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const dialog = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const uid = useId();

  useEffect(() => setMounted(true), []);

  // Open / close with an exit animation, and give focus back afterwards.
  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      setVisible(true);
      // On touch screens focus the dialog, not the first field, so the
      // keyboard waits until you tap a field and the whole form stays readable.
      const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      requestAnimationFrame(() => {
        const el = touch ? dialog.current : dialog.current?.querySelector<HTMLElement>("input");
        el?.focus({ preventScroll: true });
      });
    } else if (visible) {
      const t = setTimeout(() => {
        setVisible(false);
        if (status === "sent") {
          setData(EMPTY);
          setStatus("idle");
        }
        lastFocus.current?.focus?.();
      }, 380);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Esc closes; Tab stays inside the window.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !dialog.current) return;
      const f = dialog.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input, textarea, [tabindex]:not([tabindex='-1'])",
      );
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = (k: keyof ContactPayload) => (v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      const firstKey = Object.keys(found)[0];
      dialog.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      await submit({ ...data, name: data.name.trim(), email: data.email.trim() });
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  if (!mounted || (!open && !visible)) return null;

  const first = data.name.trim().split(/\s+/)[0] || "there";
  const err = (k: keyof ContactPayload) =>
    errors[k] ? (
      <span id={`${uid}-${k}-err`} className={styles.error} role="alert">
        {errors[k]}
      </span>
    ) : null;

  return createPortal(
    <div
      className={`${styles.backdrop} ${open ? styles.in : styles.out}`}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialog}
        className={styles.window}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
      >
        <span className={styles.sheen} aria-hidden="true" />
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        {status === "sent" ? (
          <div className={styles.done}>
            <div className={styles.check} aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" />
                <path d="M14 25l7 7 13-15" />
              </svg>
            </div>
            <h2 id={`${uid}-title`} className={styles.title}>{contact.success.title}</h2>
            <p className={styles.sub}>{contact.success.body(first)}</p>
            <button className={styles.ghost} onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <p className={styles.eyebrow}>{contact.eyebrow}</p>
            <h2 id={`${uid}-title`} className={styles.title}>{contact.title}</h2>
            <p className={styles.sub}>{contact.sub}</p>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>{contact.fields.name.label}</span>
                <input
                  data-field="name"
                  className={styles.input}
                  autoComplete="name"
                  placeholder={contact.fields.name.placeholder}
                  value={data.name}
                  onChange={(e) => set("name")(e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? `${uid}-name-err` : undefined}
                />
                {err("name")}
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{contact.fields.phone.label}</span>
                <input
                  data-field="phone"
                  className={styles.input}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={contact.fields.phone.placeholder}
                  value={data.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? `${uid}-phone-err` : undefined}
                />
                {err("phone")}
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>{contact.fields.email.label}</span>
              <input
                data-field="email"
                className={styles.input}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={contact.fields.email.placeholder}
                value={data.email}
                onChange={(e) => set("email")(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? `${uid}-email-err` : undefined}
              />
              {err("email")}
            </label>

            <fieldset className={styles.field}>
              <legend className={styles.label}>{contact.fields.reason.label}</legend>
              <div className={styles.chips} role="radiogroup">
                {contact.reasons.map((r, i) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    data-field={i === 0 ? "reason" : undefined}
                    aria-checked={data.reason === r}
                    className={`${styles.chip} ${data.reason === r ? styles.chipOn : ""}`}
                    onClick={() => set("reason")(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {err("reason")}
            </fieldset>

            <label className={styles.field}>
              <span className={styles.label}>{contact.fields.message.label}</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                rows={3}
                placeholder={contact.fields.message.placeholder}
                value={data.message}
                onChange={(e) => set("message")(e.target.value)}
              />
            </label>

            <input
              className={styles.trap}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={data.website ?? ""}
              onChange={(e) => set("website")(e.target.value)}
            />

            {status === "failed" && (
              <p className={styles.failed} role="alert">
                Something went wrong. Try again, or email us at{" "}
                <a href={`mailto:${contact.email}`}>{contact.email}</a>.
              </p>
            )}

            <button className={styles.submit} type="submit" disabled={status === "sending"}>
              {status === "sending" ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  {contact.sending}
                </>
              ) : (
                contact.submit
              )}
            </button>
            <p className={styles.fine}>
              We only use this to reply to you. See our <a href="/privacy">Privacy Policy</a>.
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
