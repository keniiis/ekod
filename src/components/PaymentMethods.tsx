import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import type { OnApproveData } from '@paypal/paypal-js';

interface PaymentMethodsProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
}

export default function PaymentMethods({ amount, onSuccess }: PaymentMethodsProps) {
  // Inicializar MercadoPago con tu clave pública
  initMercadoPago('TU_CLAVE_PUBLICA_MP', {
    locale: 'es-AR'
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-sm font-medium mb-3">MÉTODOS DE PAGO</h3>
        
        <div className="space-y-4">
          {/* MercadoPago Wallet */}
          <div>
            <Wallet 
              initialization={{ preferenceId: 'generar-en-backend' }} // Debes generar un preferenceId en tu backend
              customization={{
                visual: {
                  buttonBackground: 'black',
                  borderRadius: 'none'
                }
              }}
            />
          </div>

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