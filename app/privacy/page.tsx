import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — IP Ventures",
  description: "How IP Ventures handles the information you share with us.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 27, 2026">
      <p>
        This site is run by IP House Corp, trading as IP Ventures (“we”, “us”). This policy explains what we
        collect when you use ipventures.io and what we do with it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>What you send us.</strong> When you use the contact form we receive your name, email address,
          phone number, the reason you chose and any message you write.
        </li>
        <li>
          <strong>Basic technical data.</strong> Our hosting provider records standard server logs (such as IP
          address, browser type and pages requested) to keep the site running and secure.
        </li>
      </ul>
      <p>We don’t use advertising cookies or sell your information to anyone.</p>

      <h2>How we use it</h2>
      <p>
        We use the details you send only to reply to you and to follow up on your request, including passing it
        to the right person within IP Ventures or one of our ventures (Influity, IP Animations or IP Studios).
      </p>

      <h2>Who processes it</h2>
      <p>
        Form submissions are delivered to our inbox by an email service provider, and the site is hosted by a
        cloud hosting provider. They handle the data only to provide those services to us.
      </p>

      <h2>How long we keep it</h2>
      <p>We keep messages for as long as needed to handle your request and our ongoing relationship, then delete them.</p>

      <h2>Your choices</h2>
      <p>
        You can ask us to see, correct or delete the information you’ve sent us at any time by emailing{" "}
        <a href="mailto:info@ipventures.io">info@ipventures.io</a>.
      </p>

      <h2>Changes</h2>
      <p>If we change this policy we’ll update the date at the top of this page.</p>
    </LegalPage>
  );
}
