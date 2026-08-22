export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <p className="font-bold text-fedha-navy text-sm">Fedha</p>
            <p className="text-xs text-gray-500">Your Money. Your Plan. Your Future.</p>
          </div>
          <a href="mailto:salvanec826@gmail.com" className="text-xs text-gray-500 hover:text-fedha-navy">
            salvanec826@gmail.com
          </a>
        </div>
        <div className="border-t mt-4 pt-4">
          <p className="text-[11px] text-gray-400 text-center sm:text-left">
            © 2026 Fedha. All rights reserved. Designed by Anectus Salvatory.
          </p>
        </div>
      </div>
    </footer>
  );
}
