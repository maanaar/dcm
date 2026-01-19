export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {/* Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md border shadow-lg rounded-xl p-8 z-10">
        <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

        <form className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-slate-800 text-white py-2 rounded-md hover:bg-slate-900 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
