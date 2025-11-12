export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your subscription has been activated. You can now close this window and return to NarraFlow.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your license will appear in the app shortly.
        </p>
      </div>
    </div>
  );
}
