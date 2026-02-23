import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#E8DDD0] py-8 bg-white">
      <div className="max-w-[1100px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/src/assets/logo.png" alt="RydeLy" className="h-8 w-8 object-contain" />
          <p className="font-malayalam text-xs text-gray-400">കേരളത്തിലെ ഓട്ടോ ഡയറക്ടറി</p>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/"         className="font-body text-sm text-[#7A7060] hover:text-[#E8751A] transition-colors">Home</Link>
          <Link to="/register" className="font-body text-sm text-[#7A7060] hover:text-[#E8751A] transition-colors">Register as Driver</Link>
          <Link to="/login"    className="font-body text-sm text-[#7A7060] hover:text-[#E8751A] transition-colors">Login</Link>
        </div>
        <p className="font-body text-xs text-[#7A7060]">© 2026 RydeLy. All rights reserved.</p>
      </div>
    </footer>
  );
}