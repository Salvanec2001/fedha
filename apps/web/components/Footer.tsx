export default function Footer() {
  return (
    <footer className="border-t bg-white mt-12">
      <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-gray-500">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-6">
          <div>
            <p className="font-bold text-fedha-navy">Fedha</p>
            <p className="text-xs mt-1">Your Money. Your Plan. Your Future.</p>
          </div>
          <div className="flex gap-8 flex-wrap">
            <div>
              <p className="font-medium text-gray-700 mb-1">Support</p>
              <a href="mailto:salvanec826@gmail.com" className="hover:text-fedha-navy">Contact</a>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          © 2026 Fedha. All rights reserved. Designed by Anectus Salvatory.
        </p>
      </div>
    </footer>
  );
}
