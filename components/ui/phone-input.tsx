"use client"

import * as React from "react"
import { Input } from "./input"
import { cleanDigits, formatPhoneForDisplay, normalizePhoneForStorage } from "@/lib/phone"

interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: string | null
  onChange?: (value: string) => void
  defaultDDD?: string
  showCountry?: boolean
}

export function PhoneInput({
  value,
  onChange,
  defaultDDD = "11",
  showCountry = true,
  placeholder,
  className,
  ...props
}: PhoneInputProps) {
  const [inputValue, setInputValue] = React.useState(
    value ? formatPhoneForDisplay(value, showCountry) : "",
  )
  const [isFocused, setIsFocused] = React.useState(false)

  React.useEffect(() => {
    if (isFocused) return
    const formatted = formatPhoneForDisplay(value ?? "", showCountry)
    setInputValue(formatted)
  }, [value, showCountry, isFocused])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleBlur = () => {
    setIsFocused(false)
    const normalized = normalizePhoneForStorage(inputValue, defaultDDD)
    if (normalized) {
      const formatted = formatPhoneForDisplay(normalized, showCountry)
      setInputValue(formatted)
      onChange?.(normalized)
    } else {
      setInputValue("")
      onChange?.("")
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    const digits = cleanDigits(inputValue)
    if (digits !== inputValue) {
      setInputValue(digits)
    }
  }

  return (
    <Input
      type="tel"
      inputMode="tel"
      value={inputValue}
      placeholder={placeholder ?? (showCountry ? "+55(11) 99999-9999" : "(11) 99999-9999")}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
      {...props}
    />
  )
}
