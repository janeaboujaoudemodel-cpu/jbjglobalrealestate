import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface Ctx {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  toggle: () => void;
}

const ProjectEditModeContext = createContext<Ctx>({
  editMode: false,
  setEditMode: () => {},
  toggle: () => {},
});

/**
 * Controls the "one master pencil" behavior on the project page.
 * When `editMode` is off, all owner pencils across the project page are
 * hidden via a global CSS rule that targets `[data-owner-pencil]` under
 * `html[data-project-edit-mode="off"]`. When on, every pencil reappears
 * in its original position.
 */
export function ProjectEditModeProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.projectEditMode = editMode ? "on" : "off";
    return () => {
      delete html.dataset.projectEditMode;
    };
  }, [editMode]);

  return (
    <ProjectEditModeContext.Provider
      value={{ editMode, setEditMode, toggle: () => setEditMode((v) => !v) }}
    >
      {children}
    </ProjectEditModeContext.Provider>
  );
}

export const useProjectEditMode = () => useContext(ProjectEditModeContext);
