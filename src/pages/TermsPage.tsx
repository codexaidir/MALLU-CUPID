import { LegalPageLayout } from "../components/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      intro="These terms govern your use of MalluCupid and the services we provide for creators and buyers of digital content."
    >
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">1. Acceptance of Terms</h2>
        <p>By using MalluCupid, you agree to these Terms and Conditions and any policies linked here. If you do not agree, you should not use the platform.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">2. Platform Use</h2>
        <p>MalluCupid is a content selling platform for digital works, e-books, and related creator products. Users must provide accurate information and use the platform lawfully.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">3. Creator and Buyer Responsibilities</h2>
        <p>Creators are responsible for the authenticity, legality, and quality of their offerings. Buyers must use purchased content responsibly and respect copyright and usage terms.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">4. Payments and Transactions</h2>
        <p>Payments are processed securely through Razorpay. MalluCupid may collect transaction information required to complete purchases and provide support.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">5. Limitation of Liability</h2>
        <p>MalluCupid is not liable for indirect, incidental, or consequential damages arising from your use of the platform, except where prohibited by law.</p>
      </section>
    </LegalPageLayout>
  );
}
