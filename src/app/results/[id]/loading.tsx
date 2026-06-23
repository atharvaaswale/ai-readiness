export default function ResultsLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="animate-pulse space-y-8">
        <div className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </main>
  )
}
