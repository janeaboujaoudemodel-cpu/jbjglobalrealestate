import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { JBJ_CRM_MODULES, type JbjCrmSection } from "./jbjCrmConfig";

export default function JbjCrmModulePage() {
  const params = useParams();
  const activeSection = params.section as JbjCrmSection | undefined;
  const module = useMemo(
    () => JBJ_CRM_MODULES.find((m) => m.id === activeSection),
    [activeSection]
  );

  return (
    <section className="jbj-crm-stage" aria-label={module?.label ?? "Module"}>
      <div className="jbj-crm-stage-toolbar">
        <h1>{module?.label ?? "Module"}</h1>
      </div>
      <div className="jbj-crm-stage-canvas" />
    </section>
  );
}
        This module lives inside JBJ CRM. Start creating {label.toLowerCase()} or connect a source in Integrations.
      </p>
    </div>
  );
}
