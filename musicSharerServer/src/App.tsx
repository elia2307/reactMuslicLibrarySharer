import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";


import { useRef, type FormEvent } from "react";

export function APITester() {
  const responseInputRef = useRef<HTMLTextAreaElement>(null);

  const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const endpoint = formData.get("endpoint") as string;
      const url = new URL(endpoint, location.href);
      const method = formData.get("method") as string;
      const res = await fetch(url, { method });

      const data = await res.json();
      responseInputRef.current!.value = JSON.stringify(data, null, 2);
    } catch (error) {
      responseInputRef.current!.value = String(error);
    }
  };

  return (
    <div className="api-tester">
      <form onSubmit={testEndpoint} className="endpoint-row">
        <select name="method" className="method">
          <option value="GET">GET</option>
          <option value="PUT">PUT</option>
        </select>
        <input type="text" name="endpoint" defaultValue="/api/listFiles/original" className="url-input" placeholder="/api/listFiles/original" />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
      <textarea ref={responseInputRef} readOnly placeholder="Response will appear here..." className="response-area" />
    </div>
  );
}

export function App() {
  return (
    <div className="app">
      <div className="logo-container">
        <img src={logo} alt="Bun Logo" className="logo bun-logo" />
        <img src={reactLogo} alt="React Logo" className="logo react-logo" />
      </div>

      <h1>Bun + React</h1>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
      <APITester />
    </div>
  );
}

export default App;
