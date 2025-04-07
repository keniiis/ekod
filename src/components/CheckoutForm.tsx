import React, { useMemo, useEffect, useState, useRef } from 'react'; // Import hooks
import { useCartStore } from '../store/cart';
import { formatPriceCLP } from '../utils/formatting'; // Import the formatter

// Declare MercadoPago type globally to avoid TypeScript errors for the 'MercadoPago' object
// In a real app, you might install @mercadopago/sdk-react types if available
declare global {
  interface Window {
    MercadoPago: any; 
  }
}

const MERCADO_PAGO_PUBLIC_KEY = "APP_USR-d14588a9-c659-47aa-97b0-eeaeb43d7fc8"; // Use the key you provided

const CheckoutForm: React.FC = () => {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart); 
  const [isLoading, setIsLoading] = useState(false); // State for loading preference
  const [preferenceId, setPreferenceId] = useState<string | null>(null); // State for preference ID
  const mpBrickContainerRef = useRef<HTMLDivElement>(null); // Ref for the brick container
  const mpInstanceRef = useRef<any>(null); // Ref to store MercadoPago instance
  const [isStoreHydrated, setIsStoreHydrated] = useState(false); // Track Zustand hydration
  const [isFlowLoading, setIsFlowLoading] = useState(false); // State for Flow loading
  const [customerEmail, setCustomerEmail] = useState(''); // State for customer email input

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  // Simple shipping calculation (same as cart)
  const shipping = subtotal > 0 ? 5.00 : 0; 
  const total = subtotal + shipping;

  // Effect to check Zustand hydration status
  useEffect(() => {
    // Zustand's persist middleware has a `hasHydrated` function
    // and an `onFinishHydration` listener. We use onFinishHydration
    // to ensure we act only after hydration is complete.
    const unsubFinishHydration = useCartStore.persist.onFinishHydration(() => {
      console.log('Zustand store hydration finished.');
      setIsStoreHydrated(true);
    });

    // Check initial hydration status in case it finished before listener attached
    if (useCartStore.persist.hasHydrated()) {
       console.log('Zustand store already hydrated on mount.');
       setIsStoreHydrated(true);
    } else {
       console.log('Waiting for Zustand store hydration...');
    }

    return () => {
      unsubFinishHydration(); // Clean up listener on unmount
    };
  }, []);


  // Effect to load MP SDK and create Brick *after* hydration and SDK load
  useEffect(() => {
    // Only proceed if the store is hydrated
    if (!isStoreHydrated) {
      console.log('MP SDK Load: Waiting for store hydration...');
      return; 
    }
    console.log('MP SDK Load: Store is hydrated.');

    const scriptId = 'mercado-pago-sdk';
    let scriptLoaded = document.getElementById(scriptId) !== null;

    const initializeAndCreateBrick = () => {
       console.log('Attempting to initialize MP SDK and create brick...');
       try {
          if (window.MercadoPago) {
             if (!mpInstanceRef.current) { // Initialize only once
                mpInstanceRef.current = new window.MercadoPago(MERCADO_PAGO_PUBLIC_KEY, {
                   locale: 'es-CL',
                });
                console.log('Mercado Pago SDK instanciado.');
             }
             // --- Trigger brick creation ---
             // Check if items exist *after* hydration before creating preference
             if (items.length > 0) {
                 console.log('Hydrated store has items, proceeding to create brick.');
                 createCheckoutBrick(); 
             } else {
                 console.log('Hydrated store is empty, skipping brick creation.');
                 // Optionally hide the brick container or show an empty message here
                 if (mpBrickContainerRef.current) mpBrickContainerRef.current.innerHTML = ''; 
             }
             // -----------------------------
          } else {
             console.error('window.MercadoPago no está disponible.');
          }
       } catch (sdkError) {
          console.error('Error al instanciar Mercado Pago o crear brick:', sdkError);
       }
    };

    // If script already exists in DOM, try initializing directly
    if (scriptLoaded) {
       console.log('MP SDK script already in DOM.');
       initializeAndCreateBrick();
       return; // Don't add script again
    }

    // If script doesn't exist, create and load it
    console.log('MP SDK script not found, creating and appending...');
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = initializeAndCreateBrick; // Call combined function on load
    script.onerror = () => {
      console.error('Error al cargar dinámicamente el script del SDK de Mercado Pago.');
    };
    document.body.appendChild(script);

  // Rerun this effect if hydration status changes
  }, [isStoreHydrated]); 


  // Function to create preference and render the Checkout Brick (now assumes SDK instance exists)
  const createCheckoutBrick = async () => {
    // Added check for items length here as well for safety, although useEffect should prevent call if empty
    if (!mpInstanceRef.current || !mpBrickContainerRef.current || items.length === 0) {
        console.log('createCheckoutBrick called but conditions not met (SDK instance, container, or items missing).');
        return; 
    }
    
    // Avoid re-creating if preferenceId already exists from a previous attempt in this session
    if (preferenceId) {
        console.log('Preference ID already exists, attempting to render brick without fetching new one.');
        // Potentially just try rendering the brick again if needed, or assume it's there
        // For simplicity, we'll just log and return for now if preferenceId exists.
        // You might want logic here to re-render the brick if the container was cleared.
        return; 
    }

    console.log('Proceeding to fetch preference ID...');
    setIsLoading(true);
    // setPreferenceId(null); // Resetting here might cause issues if called multiple times, reset earlier
    
    // Clear previous brick if exists
    mpBrickContainerRef.current.innerHTML = ''; 

    try {
      // **IMPORTANT: Replace with actual fetch to your backend endpoint**
      // This endpoint needs to be created separately. It should receive cart items 
      // and return a { preferenceId: '...' } object.
      const response = await fetch('/api/create-preference', { // Placeholder URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: items.map(item => ({ // Send item details needed by backend
            id: item.id,
            title: item.name,
            quantity: item.quantity,
            unit_price: item.price
          })) 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create preference: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedPreferenceId = data.preferenceId;

      if (!fetchedPreferenceId) {
         throw new Error('Preference ID not received from backend');
      }
      
      setPreferenceId(fetchedPreferenceId); // Store the preference ID

      // Render the Checkout Brick
      const bricksBuilder = mpInstanceRef.current.bricks();
      await bricksBuilder.create('wallet', mpBrickContainerRef.current.id, {
        initialization: {
           preferenceId: fetchedPreferenceId,
         },
         // Apply user-provided customization
         customization: {
            theme:'dark', // Use dark theme
            visual: { // Visual styles are nested under 'visual' according to MP docs
                valuePropColor: 'black', // Note: This might conflict with dark theme, test needed
                borderRadius: '10px',
                verticalPadding: '10px',
                horizontalPadding: '10px',
            },
            texts: {
                valueProp: 'practicality', // Change value prop text
            },
         },
         callbacks: {
          onReady: () => {
            console.log('Mercado Pago Brick ready');
            setIsLoading(false); 
          },
          onSubmit: (callbackData: any) => { // Receive the raw data without destructuring initially
            console.log('Mercado Pago onSubmit callback received:', callbackData); // Log what MP actually sends

            // Check if data exists before trying to use it
            if (callbackData) {
               // Now you can safely attempt to access properties if they exist
               const { selectedPaymentMethod, formData } = callbackData; 
               console.log('Mercado Pago onSubmit details:', { selectedPaymentMethod, formData });
               // You might send formData to your backend here for final processing/verification
            } else {
               console.log('Mercado Pago onSubmit called without data (might be expected for Wallet Button redirection).');
            }
            
            // Depending on the integration type, payment might be finalized here or after redirection
            // For Wallet Button, redirection usually happens automatically.
            // For other Bricks (CardForm), you'd POST formData to your backend.
            return new Promise<void>((resolve) => {
              // Example: Simulate backend processing before resolving
              setTimeout(() => {
                 console.log("Processing payment submission...");
                 // Potentially clear cart and redirect based on backend response
                 // clearCart(); 
                 // window.location.href = '/orden-confirmada'; 
                 resolve(); 
              }, 1000); 
            });
          },
          onError: (error: any) => {
            console.error('Mercado Pago Brick error:', error);
            setIsLoading(false);
            alert('Error al procesar el pago con Mercado Pago.');
            setPreferenceId(null); // Allow retry
          },
        },
      });

    } catch (error) {
      console.error('Error creating Mercado Pago preference or brick:', error);
      alert('No se pudo iniciar el pago con Mercado Pago. Intenta de nuevo.');
      setIsLoading(false);
      setPreferenceId(null); // Allow retry
    }
  };

  // Remove the handleMercadoPago function as createCheckoutBrick is called automatically

  // Handler for Flow/Webpay button click
  const handleFlowPaymentClick = async () => {
    // Basic email validation
    if (!customerEmail || !/\S+@\S+\.\S+/.test(customerEmail)) {
      alert('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    console.log('Initiating Flow payment for email:', customerEmail);
    setIsFlowLoading(true);
    try {
      const response = await fetch('/api/create-flow-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the total amount and customer email
        body: JSON.stringify({ amount: total, email: customerEmail }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Flow API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.redirectUrl) {
        console.log('Received Flow redirect URL:', data.redirectUrl);
        // Redirect the user to Flow's payment page
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('Redirect URL not received from Flow backend.');
      }

    } catch (error: any) {
      console.error('Error initiating Flow payment:', error);
      alert(`Error al iniciar el pago con Flow/Webpay: ${error.message}`);
      setIsFlowLoading(false);
    } 
    // No need to set loading to false on success, as we redirect
  };

  // Remove the handlePayPal function as the button is being removed

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12"> {/* Changed class to className */}
        <p>Tu carrito está vacío. No puedes proceder al checkout.</p>
        <a href="/tienda" className="mt-4 inline-block text-sm underline">Volver a la tienda</a> {/* Changed class to className */}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-8 rounded-lg shadow-sm">
      <h2 className="text-xl font-medium mb-6">Resumen del Pedido</h2>

      {/* Simple Email Input */}
      <div className="mb-6">
          <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
          <input 
            type="email" 
            id="customer-email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="tu@correo.com"
            required 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
      </div>
      
      {/* Order Summary Table */}
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="border-b">
            <th className="text-left font-normal py-2">Producto</th>
            <th className="text-right font-normal py-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-3">{item.name} x {item.quantity}</td>
              {/* Format line item total */}
              <td className="text-right py-3">${formatPriceCLP(item.price * item.quantity)}</td> 
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-b">
            <td className="py-2 text-right text-gray-600">Subtotal</td>
             {/* Format subtotal */}
            <td className="text-right py-2">${formatPriceCLP(subtotal)}</td>
          </tr>
          <tr>
            <td className="py-2 text-right text-gray-600">Envío</td>
             {/* Format shipping */}
            <td className="text-right py-2">${formatPriceCLP(shipping)}</td>
          </tr>
          <tr className="font-semibold">
            <td className="py-3 text-right">Total</td>
             {/* Format total */}
            <td className="text-right py-3">${formatPriceCLP(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Selecciona tu método de pago:</h3>
        <div className="space-y-4">
          {/* Remove the custom Mercado Pago Button */}
          
          {/* Container for the Mercado Pago Brick */}
          {/* This div will now be populated automatically when the SDK is ready */}
          <div id="mercado-pago-brick-container" ref={mpBrickContainerRef}></div>
          
          {/* Remove the PayPal Button */}

          {/* Flow / Webpay Button - Now uses onClick */}
          <button 
            type="button" 
            onClick={handleFlowPaymentClick}
            disabled={isFlowLoading} // Disable button while loading
            className={`w-full bg-[#0077cc] text-white border-none px-8 py-4 text-lg rounded-lg cursor-pointer transition-colors duration-300 ease-in-out hover:bg-[#005fa3] ${isFlowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
             // Tailwind classes converted from the provided CSS:
             // w-full: ensures full width like other buttons
             // bg-[#0077cc]: background color
             // text-white: text color
             // border-none: remove default border
             // px-8 py-4: padding (approximated from 1rem/2rem and font size)
             // text-lg: font size (approximated from 1.2rem)
             // rounded-lg: border radius (approximated from 8px)
             // cursor-pointer: pointer cursor
             // transition-colors duration-300 ease-in-out: transition
             // hover:bg-[#005fa3]: hover background color
             // Added disabled state styling: opacity-50 cursor-not-allowed
          >
            {isFlowLoading ? 'Procesando...' : 'Pagar con Webpay / Flow'}
          </button>
          {/* Removed the surrounding <a> tag */}

        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
