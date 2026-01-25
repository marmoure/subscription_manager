import { forwardRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"

interface CaptchaProps {
  onChange: (token: string | null) => void
  siteKey: string
  className?: string
}

export const Captcha = forwardRef<ReCAPTCHA, CaptchaProps>(
  ({ onChange, siteKey, className }, ref) => {
    return (
      <div className={className}>
        <ReCAPTCHA
          ref={ref}
          sitekey={siteKey}
          onChange={onChange}
          onExpired={() => onChange(null)}
          onErrored={() => onChange(null)}
        />
      </div>
    )
  }
)

Captcha.displayName = "Captcha"
