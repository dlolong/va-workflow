import type { Workflow } from "@/lib/types";
import { Badge } from "./ui";
export function WorkflowRead({ flow }: { flow: Workflow }) {
  return (
    <div className="stack">
      <p className="muted">{flow.description}</p>
      <div className="text-block">{flow.sop || "No additional SOP text."}</div>
      <div className="grid-3">
        <div className="notice">
          <h3>Can do</h3>
          <p className="text-block">{flow.can_do || "Not specified"}</p>
        </div>
        <div className="notice warning">
          <h3>Ask first</h3>
          <p className="text-block">{flow.ask_first || "Not specified"}</p>
        </div>
        <div className="notice">
          <h3>Never do</h3>
          <p className="text-block">{flow.never_do || "Not specified"}</p>
        </div>
      </div>
      <div className="stack-sm">
        {flow.steps.map((s, i) => (
          <div key={s.id} className="step-details">
            <h3>
              {i + 1}. {s.title}
            </h3>
            <p className="text-block">{s.instructions}</p>
            <div className="row" style={{ marginTop: 8 }}>
              <Badge status={s.kind} />
              {s.required && <Badge status="required" />}
              {s.approval_before && <Badge status="permission first" />}
              {s.evidence !== "none" && <Badge status={`${s.evidence} evidence`} />}
            </div>
          </div>
        ))}
      </div>
      {flow.resources.length > 0 && (
        <div className="stack-sm">
          <h3>Resources</h3>
          {flow.resources.map((r, i) => (
            <a
              key={i}
              id={`resource-${i}`}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              {r.label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
