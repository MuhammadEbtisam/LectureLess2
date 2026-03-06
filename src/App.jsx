import React, { useState, useEffect } from 'react';
import {
  Zap,
  Youtube,
  FileText,
  BookOpen,
  ArrowRight,
  Download,
  RefreshCcw,
  AlertCircle,
  Loader2,
  Terminal,
  Key
} from 'lucide-react';

const SYSTEM_PROMPT = `# Role & Persona
You are **The Lecture Refactorer**. Your job is to take long, repetitive, and "noisy" academic lectures and refactor them into elegant, descriptive notes that follow a specific "geek-to-geek" style. You treat a lecture like a messy data dump that needs to be parsed, cleaned, and re-structured for a high-level student, while also covering the basics in detail.

# Tone & Style
- **Blunt & Analytical:** Cut through the teacher's "filler" and repetition.
- **Natural & Descriptive:** Write notes that "talk" to the reader. Use conversational, blunt language (e.g., "The teacher spent 20 minutes on this, but here’s the actual point...").
- **Logic-Heavy:** Focus on the "why" and "how." If the lecture skips a logical connection, you MUST "patch" it by explaining the missing link.
- **Direct and Organized:** use casual and direct tone but use textbook language and terminologies, and focus on the organizing and formatting the data and information, instead of writing plain paragraphs to explain something.
- **Emphasis on examples:** connect every topic to a clear and concise example to show how the topic actually works with real data(make examples, if the source material did not give any).

## Signal vs. Noise (The "Teacher's Glitch")
Identify where the lecture was confusing, circular, or logically broken or just repeating basic examples. Cut out the "noise" and provide the "Signal" (the clean version).

## The Technical Skeleton
Extract all essential equations, formulas, and diagrams. 
- Render all math in LaTeX (e.g., $$PV = nRT$$).
- For every equation, explain the "personality" of the variables—what happens to the system when one value shifts?

# Output Framework

## 1. The Background and Lore
Summarize the goal of the lecture in a few blunt sentences. What problem is this topic solving? what is the background of this field of study. If the teacher didn't explain the "why," you provide the "Logic Patch" here.

## 2. NOTES
Construct the proper detailed and formatted notes by following the structure below:

  ## [Main Subject Description]

### Full Breakdown & overview
* **List the topics discussed.**
    * [List] (approx timestamps if available, otherwise omit)

### Detailed Notes
* **Detailed notes on every topic discussed, format using markdown**
    * [Each_Topic_Notes]

### Key Vocabulary
* **[Term]**: [Definition]

### Formulas and Principles
* **[Formula/Principle Name]**: [Explanation]

### Teacher Insights
> **Tip**: [Insight Content]

### Exam Focus Points
* [Important Concept]

### Common Mistakes
* **[Mistake]**: [Explanation of why it's wrong]

### Summary & Quick Reference
* **Key Point**: [Text]
* **Short Trick**: [Text]
* **Must Remember**: [Text]

**OUTPUT**: Crystal clear, descriptive and formatted NOTES in natural language.

## 3. The Synthesis Check
End with one high-level question that tests if the user understands the *logic* of the refactored note, not just the data.

# Rules of Execution
- **No Fluff:** Do not include "In this lecture, the professor discusses..." Just give the notes.
- **Descriptive but Efficient:** Don't make them "short" just for the sake of it; make them as long as they need to be to be perfectly clear and "patch" all logical holes.
- **Independent Logic:** If the lecture is wrong or incomplete, you are authorized to use your internal knowledge to "fix" the logic for the user.`;

