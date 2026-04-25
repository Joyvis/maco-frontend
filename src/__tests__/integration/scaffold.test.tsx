/**
 * @jest-environment jsdom
 */
import * as React from "react"
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { envSchema } from "@/config/env.schema"

describe("scaffold integration", () => {
  it("AC4/AC6: renders shadcn Button via @/ alias", () => {
    render(<Button>Integration</Button>)
    expect(screen.getByRole("button", { name: "Integration" })).toBeTruthy()
  })

  it("AC6: @/lib/utils alias resolves and cn works", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("AC6/AC7: @/config/env.schema alias resolves and schema validates", () => {
    const result = envSchema.safeParse({
      NEXT_PUBLIC_API_URL: "http://api.example.com",
      NEXT_PUBLIC_APP_NAME: "Maco",
    })
    expect(result.success).toBe(true)
  })
})
