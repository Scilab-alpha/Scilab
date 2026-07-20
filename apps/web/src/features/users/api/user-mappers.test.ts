import { describe, expect, it } from "vitest";
import {
  mapApiUserProfile,
  toApiUserRole,
  toApiUserStatus,
  toApiUserUpdate,
} from "./user-mappers";

describe("user mappers", () => {
  it("normalizes the Swagger profile for the UI", () => {
    expect(
      mapApiUserProfile({
        id: "user-1",
        email: "jane@example.edu",
        status: "BANNED",
        role: "RESEARCHER",
        firstName: " Jane ",
        lastName: " Smith ",
        imageUrl: null,
        gender: "FEMALE",
        dateOfBirth: "2001-04-12T00:00:00.000Z",
      }),
    ).toEqual({
      id: "user-1",
      email: "jane@example.edu",
      status: "banned",
      role: "researcher",
      firstName: "Jane",
      lastName: "Smith",
      displayName: "Jane Smith",
      initials: "JS",
      imageUrl: null,
      gender: "FEMALE",
      dateOfBirth: "2001-04-12",
    });
  });

  it("falls back to the email name when profile names are absent", () => {
    const profile = mapApiUserProfile({
      id: "user-2",
      email: "scholar@example.edu",
      status: "ACTIVE",
      role: "STUDENT",
      firstName: null,
      lastName: null,
      imageUrl: null,
      gender: null,
      dateOfBirth: null,
    });

    expect(profile).toMatchObject({
      displayName: "scholar",
      initials: "S",
      status: "active",
      role: "student",
    });
  });

  it("maps only supplied update fields to Swagger field names", () => {
    expect(
      toApiUserUpdate({
        email: " UPDATED@Example.edu ",
        firstName: " Jane ",
        dateOfBirth: "2001-04-12",
      }),
    ).toEqual({
      email: "updated@example.edu",
      firstname: "Jane",
      dateofbirth: "2001-04-12",
    });
  });

  it("maps mutable roles and statuses to Swagger enums", () => {
    expect(toApiUserRole("student")).toBe("STUDENT");
    expect(toApiUserRole("researcher")).toBe("RESEARCHER");
    expect(toApiUserStatus("inactive")).toBe("INACTIVE");
    expect(toApiUserStatus("banned")).toBe("BANNED");
  });
});
