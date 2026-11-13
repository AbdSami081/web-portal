export interface ChangeLogEntry {
  instance: number;
  objectCode: number;
  updated: string;
  updatedByUserCode: string;
  updatedByUserName: string;
  updatedOnAt: string;
  created: string;
  createdByUserCode: string;
  createdByUserName: string;
  createdOnAt: string;
}


const mockChangeLogPayload = (objectCode: number): ChangeLogEntry[] => [
  {
    instance: 1,
    objectCode,
    updated: "28.10.26",
    updatedByUserCode: "Dev01",
    updatedByUserName: "Development",
    updatedOnAt: "28.10.26 17:41:28",
    created: "28.10.26",
    createdByUserCode: "Dev01",
    createdByUserName: "Development",
    createdOnAt: "28.10.26 17:41:28",
  },
  {
    instance: 2,
    objectCode,
    updated: "28.10.26",
    updatedByUserCode: "Dev01",
    updatedByUserName: "Development",
    updatedOnAt: "28.10.26 17:41:41",
    created: "28.10.26",
    createdByUserCode: "Dev01",
    createdByUserName: "Development",
    createdOnAt: "28.10.26 17:41:28",
  },
];

export const getChangeLogEntries = async (
  objectCode: number
): Promise<ChangeLogEntry[]> => mockChangeLogPayload(objectCode);
