// functions/src/__tests__/custom-claims.test.ts

import {describe, it, expect} from "vitest";
import {isAdminEmail, getInitialRole} from "../custom-claims";

describe("Custom Claims", () => {
  describe("isAdminEmail", () => {
    it("debe retornar true para admin email", () => {
      expect(isAdminEmail("diego.zuni@gmail.com")).toBe(true);
    });

    it("debe retornar false para otros emails", () => {
      expect(isAdminEmail("user@example.com")).toBe(false);
      expect(isAdminEmail(undefined)).toBe(false);
    });
  });

  describe("getInitialRole", () => {
    it("debe asignar admin para admin email", () => {
      expect(getInitialRole("diego.zuni@gmail.com")).toBe("admin");
    });

    it("debe asignar user para otros emails", () => {
      expect(getInitialRole("user@example.com")).toBe("user");
    });
  });

  // Tests adicionales requerirían Firebase Test SDK
  // Para producción, agregar tests de integración
});

