import ChatPanel from "../components/ChatPanel";

function AssistantPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI assistant</h1>
          <p className="page-subtitle">
            Describe what you are after, or ask whether a listing is worth its
            asking price.
          </p>
        </div>
      </div>

      <ChatPanel />
    </div>
  );
}

export default AssistantPage;
