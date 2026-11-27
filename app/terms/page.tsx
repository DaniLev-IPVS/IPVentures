import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use — IP Ventures",
  description: "The terms for using ipventures.io.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="November 27, 2026">
      <p>
        These terms cover your use of ipventures.io, run by IP House Corp, trading as IP Ventures (“we”, “us”). By
        using the site you agree to them.
      </p>

      <h2>Using the site</h2>
      <p>
        You may browse the site and contact us through it. Please don’t misuse it: no attempts to break, overload
        or gain unauthorized access to it, and no sending spam or unlawful content through the contact form.
      </p>

      <h2>Our content</h2>
      <p>
        The text, design, logos, characters and other material on this site belong to IP Ventures or its ventures
        and partners, and are protected by intellectual property laws. You may not copy or reuse them without our
        written permission.
      </p>

      <h2>Other sites</h2>
      <p>
        The site links to our ventures’ own websites and other sites. Those sites have their own terms and
        policies, and we aren’t responsible for their content.
      </p>

      <h2>No guarantees</h2>
      <p>
        The site is provided as is, for general information. Nothing on it is an offer, investment advice or a
        promise of any result. To the extent the law allows, we aren’t liable for losses arising from your use of
        the site.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the State of Florida, United States.</p>

      <h2>Changes</h2>
      <p>We may update these terms; the date at the top shows the latest version.</p>
    </LegalPage>
  );
}
