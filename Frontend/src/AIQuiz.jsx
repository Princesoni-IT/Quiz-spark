// Frontend/src/AIQuiz.jsx

import React, { useState } from "react";
import axios from "axios";

const AIQuiz = ({ onQuizCreated, onBack, onAuthError, onPracticeNow }) => {
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1); // 1: Choose method, 2: Generate, 3: Preview
  const [activeTab, setActiveTab] = useState("topic"); // 'topic' or 'syllabus'

  // Topic-based generation
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(10);

  // Syllabus-based generation
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [topicsFromSyllabus, setTopicsFromSyllabus] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Generated questions
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to handle authentication errors
  const handleAuthError = (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
      if (onAuthError) {
        onAuthError();
      }
      return true;
    }
    return false;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSyllabusFile(file);
  };

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }
    setIsLoading(true);
    setCurrentStep(2);
    setGeneratedQuestions([]);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/generate-from-topic`,
        {
          topic,
          numQuestions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedQuestions(response.data.questions);
      setCurrentStep(3); // Move to preview step
    } catch (error) {
      if (!handleAuthError(error)) {
        alert("Failed to generate questions. Please try again.");
        console.error(error);
      }
    }
    setIsLoading(false);
  };

  const handleUploadSyllabus = async () => {
    if (!syllabusFile) {
      alert("Please upload a syllabus file.");
      return;
    }
    setIsLoading(true);
    setTopicsFromSyllabus([]);
    const formData = new FormData();
    formData.append("syllabus", syllabusFile);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/extract-topics`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTopicsFromSyllabus(response.data.topics);
      setCurrentStep(2); // Move to topic selection step
    } catch (error) {
      if (!handleAuthError(error)) {
        alert("Failed to extract topics. Please try again.");
        console.error(error);
      }
    }
    setIsLoading(false);
  };

  const handleGenerateFromSyllabus = async () => {
    if (selectedTopics.length === 0) {
      alert("Please select at least one topic.");
      return;
    }
    setIsLoading(true);
    setGeneratedQuestions([]);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/ai/generate-from-topic`,
        {
          topic: selectedTopics.join(", "),
          numQuestions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedQuestions(response.data.questions);
      setCurrentStep(3); // Move to preview step
    } catch (error) {
      if (!handleAuthError(error)) {
        alert("Failed to generate questions. Please try again.");
        console.error(error);
      }
    }
    setIsLoading(false);
  };

  const handleBackToStart = () => {
    setCurrentStep(1);
    setTopic("");
    setSyllabusFile(null);
    setTopicsFromSyllabus([]);
    setSelectedTopics([]);
    setGeneratedQuestions([]);
  };

  const handleTopicSelection = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleBackNavigation = () => {
    handleBackToStart();
    if (onBack) {
      onBack();
    }
  };

  const getRangeProgress = (value, min, max) =>
    ((value - min) / (max - min)) * 100;

  const stepsMeta = [
    {
      id: 1,
      title: "Input Source",
      description: "Choose a topic or upload a syllabus",
    },
    {
      id: 2,
      title: "AI Processing",
      description: "Fine-tune rules & let AI curate",
    },
    {
      id: 3,
      title: "Review & Publish",
      description: "Validate, export or launch the quiz",
    },
  ];

  const getStepState = (stepId) => {
    if (currentStep > stepId) return "complete";
    if (currentStep === stepId) return "current";
    return "upcoming";
  };

  const quizTitle = topic || selectedTopics.join(", ") || "Untitled Quiz";
  const hasPreview = generatedQuestions.length > 0;

  const downloadCSV = () => {
    const csvRows = [
      ["Question", "Option1", "Option2", "Option3", "Option4", "CorrectAnswer"],
    ];
    generatedQuestions.forEach((q) => {
      csvRows.push([
        `"${q.text.replace(/"/g, '""')}"`,
        `"${q.options[0].replace(/"/g, '""')}"`,
        `"${q.options[1].replace(/"/g, '""')}"`,
        `"${q.options[2].replace(/"/g, '""')}"`,
        `"${q.options[3].replace(/"/g, '""')}"`,
        q.correctAnswerIndex + 1,
      ]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quiz_questions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startQuizNow = async () => {
    try {
      const token = localStorage.getItem("token");
      const quizTitle = topic || selectedTopics.join(", ");

      console.log("Creating quiz...");
      const createQuizResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/quizzes/create`,
        {
          title: `AI Quiz: ${quizTitle.substring(0, 40)}`,
          description: "Generated by AI",
          numQuestions: generatedQuestions.length,
          timePerQuestion: timePerQuestion,
          pointsPerQuestion: pointsPerQuestion,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newQuiz = createQuizResponse.data.quiz;
      console.log("Quiz created:", newQuiz._id);

      console.log("Adding questions...");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/quizzes/${newQuiz._id}/questions`,
        {
          questions: generatedQuestions,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Questions added successfully");

      // Fetch the complete quiz with questions
      console.log("Fetching complete quiz...");
      const completeQuizResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/quizzes/${newQuiz._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Complete quiz fetched:", completeQuizResponse.data);

      alert("AI Quiz created successfully! Redirecting to dashboard...");
      onQuizCreated(completeQuizResponse.data);
    } catch (error) {
      console.error("Error in startQuizNow:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      if (!handleAuthError(error)) {
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          "Failed to start the quiz.";
        alert(`Failed to start the quiz: ${errorMsg}`);
      }
    }
  };

  const handlePracticeNow = () => {
    // Create a temporary quiz object for practice mode
    const practiceQuiz = {
      title: `Practice: ${topic || selectedTopics.join(", ")}`,
      questions: generatedQuestions,
      settings: {
        timePerQuestion: timePerQuestion,
        pointsPerQuestion: pointsPerQuestion,
      },
    };
    onPracticeNow(practiceQuiz);
  };

  return (
    <section className="aiquiz-page">
      <div className="aiquiz-container">
        <header className="aiquiz-header">
          <div className="aiquiz-header-text">
            <button
              type="button"
              className="aiquiz-back-btn"
              onClick={handleBackNavigation}
            >
              <span aria-hidden="true">←</span>
              Back
            </button>
            <p className="aiquiz-kicker">AI Workspace</p>
            <h1>Quiz generation without the guesswork</h1>
            <p className="aiquiz-subtitle">
              Upload your syllabus or describe a topic, then calibrate
              difficulty, pacing and scoring before you export or publish.
            </p>
          </div>
          <div className="aiquiz-header-actions">
            <span className="aiquiz-status-chip">Step {currentStep} of 3</span>
            <button
              type="button"
              className="aiquiz-reset-btn"
              onClick={handleBackToStart}
            >
              Reset workflow
            </button>
          </div>
        </header>

        <div className="aiquiz-progress" role="list">
          {stepsMeta.map((step) => (
            <div
              key={step.id}
              className={`aiquiz-progress-item ${getStepState(step.id)}`}
              role="listitem"
            >
              <span className="aiquiz-progress-index">{step.id}</span>
              <div>
                <p className="aiquiz-progress-title">{step.title}</p>
                <p className="aiquiz-progress-desc">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="aiquiz-shell">
          <div className="aiquiz-card">
            <div
              className="aiquiz-tabs"
              role="tablist"
              aria-label="Generation method"
            >
              <button
                type="button"
                className={`aiquiz-tab ${
                  activeTab === "topic" ? "active" : ""
                }`}
                onClick={() => setActiveTab("topic")}
                role="tab"
                aria-selected={activeTab === "topic"}
              >
                Topic input
              </button>
              <button
                type="button"
                className={`aiquiz-tab ${
                  activeTab === "syllabus" ? "active" : ""
                }`}
                onClick={() => setActiveTab("syllabus")}
                role="tab"
                aria-selected={activeTab === "syllabus"}
              >
                Syllabus upload
              </button>
            </div>

            {activeTab === "topic" && (
              <div className="aiquiz-panel" role="tabpanel">
                <div className="aiquiz-field">
                  <label htmlFor="topic-input">Topic name</label>
                  <input
                    id="topic-input"
                    type="text"
                    placeholder="e.g. Metaverse security fundamentals"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="aiquiz-field">
                  <label htmlFor="topic-question-range">
                    Number of questions
                    <span className="aiquiz-metric">{numQuestions}</span>
                  </label>
                  <input
                    id="topic-question-range"
                    className="aiquiz-range"
                    type="range"
                    value={numQuestions}
                    min="5"
                    max="30"
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    style={{
                      "--progress": `${getRangeProgress(numQuestions, 5, 30)}%`,
                    }}
                  />
                  <div className="aiquiz-range-hint">
                    <span>5</span>
                    <span>30</span>
                  </div>
                </div>

                <div className="aiquiz-field">
                  <label htmlFor="topic-time-range">
                    Time per question
                    <span className="aiquiz-metric">{timePerQuestion}s</span>
                  </label>
                  <input
                    id="topic-time-range"
                    className="aiquiz-range"
                    type="range"
                    value={timePerQuestion}
                    min="10"
                    max="120"
                    step="5"
                    onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                    style={{
                      "--progress": `${getRangeProgress(
                        timePerQuestion,
                        10,
                        120
                      )}%`,
                    }}
                  />
                  <div className="aiquiz-range-hint">
                    <span>10s</span>
                    <span>120s (2 min)</span>
                  </div>
                </div>

                <div className="aiquiz-field">
                  <label htmlFor="topic-points-range">
                    Points per question
                    <span className="aiquiz-metric">{pointsPerQuestion}</span>
                  </label>
                  <input
                    id="topic-points-range"
                    className="aiquiz-range"
                    type="range"
                    value={pointsPerQuestion}
                    min="1"
                    max="20"
                    onChange={(e) =>
                      setPointsPerQuestion(Number(e.target.value))
                    }
                    style={{
                      "--progress": `${getRangeProgress(
                        pointsPerQuestion,
                        1,
                        20
                      )}%`,
                    }}
                  />
                  <div className="aiquiz-range-hint">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="aiquiz-primary-btn"
                  onClick={handleGenerateFromTopic}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="aiquiz-spinner" aria-hidden="true" />
                      Generating
                    </>
                  ) : (
                    "Generate questions"
                  )}
                </button>
              </div>
            )}

            {activeTab === "syllabus" && (
              <div className="aiquiz-panel" role="tabpanel">
                <div className="aiquiz-upload-area">
                  <div>
                    <p className="aiquiz-upload-title">Drag & drop or browse</p>
                    <p className="aiquiz-upload-sub">
                      Structured parsing for PDF, DOC/DOCX or TXT up to 10 MB.
                    </p>
                  </div>
                  <label className="aiquiz-upload-trigger">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                    />
                    Choose file
                  </label>
                  {syllabusFile && (
                    <p className="aiquiz-upload-file">{syllabusFile.name}</p>
                  )}
                </div>

                <button
                  type="button"
                  className="aiquiz-primary-btn ghost"
                  onClick={handleUploadSyllabus}
                  disabled={isLoading || !syllabusFile}
                >
                  {isLoading ? "Extracting topics…" : "Extract topics"}
                </button>

                {topicsFromSyllabus.length > 0 && (
                  <div className="aiquiz-topics">
                    <div className="aiquiz-topics-head">
                      <div>
                        <p className="aiquiz-topics-title">
                          Select topics to include
                        </p>
                        <p className="aiquiz-topics-desc">
                          Choose the sections you want the AI to prioritise.
                        </p>
                      </div>
                      <span className="aiquiz-topic-count">
                        {selectedTopics.length} selected
                      </span>
                    </div>

                    <div className="aiquiz-topic-list">
                      {topicsFromSyllabus.map((topicItem, index) => (
                        <label
                          key={`${topicItem}-${index}`}
                          className={`aiquiz-topic-row ${
                            selectedTopics.includes(topicItem) ? "selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTopics.includes(topicItem)}
                            onChange={() => handleTopicSelection(topicItem)}
                          />
                          <span>{topicItem}</span>
                        </label>
                      ))}
                    </div>

                    <div className="aiquiz-grid-inline">
                      <div className="aiquiz-field compact">
                        <label htmlFor="syllabus-question-range">
                          Number of questions
                          <span className="aiquiz-metric">{numQuestions}</span>
                        </label>
                        <input
                          id="syllabus-question-range"
                          className="aiquiz-range"
                          type="range"
                          value={numQuestions}
                          min="5"
                          max="30"
                          onChange={(e) =>
                            setNumQuestions(Number(e.target.value))
                          }
                          style={{
                            "--progress": `${getRangeProgress(
                              numQuestions,
                              5,
                              30
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="aiquiz-field compact">
                        <label htmlFor="syllabus-time-range">
                          Time per question
                          <span className="aiquiz-metric">
                            {timePerQuestion}s
                          </span>
                        </label>
                        <input
                          id="syllabus-time-range"
                          className="aiquiz-range"
                          type="range"
                          value={timePerQuestion}
                          min="10"
                          max="120"
                          step="5"
                          onChange={(e) =>
                            setTimePerQuestion(Number(e.target.value))
                          }
                          style={{
                            "--progress": `${getRangeProgress(
                              timePerQuestion,
                              10,
                              120
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="aiquiz-field compact">
                        <label htmlFor="syllabus-points-range">
                          Points per question
                          <span className="aiquiz-metric">
                            {pointsPerQuestion}
                          </span>
                        </label>
                        <input
                          id="syllabus-points-range"
                          className="aiquiz-range"
                          type="range"
                          value={pointsPerQuestion}
                          min="1"
                          max="20"
                          onChange={(e) =>
                            setPointsPerQuestion(Number(e.target.value))
                          }
                          style={{
                            "--progress": `${getRangeProgress(
                              pointsPerQuestion,
                              1,
                              20
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="aiquiz-primary-btn"
                      onClick={handleGenerateFromSyllabus}
                      disabled={isLoading || selectedTopics.length === 0}
                    >
                      {isLoading
                        ? "Generating…"
                        : `Generate ${selectedTopics.length || ""} topic set`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className={`aiquiz-preview ${hasPreview ? "active" : ""}`}>
            {hasPreview ? (
              <div>
                <div className="aiquiz-preview-head">
                  <div>
                    <p className="aiquiz-preview-kicker">Draft quiz</p>
                    <h2>{quizTitle}</h2>
                    <p className="aiquiz-preview-meta">
                      {generatedQuestions.length} questions • {timePerQuestion}
                      s/question • {pointsPerQuestion} pts each
                    </p>
                  </div>
                  <button
                    type="button"
                    className="aiquiz-ghost-btn"
                    onClick={downloadCSV}
                  >
                    Export CSV
                  </button>
                </div>

                <div className="aiquiz-preview-list">
                  {generatedQuestions.map((q, i) => (
                    <article key={i} className="aiquiz-question-card">
                      <header>
                        <span>{i + 1}</span>
                        <p>{q.text}</p>
                      </header>
                      <p className="aiquiz-answer">
                        Answer: {q.options[q.correctAnswerIndex]}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="aiquiz-actions">
                  <button
                    type="button"
                    className="aiquiz-ghost-btn"
                    onClick={handlePracticeNow}
                  >
                    Practice without saving
                  </button>
                  <button
                    type="button"
                    className="aiquiz-primary-btn secondary"
                    onClick={startQuizNow}
                  >
                    Publish to dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="aiquiz-empty">
                <p className="aiquiz-empty-title">Nothing to review yet</p>
                <p className="aiquiz-empty-desc">
                  Configure a topic or upload a syllabus to see AI drafts here.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default AIQuiz;
