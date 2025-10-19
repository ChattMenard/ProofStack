'use client'

import { useEffect, useState } from 'react'
import {
  useStripe,
  useElements,
  ExpressCheckoutElement,
} from '@stripe/react-stripe-js'

interface ExpressCheckoutProps {
  plan: 'monthly' | 'yearly'
  amount: number
  onSuccess?: () => void
}

export default function ExpressCheckout({ plan, amount, onSuccess }: ExpressCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [message, setMessage] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const onConfirm = async (event: any) => {
    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      // Create PaymentIntent on your server
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          amount,
        }),
      })

      const { clientSecret, error } = await response.json()

      if (error) {
        setMessage(error)
        setIsProcessing(false)
        return
      }

      // Confirm the payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      })

      if (confirmError) {
        setMessage(confirmError.message || 'Payment failed')
      } else {
        onSuccess?.()
      }
    } catch (err) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full">
      <ExpressCheckoutElement
        onConfirm={onConfirm}
        options={{
          buttonType: {
            applePay: 'buy',
            googlePay: 'buy',
            paypal: 'buynow',
          },
          buttonTheme: {
            applePay: 'white-outline',
            googlePay: 'white',
            paypal: 'white',
          },
          buttonHeight: 48,
          layout: {
            maxColumns: 2,
            maxRows: 1,
            overflow: 'auto',
          },
        }}
      />
      {message && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
          {message}
        </div>
      )}
    </div>
  )
}
