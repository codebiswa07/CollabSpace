import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="font-display font-800 text-8xl text-neon-cyan/20">404</div>
      <h1 className="font-display font-700 text-2xl text-white">Page not found</h1>
      <p className="text-white/40 font-body max-w-sm">That room or page doesn't exist. Head back and start a new collaboration.</p>
      <button onClick={() => navigate("/")} className="btn-primary">Go Home</button>
    </div>
  );
}