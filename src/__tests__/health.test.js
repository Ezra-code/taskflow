import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import app from "../app.js";

describe("GET /api/v1/health", () => {
  it("should return 200 and confirm that the API is healthy", async () => {
    const response = await request(app)
      .get("/api/v1/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "success",
      message: "TaskFlow API is healthy",
    });
  });
});