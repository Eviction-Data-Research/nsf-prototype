const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const urls = {
  upload: {
    request: `${backendUrl}/upload/request`,
    confirm: `${backendUrl}/upload/confirm`,
  },
  cares: {
    all: `${backendUrl}/cares`,
    id: `${backendUrl}/cares/property`,
    trend: `${backendUrl}/cares/property/trend`,
  },
  suggestion: {
    all: `${backendUrl}/suggestion`,
    count: `${backendUrl}/suggestion/count`,
    external: `${backendUrl}/suggestion/map`,
    confirm: `${backendUrl}/suggestion/confirm`,
    reject: `${backendUrl}/suggestion/reject`,
    undo: `${backendUrl}/suggestion/undo`,
  },
  export: {
    all: `${backendUrl}/export/all`,
    id: `${backendUrl}/export/property`,
    addresses: `${backendUrl}/export/property/addresses`,
  },
  eviction: {
    chart: `${backendUrl}/eviction/chart`,
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

export const START_DATE = "2019-01-01";
