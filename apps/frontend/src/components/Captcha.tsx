import { forwardRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"

interface CaptchaProps {
  onChange: (token: string | null) => void
  siteKey: string
  className?: string
  hl?: string
}

export const Captcha = forwardRef<ReCAPTCHA, CaptchaProps>(
  ({ onChange, siteKey, className, hl }, ref) => {
    return (
      <div className={className}>
        <ReCAPTCHA
          ref={ref}
          sitekey={siteKey}
          onChange={onChange}
          onExpired={() => onChange(null)}
          onErrored={() => onChange(null)}
          hl={hl}
        />
      </div>
    )
  }
)

Captcha.displayName = "Captcha"
