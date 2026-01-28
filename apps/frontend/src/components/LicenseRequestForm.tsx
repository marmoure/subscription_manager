import React, { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import ReCAPTCHA from "react-google-recaptcha"
import { Loader2, AlertCircle, CheckCircle2, Copy, Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getLicenseRequestSchema, type LicenseRequestFormValues } from "@/schemas/licenseRequest.schema"
import { submitLicenseRequest, ApiError } from "@/services/api"
import { Captcha } from "@/components/Captcha"

export function LicenseRequestForm() {
  const { t, i18n } = useTranslation()
  const recaptchaRef = React.useRef<ReCAPTCHA>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [licenseData, setLicenseData] = useState<{ licenseKey: string; expiresAt: string } | null>(null)

  const schema = useMemo(() => getLicenseRequestSchema(t, i18n.language), [t, i18n.language])

  // 1. Define your form.
  const form = useForm<LicenseRequestFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: "",
      machineId: "",
      phone: "",
      shopName: "",
      numberOfCashiers: 1,
      captchaToken: "",
      website: "",
    },
    mode: "onBlur",
  })

  // 2. Define a submit handler.
  async function onSubmit(values: LicenseRequestFormValues) {
    setIsLoading(true)
    setError(null)
    setLicenseData(null)

    try {
      const response = await submitLicenseRequest(values)
      if (response.success && response.data) {
        setLicenseData(response.data)
        form.reset()
        recaptchaRef.current?.reset()
      } else {
        setError(response.message || t('unknown_error'))
        recaptchaRef.current?.reset()
        form.setValue("captchaToken", "")
      }
    } catch (err: any) {
      console.error(err)

      if (err instanceof ApiError && err.data?.errors?.fieldErrors) {
        const fieldErrors = err.data.errors.fieldErrors;
        Object.keys(fieldErrors).forEach((key) => {
          const message = fieldErrors[key]?.[0];
          if (message) {
            form.setError(key as any, { message });
          }
        });
        setError(t('check_form_errors'));
      } else {
        setError(err.message || t('failed_to_submit'))
      }

      recaptchaRef.current?.reset()
      form.setValue("captchaToken", "")
    } finally {
      setIsLoading(false)
    }
  }

  const onCaptchaChange = (token: string | null) => {
    if (token) {
      form.setValue("captchaToken", token)
      form.clearErrors("captchaToken")
    } else {
      form.setValue("captchaToken", "")
    }
  }

  const copyToClipboard = () => {
    if (licenseData?.licenseKey) {
      navigator.clipboard.writeText(licenseData.licenseKey)
    }
  }

  const toggleLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  // Use a dummy site key for development/demo if one isn't provided in env
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"

  if (licenseData) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>{t('approved')}</CardTitle>
            </div>
            <LanguageSwitcher currentLanguage={i18n.language} onLanguageChange={toggleLanguage} />
          </div>
          <CardDescription>
            {t('approved_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg border flex items-center justify-between gap-4">
            <code className="text-lg font-mono font-bold break-all">
              {licenseData.licenseKey}
            </code>
            <Button variant="ghost" size="icon" onClick={copyToClipboard} title={t('copy_to_clipboard')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('expires_on')}: {new Date(licenseData.expiresAt).toLocaleDateString(i18n.language)}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => setLicenseData(null)}
          >
            {t('request_another')}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('license_request')}</CardTitle>
          <LanguageSwitcher currentLanguage={i18n.language} onLanguageChange={toggleLanguage} />
        </div>
        <CardDescription>
          {t('submit_request')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error')}</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('name_placeholder')}
                        {...field}
                        className={`h-12 ${fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shopName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('shop_name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('shop_name_placeholder')}
                        {...field}
                        className={`h-12 ${fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('phone_number')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('phone_placeholder')}
                        type="tel"
                        {...field}
                        className={`h-12 ${fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numberOfCashiers"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('number_of_cashiers')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        {...field}
                        className={`h-12 ${fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="machineId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t('machine_id')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('machine_id_placeholder')}
                      {...field}
                      className={`h-12 ${fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('machine_id_description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Honeypot field - visually hidden to users but visible to bots */}
            <div className="hidden" aria-hidden="true">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        tabIndex={-1}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="captchaToken"
              render={() => (
                <FormItem className="flex flex-col items-center justify-center pt-4">
                  <FormLabel>{t('security_check')}</FormLabel>
                  <FormControl>
                    <Captcha
                      ref={recaptchaRef}
                      siteKey={siteKey}
                      onChange={onCaptchaChange}
                      hl={i18n.language}
                      className="transform scale-90 sm:scale-100 origin-center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submit_button')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function LanguageSwitcher({ currentLanguage, onLanguageChange }: { currentLanguage: string, onLanguageChange: (lng: string) => void }) {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={currentLanguage.startsWith(lang.code) ? "bg-accent" : ""}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
