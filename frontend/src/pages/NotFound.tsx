import { useNavigate } from 'react-router-dom';
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="font-heading text-6xl font-extrabold text-orange">404</h1>
      <p className="font-body text-muted">Page not found</p>
      <button onClick={() => navigate('/')} className="btn-pill bg-[#0F0E0C] text-[#FDFAF4] mt-2">Go Home</button>
    </div>
  );
}