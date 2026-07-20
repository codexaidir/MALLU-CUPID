import { LegalPageLayout } from "../components/LegalPageLayout";

export default function ContactUsPage() {
  return (
    <LegalPageLayout
      title="Contact Us"
      intro="We're here to assist you with account-related queries, payments, refunds, digital product purchases, technical support, and general inquiries."
    >
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Business Information</h2>
        <ul className="space-y-2 text-zinc-700">
          <li><strong>Business Name:</strong> MALLU CUPID</li>
          <li><strong>Email:</strong> info@mallucupid.com</li>
          <li><strong>Mobile:</strong> +91 9746109569</li>
          <li><strong>Registered Address:</strong> 46/A1, Aluva, Ernakulam, Kerala, India</li>
          <li><strong>Business Type:</strong> Digital Products Marketplace</li>
          <li><strong>Services:</strong> Online marketplace for digital products including software, templates, source code, graphics, documents, e-books, courses, and other downloadable digital content.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Customer Support</h2>
        <p>
          For assistance regarding your account, payments, refunds, purchased digital products, order status, technical issues, or general support, please contact us using the details above. We aim to respond to all genuine inquiries as quickly as possible during our business hours.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Payments</h2>
        <p>
          All online payments on MalluCupid are securely processed through Razorpay Software Private Limited. If you experience any payment-related issues, duplicate transactions, or failed payments, please contact us before initiating a chargeback with your bank or payment provider so we can investigate and resolve the matter promptly.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Legal & Compliance</h2>
        <p>
          All legal notices, compliance requests, copyright concerns, privacy-related inquiries, and policy questions may be submitted using the contact details provided above. We are committed to addressing all legitimate requests in accordance with applicable laws and our published policies.
        </p>
      </section>
    </LegalPageLayout>
  );
}