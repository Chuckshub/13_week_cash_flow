import CSVParserApp from '@/components/CSVParserApp';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">13-Week Cash Flow CSV Parser</h1>
        <p className="text-gray-600">
          Upload your bank CSV file and preview parsed JSON transactions for AI processing.
        </p>
        <CSVParserApp />
      </div>
    </main>
  );
}
