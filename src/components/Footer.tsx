import { Heart, Twitter, Github, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const product = ["Features", "Pricing", "Integrations", "Changelog"];
const resources = ["Documentation", "Tutorials", "Blog", "Support"];
const company = ["About", "Careers", "Contact", "Partners"];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/5 bg-white px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-start">
          {/* Left: Logo + description + social */}
          <div>
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
              <span className="font-display text-lg font-bold text-zinc-900">MalluCupid</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-zinc-600">
              MalluCupid empowers creators to sell digital content — eBooks, guides, templates and more. Build your audience, sell securely, and get paid.
            </p>

            <div className="mt-4 flex items-center gap-3 text-zinc-500">
              <a aria-label="twitter" href="#" className="hover:text-zinc-900"><Twitter className="h-5 w-5"/></a>
              <a aria-label="instagram" href="#" className="hover:text-zinc-900"><Instagram className="h-5 w-5"/></a>
              <a aria-label="github" href="#" className="hover:text-zinc-900"><Github className="h-5 w-5"/></a>
              <a aria-label="linkedin" href="#" className="hover:text-zinc-900"><Linkedin className="h-5 w-5"/></a>
            </div>
          </div>

          {/* Middle: columns */}
          <div className="grid grid-cols-2 gap-6 md:col-span-1 md:grid-cols-2 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Product</h3>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                {product.map((p) => <li key={p}><a href="#" className="hover:text-zinc-900">{p}</a></li>)}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Resources</h3>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                {resources.map((r) => <li key={r}><a href="#" className="hover:text-zinc-900">{r}</a></li>)}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Company</h3>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                {company.map((c) => <li key={c}><a href="#" className="hover:text-zinc-900">{c}</a></li>)}
              </ul>
            </div>
          </div>

          {/* Right: legal links & merchant box on larger screens */}
          <div className="flex flex-col justify-between">
            <div>
              <ul className="flex flex-wrap gap-4 text-sm text-zinc-600">
                <Link to="/privacy-policy" className="hover:text-zinc-900">Privacy Policy</Link>
                <Link to="/terms-and-conditions" className="hover:text-zinc-900">Terms of Service</Link>
                <Link to="/refund-policy" className="hover:text-zinc-900">Refund Policy</Link>
                <Link to="/contact-us" className="hover:text-zinc-900">Contact</Link>
              </ul>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
              <div className="mb-2 font-semibold text-zinc-900">Merchant details</div>
              <div className="text-sm leading-6">
                <div><strong>Company:</strong> MALLU CUPID</div>
                <div><strong>Email:</strong> info@mallucupid.com</div>
                <div><strong>Mobile:</strong> +91 9746109569</div>
                <div><strong>Address:</strong> 46/A1, Aluva, Ernakulam, Kerala, India</div>
                <div className="mt-1 text-xs text-zinc-500">Payments processed via Razorpay</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-black/5 pt-6 text-sm text-zinc-500 md:flex-row md:items-center">
          <div>&copy; {new Date().getFullYear()} MalluCupid. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-zinc-900">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-zinc-900">Terms of Service</Link>
            <a href="#" className="hover:text-zinc-900">Cookies Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}