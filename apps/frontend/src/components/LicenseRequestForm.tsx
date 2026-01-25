import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import ReCAPTCHA from "react-google-recaptcha"
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Schema definition
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  machineId: z.string().min(1, {
    message: "Machine ID is required.",
  }),
  phoneNumber: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  shopName: z.string().min(1, {
    message: "Shop name is required.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  numberOfCashiers: z.coerce.number().min(1, {
    message: "At least one cashier is required.",
  }),
  captcha: z.string().min(1, {
    message: "Please verify you are not a robot.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function LicenseRequestForm() {
  const recaptchaRef = React.useRef<ReCAPTCHA>(null)

  // 1. Define your form.
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      machineId: "",
      phoneNumber: "",
      shopName: "",
      email: "",
      numberOfCashiers: 1,
      captcha: "",
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: FormValues) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
    alert(JSON.stringify(values, null, 2))
    
    // Reset captcha after submit
    recaptchaRef.current?.reset()
    form.setValue("captcha", "")
  }

  const onCaptchaChange = (token: string | null) => {
    if (token) {
      form.setValue("captcha", token)
      form.clearErrors("captcha")
    } else {
      form.setValue("captcha", "")
    }
  }

  // Use a dummy site key for development/demo if one isn't provided in env
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" 

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>License Request</CardTitle>
        <CardDescription>
          Submit a request for a new machine license.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Shop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numberOfCashiers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Cashiers</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="machineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine ID</FormLabel>
                  <FormControl>
                    <Input placeholder="XXXX-XXXX-XXXX-XXXX" {...field} />
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

            <Button type="submit" className="w-full">Submit Request</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
