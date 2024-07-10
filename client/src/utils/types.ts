import { VerificationStatus } from "../components/PropertyPage/Suggestions/Suggestions";

export type CaresProperty = {
  id: number;
  source: string;
  propertyName: string;
  address: string;
  city: string;
  zipCode: number;
  count: number;
};

export type TimeSeriesHistory = {
  label: string;
  value: number;
  potential: number;
};

export type NamePermutation = {
  plaintiff: string;
  count: number;
  mostRecentlySeen: Date;
};

export type AddressPermutation = {
  address: string;
};

export type Suggestion = {
  id: number;
  caseID: string;
  address: string;
  verification: VerificationStatus;
};
