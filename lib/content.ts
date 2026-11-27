/**
 * Every piece of copy on the site, in one place (Step 2, approved 2026-11-27).
 * Change words here, not in the components.
 */

export const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "ventures", label: "Ventures" },
  { id: "team", label: "Team" },
  { id: "contact", label: "Contact" },
] as const;

export const hero = {
  headline: "Building the IPs of the future",
  cue: "Scroll to enter",
};

export const about = {
  eyebrow: "01 — About",
  headline: "We build the characters, channels and companies the internet can’t stop watching.",
  body:
    "IP Ventures is a venture studio for internet-native IP. We start companies, run them, and partner with the people who build them, across social media, animation and entertainment. Every venture runs with its own team. What they share is knowledge, know-how and resources, so every win makes the next one faster.",
  stats: [
    { value: 1, suffix: "B+", label: "views across our ventures" },
    { value: 1000, suffix: "+", label: "videos produced" },
    { value: 1, suffix: "M+", label: "followers grown" },
  ],
};

export type Venture = {
  id: "influity" | "ipanimations" | "ipstudios";
  name: string;
  tag: string;
  line: string;
  url: string;
  domain: string;
  /** Square-ish mark that floats inside the cube. */
  mark: string;
  /** Brand accent used for the glow on hover. */
  accent: string;
};

export const ventures = {
  eyebrow: "02 — Ventures",
  headline: "Three companies. One playbook.",
  sub: "Hover to look inside. Click to visit.",
  items: [
    {
      id: "influity",
      name: "Influity",
      tag: "Social growth",
      line: "Social accounts built around what your audience already loves, then pointed at your product.",
      url: "https://influity.ai",
      domain: "influity.ai",
      mark: "/ventures/influity-mark-white.svg",
      accent: "#ff7a1a",
    },
    {
      id: "ipanimations",
      name: "IP Animations",
      tag: "Animation studio",
      line: "Animations people want. Made by animators, built to get watched.",
      url: "https://ipanimations.ai",
      domain: "ipanimations.ai",
      mark: "/ventures/ipanimations-mark-paper.svg",
      accent: "#ffd23f",
    },
    {
      id: "ipstudios",
      name: "IP Studios",
      tag: "Entertainment",
      line: "Monetizing IP and scaling internet trends, starting with the universe of Italian brainrot.",
      url: "https://ipstudios.xyz",
      domain: "ipstudios.xyz",
      mark: "/ventures/ipstudios-monogram.svg",
      accent: "#e0457b",
    },
  ] satisfies Venture[],
};

export const team = {
  eyebrow: "03 — Team",
  headline: "Operators, not spectators.",
  body: "We’ve grown channels, characters and companies from zero. Now we do it on purpose.",
  people: [
    { name: "Dani Lev", role: "Co-founder & President", line: "Runs product and operations across the studio.", linkedin: "#", photo: null as string | null },
    { name: "Dan Rozenberg", role: "Co-founder", line: "Partnerships and growth. Opens the doors.", linkedin: "#", photo: null as string | null },
    { name: "Mike Nike", role: "Co-founder", line: "Characters and IP. Owns the cast.", linkedin: "#", photo: null as string | null },
  ],
};

export const footer = {
  headline: "Have an IP worth building?",
  second: "Let’s talk.",
  button: "Contact us",
  blurb: ["Building the IPs of the future.", "Miami, Florida."],
  columns: [
    { title: "Ventures", links: [
      { label: "Influity", href: "https://influity.ai" },
      { label: "IP Animations", href: "https://ipanimations.ai" },
      { label: "IP Studios", href: "https://ipstudios.xyz" },
    ] },
    { title: "Company", links: [
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Contact", href: "#contact-form" },
    ] },
  ],
  legal: "© 2026 IP Ventures. All rights reserved.",
  small: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "#contact-form" },
  ],
};

export const contact = {
  eyebrow: "Contact",
  title: "Let’s build something.",
  sub: "Tell us a little about you and we’ll get back to you soon.",
  fields: {
    name: { label: "Name", placeholder: "Jane Doe" },
    phone: { label: "Phone", placeholder: "+1 (555) 000-0000" },
    email: { label: "Email", placeholder: "jane@company.com" },
    reason: { label: "Reason for contact" },
    message: { label: "Message (optional)", placeholder: "Anything we should know?" },
  },
  reasons: ["Partnership", "Investing", "Work with a venture", "Press", "Careers", "Something else"],
  submit: "Send message",
  sending: "Sending…",
  fine: "We only use this to reply to you. See our Privacy Policy.",
  errors: {
    name: "Please add your name.",
    email: "That email doesn’t look right.",
    phone: "Please add a number we can reach you on.",
    reason: "Pick a reason so we can send you to the right person.",
  },
  success: { title: "Message received.", body: (first: string) => `Thanks, ${first}. We’ll be in touch soon.` },
  fail: "Something went wrong. Try again, or email us at info@ipventures.io.",
  email: "info@ipventures.io",
};
