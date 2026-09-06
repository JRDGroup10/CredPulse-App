import { describe, expect, it } from "vitest";
import { orderedRoleGroups, roleGroupsForRegion, rolesForRegion } from "./roles";

describe("roleGroupsForRegion", () => {
  it("always returns Healthcare, Construction, Education, Policing in that order", () => {
    for (const region of ["CA", "US"] as const) {
      const groups = roleGroupsForRegion(region);
      expect(groups.map((g) => g.label)).toEqual([
        "Healthcare",
        "Construction",
        "Education",
        "Policing & public safety"
      ]);
      // Every group has at least one role — an empty <optgroup> would be a
      // silent bug in the signup dropdown.
      for (const group of groups) {
        expect(group.roles.length).toBeGreaterThan(0);
      }
    }
  });

  it("includes region-specific title variants", () => {
    expect(roleGroupsForRegion("CA")[0].roles).toContain("Registered Practical Nurse");
    expect(roleGroupsForRegion("US")[0].roles).toContain("Licensed Practical Nurse");
  });
});

describe("orderedRoleGroups", () => {
  it("keeps Healthcare first when preferOther is false", () => {
    expect(orderedRoleGroups("CA", false)[0].label).toBe("Healthcare");
  });

  it("moves Healthcare to the end when preferOther is true, without dropping it", () => {
    const groups = orderedRoleGroups("CA", true);
    expect(groups[groups.length - 1].label).toBe("Healthcare");
    expect(groups).toHaveLength(4);
    expect(groups.map((g) => g.label)).toContain("Healthcare");
  });
});

describe("rolesForRegion", () => {
  it("flattens every group into one list with no duplicates", () => {
    const roles = rolesForRegion("CA");
    expect(new Set(roles).size).toBe(roles.length);
    expect(roles).toContain("Registered Nurse");
    expect(roles).toContain("Police Officer");
  });
});
