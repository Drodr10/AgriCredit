import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-green-800 mb-4">AgriCredit</h1>
        <p className="text-xl text-green-700 mb-8">
          AI-powered financial forecasting and credit access tailored for the
          next generation of global agriculture.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/api/"
            className="rounded-lg border border-green-300 bg-white px-6 py-4 text-green-800 shadow-sm hover:bg-green-100 transition-colors"
          >
            <h2 className="text-lg font-semibold mb-1">API Health</h2>
            <p className="text-sm text-green-600">
              Check the FastAPI backend status via the proxy route.
            </p>
          </Link>
          <Link
            href="/api/docs"
            className="rounded-lg border border-green-300 bg-white px-6 py-4 text-green-800 shadow-sm hover:bg-green-100 transition-colors"
          >
            <h2 className="text-lg font-semibold mb-1">API Docs</h2>
            <p className="text-sm text-green-600">
              Explore the interactive Swagger UI documentation.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
