import { LegalPageLayout } from "../components/LegalPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      intro="We respect your privacy and explain how we collect, use, and protect your personal information."
    >
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">1. Information We Collect</h2>
        <p>We may collect your name, email address, phone number, billing details, and account activity data when you create an account, purchase content, or contact us.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">2. How We Use Your Information</h2>
        <p>Your information helps us provide account access, process payments, send notices, improve platform security, and deliver customer support.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">3. Sharing of Information</h2>
        <p>We may share limited information with service providers such as payment processors and email delivery services to operate the platform.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">4. Your Choices</h2>
        <p>You may update your account details or request deletion of personal information where applicable, subject to legal and operational requirements.</p>
      </section>
    </LegalPageLayout>
  );
}