const App = () => {
  const [inputType, setInputType] = useState('topic');
  const [inputValue, setInputValue] = useState('');
  const [transcript, setTranscript] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStage, setLoadingStage] = useState('');
  const [apiKey, setApiKey] = useState('');

  const stages = [
    "Killing the filler...",
    "Patching logical holes...",
    "Extracting technical skeleton...",
    "Injecting geek vibe...",
    "Refactoring data dump..."
  ];

  // API Call logic
  const refactorLecture = async () => {
    if (!apiKey) {
      setError("Please provide your Gemini API Key first.");
      return;
    }
    if (!inputValue && !transcript) return;

    setLoading(true);
    setError(null);
    setOutput('');

    let interval = setInterval(() => {
      setLoadingStage(stages[Math.floor(Math.random() * stages.length)]);
    }, 2000);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const userQuery = inputType === 'topic'
      ? `Generate complete refactored notes for the topic: ${inputValue}. Use your internal high-level knowledge to provide a comprehensive breakdown as if I just watched a 1-hour deep-dive lecture.`
      : `Refactor the following lecture data: ${inputValue || ''} \n\n Transcript/Content: ${transcript}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    };

    const fetchWithRetry = async (retries = 0) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (response.status === 429 && retries < 5) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries + 1);
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      } catch (err) {
        if (err.message && !err.message.includes('API Error: 429') && !err.message.includes('API Error: 5')) {
          throw err;
        }
        if (retries < 5) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries + 1);
        }
        throw err;
      }
    };

    try {
      const result = await fetchWithRetry();
      setOutput(result);
    } catch (err) {
      setError(`Logic Failure: ${err.message || "The API choked on the noise."}`);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([output], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "refactored_notes.md";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="min-h-screen bg-[#0e1117] text-gray-200 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <Zap className="text-red-500 fill-red-500" size={32} />
              THE LECTURE REFACTORER
            </h1>
            <p className="text-gray-500 mt-1 uppercase tracking-widest text-xs font-bold">
              Turning messy data dumps into elegant logic.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400 font-mono">
              V2.5_FLASH_STABLE
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-[#1c2128] border-b border-gray-800 flex gap-2">
                <button
                  onClick={() => setInputType('topic')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${inputType === 'topic' ? 'bg-red-500 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                >
                  <BookOpen size={16} /> Topic
                </button>
                <button
                  onClick={() => setInputType('transcript')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${inputType === 'transcript' ? 'bg-red-500 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                >
                  <Terminal size={16} /> Raw Text
                </button>
                <button
                  onClick={() => setInputType('url')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${inputType === 'url' ? 'bg-red-500 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                >
                  <Youtube size={16} /> URL
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gemini API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 text-gray-500" size={16} />
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      className="w-full bg-[#0d1117] border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>

                {inputType === 'topic' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Thermodynamics, Quantum Mechanics..."
                      className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  </div>
                )}

                {inputType === 'url' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Video Link</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/..."
                      className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 mb-4"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Paste Transcript (Optional)</label>
                    <textarea
                      placeholder="Paste the raw text here for better patching..."
                      className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white h-48 focus:outline-none focus:border-red-500"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                  </div>
                )}

                {inputType === 'transcript' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Raw Lecture Content</label>
                    <textarea
                      placeholder="Paste your messy notes, transcript, or data dump here..."
                      className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white h-80 focus:outline-none focus:border-red-500 font-mono text-sm"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                  </div>
                )}

                <button
                  onClick={refactorLecture}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white font-black py-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {loadingStage}
                    </>
                  ) : (
                    <>
                      REFACTOR SIGNAL <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex gap-3">
                <AlertCircle className="text-yellow-500 shrink-0" size={18} />
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="text-gray-200 font-bold">Refactorer Logic:</span> I cut the fluff. If the teacher spent 30 minutes on a metaphor, I'll give you the formula and the "why" in 30 seconds. I'll also fix any logical errors using high-level knowledge.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-2xl h-full flex flex-col">
              <div className="p-4 bg-[#1c2128] border-b border-gray-800 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Output Terminal
                </span>
                {output && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Download size={14} /> EXPORT (.MD)
                  </button>
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto max-h-[700px] prose prose-invert prose-red max-w-none">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <Loader2 size={48} className="animate-spin text-red-500" />
                    <p className="font-mono text-sm animate-pulse">{loadingStage}</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg text-center">
                    <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                    <h3 className="text-red-500 font-bold mb-1">Logic Failure</h3>
                    <p className="text-sm text-gray-400">{error}</p>
                    <button
                      onClick={refactorLecture}
                      className="mt-4 text-xs font-bold underline text-red-400 hover:text-red-300"
                    >
                      RETRY REFACTOR
                    </button>
                  </div>
                ) : output ? (
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">
                    {output}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none py-20">
                    <Terminal size={64} className="mb-4" />
                    <p className="font-mono text-sm">System Idle. Waiting for messy data input...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;