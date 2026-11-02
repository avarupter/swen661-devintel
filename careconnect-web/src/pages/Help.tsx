import ChatBot from '../components/ChatBot';

export default function Help() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          Help
        </h1>

        <p className="mt-1 text-neutral-500">
          Find CareConnect features or ask
          the CareConnect Assistant for help.
        </p>
      </div>

      <ChatBot variant="embedded" />
    </div>
  );
}