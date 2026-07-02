import { Workspace } from "@/components/workspace/Workspace";
import positionsData from "@/data/positions.json";
import manufacturersData from "@/data/manufacturers.json";
import dealsData from "@/data/candidates.json";
import workspaceData from "@/data/workspace.json";
import {
  departmentsSchema,
  manufacturersDataSchema,
  candidatesSchema,
  workspaceSchema,
} from "@/lib/schema";

export default function Page() {
  const deptResult = departmentsSchema.safeParse(positionsData);
  const mfrResult = manufacturersDataSchema.safeParse(manufacturersData);
  const dealResult = candidatesSchema.safeParse(dealsData);
  const wsResult = workspaceSchema.safeParse(workspaceData);

  if (
    !deptResult.success ||
    !mfrResult.success ||
    !dealResult.success ||
    !wsResult.success
  ) {
    const errors = [
      !deptResult.success &&
        `positions.json: ${deptResult.error.issues[0]?.message}`,
      !mfrResult.success &&
        `manufacturers.json: ${mfrResult.error.issues[0]?.message}`,
      !dealResult.success &&
        `candidates.json: ${dealResult.error.issues[0]?.message}`,
      !wsResult.success &&
        `workspace.json: ${wsResult.error.issues[0]?.message}`,
    ].filter(Boolean);
    throw new Error(`データの形式が正しくありません:\n${errors.join("\n")}`);
  }

  return (
    <Workspace
      initialRegions={deptResult.data}
      initialManufacturers={mfrResult.data}
      initialDeals={dealResult.data}
      workspace={wsResult.data}
    />
  );
}
