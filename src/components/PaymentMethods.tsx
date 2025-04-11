// Removed MercadoPago SDK imports as it seems to cause conflicts
// import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import type { OnApproveData } from '@paypal/paypal-js';

interface PaymentMethodsProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
}

// Removed MercadoPago SDK initialization from here

export default function PaymentMethods({ amount, onSuccess }: PaymentMethodsProps) {

  // Removed check for MERCADO_PAGO_PUBLIC_KEY as we are not using MP components here anymore

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-sm font-medium mb-3">MÉTODOS DE PAGO</h3>

        <div className="space-y-4">
          {/* MercadoPago Wallet Removed */}
          {/* <div>
            <Wallet
              initialization={{ preferenceId: 'generar-en-backend' }}
              customization={{
                visual: {
                  buttonBackground: 'black',
                  borderRadius: 'none'
                }
              }}
            />
          </div> */}
          <p className="text-sm text-gray-500">(Mercado Pago no disponible temporalmente en este componente)</p>


          {/* PayPal */}
          <div className="pt-2">
            <PayPalScriptProvider 
              options={{ 
                clientId: "TU_CLIENT_ID_PAYPAL",
                components: "buttons",
                currency: "USD",
                intent: "capture"
              }}
            >
              <PayPalButtons
                style={{
                  layout: 'vertical',
                  color: 'black',
                  shape: 'rect',
                  label: 'paypal'
                }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [{
                      amount: {
                        currency_code: "USD",
                        value: amount.toFixed(2)
                      }
                    }]
                  });
                }}
                onApprove={(data: OnApproveData, actions) => {
                  return actions.order!.capture().then((details) => {
                    onSuccess(details.id ?? 'unknown');
                  });
                }}
              />
            </PayPalScriptProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
