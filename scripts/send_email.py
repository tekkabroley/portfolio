import os
import resend

# Load the API key from an environment variable for security
resend.api_key = os.getenv("RESEND_API_KEY")

if not resend.api_key:
    print("Error: RESEND_API_KEY environment variable is not set.")
    exit(1)

try:
    r = resend.Emails.send({
      "from": "onboarding@resend.dev",
      "to": "alex.broley@gmail.com",
      "subject": "Hello World",
      "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
    })
    print("Email sent successfully!")
    print(r)
except Exception as e:
    print(f"An error occurred: {e}")
