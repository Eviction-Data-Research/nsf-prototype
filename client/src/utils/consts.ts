const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const urls = {
  upload: {
    request: `${backendUrl}/upload/request`,
    confirm: `${backendUrl}/upload/confirm`,
  },
  cares: {
    all: `${backendUrl}/cares`,
    id: `${backendUrl}/cares/single`,
  },
};

export enum Column {
  FileDate = "fileDate",
  CaseId = "caseID",
  Plaintiff = "plaintiff",
  PlaintiffAddress = "plaintiffAddress",
  PlaintiffCity = "plaintiffCity",
  DefendantAddress = "defendantAddress1",
  DefendantCity = "defendantCity1",
}

export const columnLabels: Record<Column, string> = {
  [Column.FileDate]: "Date",
  [Column.CaseId]: "Case number",
  [Column.Plaintiff]: "Plaintiff name",
  [Column.PlaintiffAddress]: "Plaintiff address",
  [Column.PlaintiffCity]: "Plaintiff city",
  [Column.DefendantAddress]: "Defendant address",
  [Column.DefendantCity]: "Defendant city",
};
