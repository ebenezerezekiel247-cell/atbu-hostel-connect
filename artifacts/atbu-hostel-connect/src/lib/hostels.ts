export type Campus = "gubi" | "yelwa";

export interface HostelGroup {
  campus: Campus;
  gender: "male" | "female";
  label: string;
  hostels: string[];
}

export const HOSTEL_GROUPS: HostelGroup[] = [
  {
    campus: "gubi",
    gender: "male",
    label: "Gubi Male",
    hostels: ["Block C", "Block D", "Block E", "CBN Hall"],
  },
  {
    campus: "gubi",
    gender: "female",
    label: "Gubi Female",
    hostels: [
      "New Block A (Tetfund)",
      "New Block B (Tetfund)",
      "Old Block A",
      "Old Block B",
      "Remedials",
    ],
  },
  {
    campus: "yelwa",
    gender: "male",
    label: "Yelwa Male",
    hostels: [
      "Block A",
      "Block B",
      "Block C",
      "Block D",
      "Block E",
      "Block F",
      "Block G",
      "Block H",
    ],
  },
  {
    campus: "yelwa",
    gender: "female",
    label: "Yelwa Female",
    hostels: ["Babylon", "Zion", "Bethel"],
  },
];

export const ALL_HOSTELS: string[] = HOSTEL_GROUPS.flatMap((g) => g.hostels);

export function getHostelGroupsForCampus(campus: Campus): HostelGroup[] {
  return HOSTEL_GROUPS.filter((g) => g.campus === campus);
}

export function isValidHostel(hostel: string): boolean {
  return ALL_HOSTELS.includes(hostel);
}
