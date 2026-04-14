import { CSS_MARKER_START, CSS_MARKER_END } from "../constants";

/** Generate RTL CSS for auto-detect mode (per-bubble). */
export function generateRtlCss(): string {
  return `
${CSS_MARKER_START}

/* Auto RTL: applied per-bubble when Hebrew/Arabic detected */
.rtl-auto[class*="timelineMessage_"],
.rtl-auto[class*="userMessage_"],
.rtl-auto[class*="userMessageContainer_"],
.rtl-auto[class*="questionsContainer_"],
.rtl-auto[class*="questionBlock_"] {
  direction: rtl;
  unicode-bidi: plaintext;
  text-align: right;
  max-width: 100%;
  overflow-x: hidden;
}

/* AskUser tool: keep inner question/option text RTL even though they sit
   inside a toolUse wrapper (which is normally forced LTR below) */
.rtl-auto [class*="questionText_"],
.rtl-auto [class*="questionTextLarge_"],
.rtl-auto [class*="questionHeader_"],
.rtl-auto [class*="questionItem_"],
.rtl-auto [class*="answerText_"],
.rtl-auto [class*="optionText_"],
.rtl-auto [class*="optionLabel_"],
.rtl-auto [class*="optionDescription_"],
.rtl-auto [class*="optionContent_"],
.rtl-auto [class*="options_"],
.rtl-auto [class*="optionsContainer_"] {
  direction: rtl !important;
  unicode-bidi: plaintext !important;
  text-align: right !important;
}

.rtl-auto p,
.rtl-auto li,
.rtl-auto span,
.rtl-auto h1, .rtl-auto h2, .rtl-auto h3,
.rtl-auto h4, .rtl-auto h5, .rtl-auto h6 {
  direction: rtl;
  unicode-bidi: plaintext;
  text-align: right;
}

/* LTR overrides: code, tools, thinking, permissions stay LTR */
.rtl-auto pre, .rtl-auto code {
  direction: ltr !important;
  unicode-bidi: isolate !important;
  text-align: left !important;
}

.rtl-auto [class*="toolUse_"],
.rtl-auto [class*="toolSummary_"],
.rtl-auto [class*="toolBody_"],
.rtl-auto [class*="toolName_"],
.rtl-auto [class*="toolAnnotation_"] {
  direction: ltr !important;
  unicode-bidi: isolate !important;
  text-align: left !important;
}

.rtl-auto [class*="thinking_"],
.rtl-auto [class*="thinkingContent_"],
.rtl-auto [class*="thinkingSummary_"] {
  direction: ltr !important;
  unicode-bidi: isolate !important;
  text-align: left !important;
}

.rtl-auto [class*="permissionRequest"] {
  direction: ltr !important;
  unicode-bidi: isolate !important;
  text-align: left !important;
}

.rtl-auto [class*="slashCommand"] {
  direction: ltr !important;
  unicode-bidi: isolate !important;
  text-align: left !important;
}

.rtl-auto [class*="diffEditor"] {
  direction: ltr !important;
}

.rtl-auto [class*="todoList"] {
  direction: ltr !important;
  text-align: left !important;
}


${CSS_MARKER_END}`;
}
