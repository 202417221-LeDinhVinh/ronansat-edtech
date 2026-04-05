"use client";

import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { FileText, Plus } from "lucide-react";

import api from "@/lib/axios";
import { API_PATHS } from "@/lib/apiPaths";

type CreateTestFormState = {
  title: string;
};

export default function CreateTestForm({ onSuccess }: { onSuccess: () => void }) {
  const [testForm, setTestForm] = useState<CreateTestFormState>({
    title: "",
  });
  const [testMessage, setTestMessage] = useState("");

  const handleCreateTest = async (event: FormEvent) => {
    event.preventDefault();
    setTestMessage("");

    try {
      const res = await api.post(API_PATHS.TESTS, {
        title: testForm.title,
        sections: [
          { name: "Reading and Writing", questionsCount: 27, timeLimit: 32 },
          { name: "Math", questionsCount: 22, timeLimit: 35 },
        ],
      });

      if (res.status === 200 || res.status === 201) {
        setTestMessage("Test created successfully!");
        setTestForm({ title: "" });
        onSuccess();
      } else {
        setTestMessage(`Error: ${String(res.data?.error || "Error creating test.")}`);
      }
    } catch (error: unknown) {
      console.error(error);
      const axiosError = error as AxiosError<{ error?: string }>;
      setTestMessage(axiosError.response?.data?.error || "Network error");
    }
  };

  return (
    <div className="lg:col-span-1 space-y-8">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-100 flex items-center gap-2 text-slate-800 font-bold">
          <FileText className="w-5 h-5 text-blue-600" />
          Step 1: Create Test
        </div>

        <form className="p-5 space-y-5" onSubmit={handleCreateTest}>
          {testMessage && (
            <div
              className={`p-3 rounded-lg font-medium text-sm ${
                testMessage.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {testMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Test Title</label>
            <input
              type="text"
              required
              value={testForm.title}
              onChange={(event) => setTestForm({ title: event.target.value })}
              placeholder="e.g. Official Practice Test 1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Create Test
          </button>
        </form>
      </div>
    </div>
  );
}
