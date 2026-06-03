import { hashPassword, verifyPassword } from "./password.util";

describe("password.util", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("qa-password");
    await expect(verifyPassword("qa-password", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("qa-password");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces a unique salt per hash", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toEqual(b);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("anything", "not-a-valid-hash")).resolves.toBe(false);
  });
});
