import { LegalPageLayout } from "../components/LegalPageLayout";

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      intro="Please review our refund policy before purchasing digital content on MalluCupid."
    >
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">1. Digital Products</h2>
        <p>Most digital content purchases are non-refundable once access has been provided, because the content is delivered immediately and cannot be returned.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">2. Exceptions</h2>
        <p>Refunds may be considered in cases of duplicate charges, failed payments, or technical issues that prevent access to the purchased content.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">3. Requesting a Refund</h2>
        <p>To request a refund, contact us with your order details, payment reference, and a brief explanation. We will review each request fairly and respond as quickly as possible.</p>
      </section>
    </LegalPageLayout>
  );
}
