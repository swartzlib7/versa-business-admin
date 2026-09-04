/**
 * Sample organizing board — functions and departments transcribed from
 * docs/design/org_board/transcription.md. Used by Glossary Org Board,
 * Glossary of Terms, and 3D hub sphere descriptions.
 */

export const ORGANIZING_BOARD_INTRO =
  "Review the layout of this org board, note the division names, department names and how the different activities are divided. Definitions, detailing the functions of the different divisions and the departments listed here, are provided in the glossary.";

export type BoardDepartment = { number: number; name: string };

export type BoardDivision = {
  id: string;
  label: string;
  division: string;
  executive: "Chief Executive Officer" | "Operations Executive";
  function: string;
  departments: BoardDepartment[];
};

export const BOARD_DIVISIONS: BoardDivision[] = [
  {
    id: "communications",
    label: "Communications",
    division: "Division 1: Communications Division",
    executive: "Chief Executive Officer",
    function:
      "Is fully responsible for the establishment of the organization.",
    departments: [
      { number: 1, name: "Department of Routing & Personnel" },
      { number: 2, name: "Department of Communications" },
      { number: 3, name: "Department of Inspections and Reports" },
    ],
  },
  {
    id: "dissemination",
    label: "Dissemination",
    division: "Division 2: Dissemination Division",
    executive: "Chief Executive Officer",
    function:
      "Makes the organization's products and services widely known and demanded, creating a high volume of public obtaining them.",
    departments: [
      { number: 4, name: "Department of Promotion & Marketing" },
      { number: 5, name: "Department of Publications" },
      { number: 6, name: "Department of Sales" },
    ],
  },
  {
    id: "treasury",
    label: "Treasury",
    division: "Division 3: Treasury Division",
    executive: "Chief Executive Officer",
    function:
      "Handles the financial matters, assets and materiel of the organization, seeing its physical body is fully cared for, enabling it to produce its product and deliver its services and remain solvent.",
    departments: [
      { number: 7, name: "Department of Income" },
      { number: 8, name: "Department of Disbursements" },
      { number: 9, name: "Department of Records, Assets and Materiel" },
    ],
  },
  {
    id: "production",
    label: "Production",
    division: "Division 4: Production Division",
    executive: "Operations Executive",
    function:
      "Provides excellent quality products and services with no delay to its public.",
    departments: [
      { number: 10, name: "Department of Production Services" },
      { number: 11, name: "Department of Activity" },
      { number: 12, name: "Department of Production" },
    ],
  },
  {
    id: "qualification",
    label: "Qualification",
    division: "Division 5: Qualifications Division",
    executive: "Operations Executive",
    function:
      "Sees that every product leaving the organization has the expected level of quality.",
    departments: [
      { number: 13, name: "Department of Examinations" },
      { number: 14, name: "Department of Review" },
      { number: 15, name: "Department of Certifications & Awards" },
    ],
  },
  {
    id: "public",
    label: "Distribution",
    division: "Division 6: Distribution Division",
    executive: "Operations Executive",
    function:
      "Through all of its activities, brings knowledge of and distributes the organization's services and products to the broad public.",
    departments: [
      { number: 16, name: "Department of Public Information" },
      { number: 17, name: "Department of Public Services" },
      { number: 18, name: "Department of Success" },
    ],
  },
  {
    id: "executive",
    label: "Executive",
    division: "Division 7: Executive Division",
    executive: "Chief Executive Officer",
    function:
      "Coordinates and supervises the organization's activities so it runs smoothly, produces its products viably and delivers its products and services to individuals and the community in high quality.",
    departments: [
      { number: 21, name: "Office of the Founder/Owner" },
      { number: 20, name: "Office of Corporate Affairs" },
      { number: 19, name: "Office of the Chief Executive Officer" },
    ],
  },
];

export function boardDivisionById(id: string): BoardDivision | undefined {
  return BOARD_DIVISIONS.find((d) => d.id === id);
}

export function hubDescriptionFor(id: string, fallback: string): string {
  const d = boardDivisionById(id);
  return d ? d.function : fallback;
}

/** Left-to-right organogram columns (Division 7, then 1–6). */
export const BOARD_CHART_ORDER = [
  "executive",
  "communications",
  "dissemination",
  "treasury",
  "production",
  "qualification",
  "public",
] as const;

export const BOARD_EXECUTIVES: {
  title: string;
  divisionIds: string[];
}[] = [
  {
    title: "Administrative Executive",
    divisionIds: ["executive", "communications", "dissemination", "treasury"],
  },
  {
    title: "Operations Executive",
    divisionIds: ["production", "qualification", "public"],
  },
];

export function glossaryDefinitionFor(id: string, extra?: string): string {
  const d = boardDivisionById(id);
  if (!d) return extra ?? "";
  const depts = d.departments
    .map((dept) => `${dept.number} — ${dept.name}`)
    .join("\n");
  return [d.function, `${d.division} (${d.executive}).`, `Departments:\n${depts}`, extra]
    .filter(Boolean)
    .join("\n\n");
}

/** Running prose for the Glossary of Terms — no department dump. */
export function glossaryProseFor(id: string, extra?: string): string {
  const d = boardDivisionById(id);
  if (!d) return extra ?? "";
  return [d.function, extra].filter(Boolean).join(" ");
}
