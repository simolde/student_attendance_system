export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-lg border bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="mt-2 text-gray-600">
          You do not have permission to access this page.
        </p>
      </div>
    </div>
  );
}