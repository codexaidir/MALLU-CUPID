import { LegalPageLayout } from "../components/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      intro="These Terms and Conditions govern your access to and use of MalluCupid, including all services, features, digital products, purchases, and transactions available through our platform."
    >
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">1. Acceptance of Terms</h2>
        <p>
          By accessing or using MalluCupid, you acknowledge that you have read, understood, and agree to be legally bound by these Terms and Conditions, our Privacy Policy, Refund Policy, and all other policies published on the platform. If you do not agree with these Terms, you must immediately discontinue using our services.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">2. Definitions</h2>
        <p>
          "MalluCupid", "Platform", "we", "our", and "us" refer to MalluCupid and its services. "User" means any individual accessing or using the platform. "Creator" means a user who publishes digital products for sale. "Buyer" means a user who purchases digital products. "Digital Products" include software, source code, templates, graphics, documents, e-books, courses, downloadable files, and other digital content made available through the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">3. Eligibility</h2>
        <p>
          You must be at least 18 years of age and legally capable of entering into a binding agreement under applicable law. By using MalluCupid, you represent and warrant that all information provided during registration is accurate, complete, and up to date.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">4. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities performed under your account. You agree not to share your account with others. MalluCupid reserves the right to suspend or terminate accounts containing false information or those found to be in violation of these Terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">5. Account Security</h2>
        <p>
          You are solely responsible for protecting your login credentials. Any unauthorized access, suspected security breach, or misuse of your account must be reported to MalluCupid immediately. We shall not be liable for losses resulting from unauthorized use of your account due to your failure to maintain its security.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">6. Platform Services</h2>
        <p>
          MalluCupid provides an online marketplace where creators can publish and sell digital products while buyers can securely browse and purchase those products. We reserve the right to modify, improve, suspend, or discontinue any feature or service without prior notice.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">7. Digital Product Marketplace</h2>
        <p>
          All products available through MalluCupid are delivered digitally. No physical products are shipped. Product descriptions, pricing, previews, licensing terms, and content are provided by creators, who are solely responsible for the legality, ownership, and accuracy of their listings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">8. Creator Obligations</h2>
        <p>
          Creators must own or possess all necessary rights, licenses, and permissions to sell their digital products. Creators shall not publish pirated, copyrighted without authorization, illegal, malicious, misleading, fraudulent, or infringing content. MalluCupid reserves the right to remove any listing that violates these Terms or applicable law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">9. Buyer Obligations</h2>
        <p>
          Buyers agree to use purchased digital products only in accordance with the license granted by the creator. Buyers shall not redistribute, resell, reproduce, modify, reverse engineer, share, or commercially exploit purchased content unless expressly permitted by the applicable license or law.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">10. Prohibited Activities</h2>
        <p>
          Users shall not engage in fraudulent transactions, payment abuse, money laundering, copyright infringement, uploading malicious software, account sharing, impersonation, automated scraping, hacking, reverse engineering, or any activity that violates applicable laws or interferes with the security, integrity, or operation of the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">11. Payments via Razorpay</h2>
        <p>
          All payments on MalluCupid are securely processed through Razorpay Software Private Limited. By completing a purchase, you authorize Razorpay to process your selected payment method. MalluCupid does not store complete debit card, credit card, CVV, UPI PIN, or banking credentials. Transactions are subject to successful authorization by Razorpay and the respective financial institution.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">12. Taxes (GST)</h2>
        <p>
          All prices displayed on the platform are subject to applicable Goods and Services Tax (GST) and other taxes as required under Indian law. Users are responsible for complying with all applicable tax obligations arising from purchases or sales conducted through the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">13. Contact Information</h2>
        <p>
          For customer support, payment assistance, legal notices, or policy-related inquiries, please contact us at <strong>support@mallucupid.com</strong>. We will make reasonable efforts to respond to legitimate inquiries as quickly as possible.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">14. Effective Date / Last Updated</h2>
        <p>
          These Terms and Conditions are effective immediately upon publication and remain in force until amended or replaced. MalluCupid reserves the right to modify these Terms at any time. Continued use of the platform after any changes constitutes your acceptance of the revised Terms and Conditions.
        </p>
      </section>
    </LegalPageLayout>
  );
}