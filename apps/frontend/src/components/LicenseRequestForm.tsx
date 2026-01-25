import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import ReCAPTCHA from "react-google-recaptcha"
import { Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react"
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
import { licenseRequestSchema, type LicenseRequestFormValues } from "@/schemas/licenseRequest.schema"
import { submitLicenseRequest, ApiError } from "@/services/api"

export function LicenseRequestForm() {
  const recaptchaRef = React.useRef<ReCAPTCHA>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [licenseData, setLicenseData] = useState<{ licenseKey: string; expiresAt: string } | null>(null)

  // 1. Define your form.
  const form = useForm<LicenseRequestFormValues>({
    resolver: zodResolver(licenseRequestSchema) as any,
    defaultValues: {
      name: "",
      machineId: "",
      phone: "",
      shopName: "",
      email: "",
      numberOfCashiers: 1,
      captcha: "",
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
        setError(response.message || "An unknown error occurred.")
        recaptchaRef.current?.reset()
        form.setValue("captcha", "")
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
        setError("Please check the form for errors.");
      } else {
        setError(err.message || "Failed to submit request. Please try again.")
      }
      
      recaptchaRef.current?.reset()
      form.setValue("captcha", "")
    } finally {
      setIsLoading(false)
    }
  }

  const onCaptchaChange = (token: string | null) => {
    if (token) {
      form.setValue("captcha", token)
      form.clearErrors("captcha")
    } else {
      form.setValue("captcha", "")
    }
  }

  const copyToClipboard = () => {
    if (licenseData?.licenseKey) {
      navigator.clipboard.writeText(licenseData.licenseKey)
    }
  }

  // Use a dummy site key for development/demo if one isn't provided in env
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" 

  if (licenseData) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-500">
        <CardHeader>
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle2 className="h-6 w-6" />
            <CardTitle>License Request Approved!</CardTitle>
          </div>
          <CardDescription>
            Your license has been successfully generated. Please save this key safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg border flex items-center justify-between gap-4">
            <code className="text-lg font-mono font-bold break-all">
              {licenseData.licenseKey}
            </code>
            <Button variant="ghost" size="icon" onClick={copyToClipboard} title="Copy to clipboard">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Expires on: {new Date(licenseData.expiresAt).toLocaleDateString()}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => setLicenseData(null)}
          >
            Request Another License
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>License Request</CardTitle>
        <CardDescription>
          Submit a request for a new machine license.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className={fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="My Awesome Shop" 
                        {...field} 
                        className={fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="john@example.com" 
                        type="email" 
                        {...field} 
                        className={fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1234567890" 
                        type="tel" 
                        {...field} 
                        className={fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                    <FormLabel>Number of Cashiers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={50}
                        {...field} 
                        className={fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}
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
                  <FormLabel>Machine ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="XXXX-XXXX-XXXX-XXXX" 
                      {...field} 
                      className={fieldState.error ? "border-red-500 focus-visible:ring-red-500" : ""}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    You can find the Machine ID in the system settings of your device.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="captcha"
              render={() => (
                <FormItem className="flex flex-col items-center justify-center pt-4">
                  <FormControl>
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={siteKey}
                      onChange={onCaptchaChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
