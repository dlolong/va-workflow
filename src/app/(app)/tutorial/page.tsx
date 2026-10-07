import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tutorial | VA Relay" };

const tutorialPdf = "/VA_Relay_User_Tutorial.pdf";

export default function TutorialPage() {
  return (
    <>
      <header className="page-intro">
        <div>
          <p className="eyebrow">Getting started</p>
          <h1>User tutorial</h1>
          <p>Learn how to use VA Relay with the step-by-step user guide.</p>
        </div>
        <div className="row">
          <a className="btn" href={tutorialPdf} target="_blank" rel="noopener noreferrer">
            Open PDF in new tab
          </a>
          <a className="btn primary" href={tutorialPdf} download>
            Download PDF
          </a>
        </div>
      </header>
      <p className="muted" style={{ marginBottom: 12 }}>
        If the preview is unavailable on your device, open or download the PDF above.
      </p>
      <iframe
        id="tutorial-pdf"
        title="VA Relay user tutorial PDF"
        src={`${tutorialPdf}#view=FitH`}
        style={{
          width: "100%",
          height: "75dvh",
          minHeight: 400,
          border: "1px solid var(--line)",
          borderRadius: 12,
        }}
      />
    </>
  );
}
