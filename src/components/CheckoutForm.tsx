import React, { useMemo, useEffect, useState } from 'react'; // Corrected import, removed useRef
import type { FormEvent } from 'react'; // Import FormEvent as a type
// Removed MercadoPago React SDK import as we are using manual redirection
import { useCartStore } from '../store/cart';
import { formatPriceCLP } from '../utils/formatting'; // Import the formatter

// Declare MercadoPago type globally (still potentially needed if using window.MercadoPago directly, though unlikely now)
// In a real app, you might install @dooavogdsTypkScript-trrorstporethea'e'objct
// In a al appyo mighnst@meadag/sdk-ract ype if available
declare global {
  interface Window {
    MercadoPago: any;
  }
}

// Load Public Key from environment variable (must be prefixed with PUBLIC_ for client-side access in Astro)
const MERCADO_PAGO_PUBLIC_KEY = import.meta.env.PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

if (!MERCADO_PAGO_PUBLIC_KEY) {
  console.error("Error: PUBLIC_MERCADO_PAGO_PUBLIC_KEY environment variable is not set in .env");
  // Handle the error appropriately, maybe return null or an error message component
}
// Removed initMercadoPago call as we are not using the React SDK components


const CheckoutForm: React.FC = () => {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isLoading, setIsLoading] = useState(false); // State for loading preference
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null); // State for checkout URL remains
  // Removed mpBrickContainerRef, mpInstanceRef, mpBrickInstanceRef
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const [isFlowLoading, setIsFlowLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // Estado para errores

  // --- State for Customer Details ---
  const [customerEmail, setCustomerEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [commune, setCommune] = useState('');
  const [observations, setObservations] = useState('');
  // ---------------------------------

  // --- Datos de Regiones/Comunas (EJEMPLO - REEMPLAZAR CON DATOS REALES) ---
  const regionCommuneData: { [key: string]: string[] } = useMemo(() => ({
    "": [], // Opción inicial vacía
    "Antofagasta": ["Antofagasta", "Baquedano", "Calama", "La Negra", "María Elena", "Mejillones", "Ollague", "San Pedro de Atacama", "Sierra Gorda", "Taltal", "Tocopilla"],
    "Araucanía": ["Angol", "Carahue", "Chol Chol", "Collipuylli", "Cunco", "Curacautin", "Curarrehue", "Ercilla", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Lonquimay", "Los Sauces", "Lumaco", "Melipeuco", "Nueva Imperial", "Padre las casas", "Perquenco", "Pitrufquen", "Pucón", "Puren", "Renaico", "Saavedra", "Temuco", "Teodoro Schmidt", "Toltén", "Traiguen", "Victoria", "Vilcun", "Villarrica"],
    "Arica y Parinacota": ["Arica", "Camarones", "General Lagos", "Putre"],
    "Atacama": ["Alto del Carmen", "Caldera", "Chañaral", "Copiapó", "Diego de Almagro", "El Salvador", "Freirina", "Huasco", "Tierra Amarilla", "Vallenar"],
    "Aysén": ["Aysén", "Chile Chico", "Cisnes", "Cochrane", "Coyhaique", "Guaitecas", "Lago Verde", "O'Higgins", "Río Ibáñez", "Tortel"],
    "Biobío": ["Alto Biobío", "Antuco", "Arauco", "Cabrero", "Cañete", "Chiguayante", "Concepción", "Contulmo", "Coronel", "Curanilahue", "Florida", "Hualpén", "Hualqui", "Laja", "Lebu", "Los Álamos", "Los Ángeles", "Lota", "Penco", "Quilaco", "Quilleco", "San Pedro de la Paz", "San Rosendo", "Santa Bárbara", "Santa Juana", "Talcahuano", "Tirúa", "Tomé", "Tucapel", "Yumbel"],
    "Coquimbo": ["Andacollo", "Canela", "Combarbalá", "Coquimbo", "Illapel", "La Higuera", "La Serena", "Los Vilos", "Monte Patria", "Ovalle", "Paiguano", "Punitaqui", "Río Hurtado", "Salamanca", "Vicuña"],
    "Libertador General Bernardo O'Higgins": ["Chepica", "Chimbarongo", "Codegua", "Coinco", "Coltauco", "Donihue", "Graneros", "La Estrella", "Las Cabras", "Las Nieves - Rancagu", "Litueche", "Lolol", "Machali", "Malloas", "Marchihue", "Mostazal", "Nancagua", "Navidad", "Olivar - Alto", "Olivar - Bajo", "Palmilla", "Paredones", "Peralillo", "Peumo", "Pichidegua", "Pichilemu", "Placilla", "Pumanque", "Quinta de Tilcoco", "Rancagua", "Rengo", "Requinoa","San Fernando","Santa Cruz","San Vicente"],
    "Los Lagos": ["Ancud", "Calbuco", "Castro", "Chaiten", "Chonchi", "Cochamo", "Curaco de Velez", "Dalcahue", "Fresia", "Frutillar", "Futaleufu", "Hualaihue", "Llanquihue", "Los Muermos", "Maullin", "Osorno", "Palena", "Puerto Montt", "Puerto Octay", "Puerto Varas", "Puqueldon", "Purranque", "Puyehue", "Queilen", "Quellon", "Quemchi", "Quinchao", "Rio Negro", "San Juan de la Costa", "San Pablo"],
    "Los Ríos": ["Corral", "Futrono", "Lago Ranco", "Lanco", "La Union", "Los Lagos", "Mafil", "Mariquina", "Paillaco", "Panguipulli", "Rio Bueno", "Valdivia"],
    "Magallanes y la Antártica Chilena": ["Antártica", "Cabo de Hornos", "Laguna Blanca", "Natales", "Porvenir", "Primavera", "Punta Arenas", "Río Verde", "San Gregorio", "Timaukel", "Torres del Paine"],
    "Maule": ["Cauquenes","Chanco","Colbun","Constitucion","Curepto","Curico","Empedrado","Hualane","Licanten","Linares","Longavi","Maule","Molina","Parral","Pelarco","Pelluhue","Pencahue","Rauco","Retiro","Rio Claro","Romeral","Sagrada Familia","San Clemente","San Javier","San Rafael","Talca","Teno","Vichuquen","Villa Alegre","Yerbas Buenas"],
    "Metropolitana": ["Alhue", "Buin", "Calera de Tango", "Cerrillos", "Cerro Navia", "Colina", "Conchali", "Curacavi", "El Bosque", "El Monte", "Estacion Central", "Huechuraba", "Independencia", "Isla de Maipo", "La Cisterna", "La Florida", "La Granja", "Lampa", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipu", "Maria Pinto", "Melipilla", "Nunoa", "Padre Hurtado", "Paine", "Pedro Aguirre Cerda", "Penaflor", "Penalolen", "Pirque", "Providencia", "Pudahuel", "Puente Alto", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquin","San Jose de Maipo","San Miguel","San Pedro","San Ramon","Santiago","Talagante","Tiltil","Vitacura"],
    "Ñuble": ["Bulnes", "Chillan", "Chillan Viejo", "Cobquecura", "Coelemu", "Coihueco", "El Carmen", "Ninhue", "Niquen", "Pemuco", "Pinto", "Portezuelo", "Quillon", "Quirihue", "Ranquil", "San Carlos", "San Fabian", "San Ignacio", "San Nicolas", "Trehuaco", "Yungay"],
    "Tarapacá": ["Alto Hospicio", "Camina", "Colchane", "Huara", "Iquique", "Pica", "Pozo Almonte", "Tarapaca"],
    "Valparaíso": ["Algarrobo", "Cabildo", "Calera", "Calle Larga", "Cartagena", "Casablanca", "Catemu", "Concon", "El Melon", "El Quisco", "El Tabo", "Hijuelas", "Isla de Pascua", "Juan Fernandez", "La Cruz", "La Ligua", "Limache", "Llaillay", "Los Andes", "Nogales", "Olmue", "Panquehue", "Papudo", "Petorca", "Placilla - V Del Mar", "Puchuncavi", "Putendo", "Quillota", "Quilpue", "Quintero", "Rinconada", "San Antonio", "San Esteban", "San Felipe", "Santa Maria", "Santo Domingo", "Valparaiso", "Villa Alemana"],
  }), []);

  const availableRegions = useMemo(() => Object.keys(regionCommuneData).sort((a, b) => a.localeCompare(b)), [regionCommuneData]);
  const availableCommunes = useMemo(() => (regionCommuneData[region] || []).sort((a, b) => a.localeCompare(b)), [region, regionCommuneData]);
  // ---------------------------------------------------------------------

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  // --- Force Free Shipping for Production Test ---
  // const shipping = subtotal > 0 ? 5.00 : 0; // Original calculation
  const shipping = 0; // Force free shipping
  const total = subtotal + shipping; // Total will now just be subtotal

  // Effect to check Zustand hydration status
  useEffect(() => {
    const unsubFinishHydration = useCartStore.persist.onFinishHydration(() => {
      console.log('Zustand store hydration finished.');
      setIsStoreHydrated(true);
    });

    if (useCartStore.persist.hasHydrated()) {
       console.log('Zustand store already hydrated on mount.');
       setIsStoreHydrated(true);
    } else {
       console.log('Waiting for Zustand store hydration...');
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  // --- Validation Function ---
  const checkFormValidity = (): boolean => {
    return !!(
      firstName.trim() &&
      lastName.trim() &&
      customerEmail.trim() && /\S+@\S+\.\S+/.test(customerEmail) &&
      phone.trim() && phone.length >= 8 &&
      address.trim() &&
      region &&
      commune
    );
  };

  // Effect to update the isFormValid state whenever relevant fields change
  useEffect(() => {
    const isValid = checkFormValidity();
    setIsFormValid(isValid);
  }, [firstName, lastName, customerEmail, phone, address, region, commune]);

  // Effect to potentially reset preference if form becomes invalid
  // We removed the automatic fetching from here. Fetching is now triggered by button click.
  useEffect(() => {
    // Reset preference if form becomes invalid
    if (!isFormValid && (preferenceId || checkoutUrl)) { // Reset if form invalid AND we have old data
        console.log("Form became invalid, resetting preference state.");
        setPreferenceId(null);
        setCheckoutUrl(null);
    }
    // We only need isFormValid, preferenceId, and checkoutUrl as dependencies here now.
  }, [isFormValid, preferenceId, checkoutUrl]);

  // Handler function for the Mercado Pago button click - Renamed
  const fetchPreferenceAndRedirect = async () => {
    // 1. Validate form first
    if (!validateFormOnSubmit()) {
        console.log("Formulario inválido para Mercado Pago.");
        // Optionally set a general error message if desired
        // setFormErrors(prev => ({ ...prev, general: 'Por favor completa los campos requeridos.' }));
        return; // Stop if validation fails
    }

    // 2. Proceed to fetch preference if form is valid
    console.log('Form valid, fetching preference ID and URL for MP...');
    setIsLoading(true); // Indicate loading specifically for MP
    setFormErrors({});
    setPreferenceId(null); // Reset previous IDs just in case
    setCheckoutUrl(null);

    // 3. Fetch logic
    try {
      // --- Explicitly create plain data object for the body ---
      const payload = {
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: customerEmail,
        address: address,
        region: region,
        commune: commune,
        observations: observations,
        items: items.map(item => ({ // Ensure items are plain objects
          id: item.id,
          title: item.name, // Assuming 'name' is correct based on previous code
          quantity: item.quantity,
          unit_price: item.price
        })),
        shippingCost: shipping
      };
      console.log("Payload being sent to backend:", payload); // Log the plain object

      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // Stringify the plain object
      });

      if (!response.ok) {
        let errorBody = await response.text();
        try { errorBody = JSON.parse(errorBody).error || errorBody; } catch(e){}
        console.error(`Backend error (${response.status}): ${errorBody}`);
        throw new Error(`Error del servidor: ${errorBody}`);
      }

      const data = await response.json();
      if (!data.preferenceId || !data.checkoutUrl) {
         throw new Error('Preference ID or Checkout URL not received from backend');
      }

      console.log(`Preference fetched successfully. Preference ID: ${data.preferenceId}, Checkout URL: ${data.checkoutUrl}`);

      // 4. Redirect immediately if successful
      console.log(`Redirecting to Mercado Pago URL: ${data.checkoutUrl}`);
      window.location.href = data.checkoutUrl;
      // No need to set preferenceId/checkoutUrl state if redirecting immediately

    } catch (error) {
      console.error('Error fetching Mercado Pago preference or redirecting:', error);
      setFormErrors({ general: `No se pudo iniciar el pago con Mercado Pago: ${error instanceof Error ? error.message : 'Error desconocido'}` });
      // Clear any potentially stale IDs/URLs
      setPreferenceId(null);
      setCheckoutUrl(null);
    } finally {
       setIsLoading(false); // Stop loading indicator
    }
  };

  // --- Validation Function for Submit ---
  // Sets errors in state and returns true if valid
  const validateFormOnSubmit = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'Nombre es requerido.';
    if (!lastName.trim()) errors.lastName = 'Apellido es requerido.';
    if (!customerEmail.trim()) errors.customerEmail = 'Email es requerido.';
    else if (!/\S+@\S+\.\S+/.test(customerEmail)) errors.customerEmail = 'Formato de email inválido.';
    if (!phone.trim()) errors.phone = 'Teléfono es requerido.';
    else if (phone.length < 8) errors.phone = 'Teléfono debe tener al menos 8 dígitos.';
    if (!address.trim()) errors.address = 'Dirección es requerida.';
    if (!region) errors.region = 'Región es requerida.';
    if (!commune) errors.commune = 'Comuna es requerida.';

    setFormErrors(errors); // Set errors to display them
    return Object.keys(errors).length === 0; // Return true if no errors
  };

  // Handler for Flow/Webpay button click
  const handleFlowPaymentClick = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateFormOnSubmit()) { // Validate form and display errors
        console.log("Formulario inválido para Flow.");
        return; // Stop if validation fails
    }

    // If validation passes, proceed
    const customerDataForFlow = {
        email: customerEmail, firstName, lastName, phone, address, region, commune, observations, amount: total
    };
    console.log('Customer Data Collected for Flow:', customerDataForFlow);

    console.log('Initiating Flow payment...');
    setIsFlowLoading(true);
    setFormErrors({}); // Clear previous errors before API call
    try {
      const response = await fetch('/api/create-flow-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerDataForFlow),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Flow API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.redirectUrl) {
        console.log('Received Flow redirect URL:', data.redirectUrl);
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('Redirect URL not received from Flow backend.');
      }

    } catch (error: any) {
      console.error('Error initiating Flow payment:', error);
      setFormErrors({ general: `Error al iniciar el pago: ${error.message}` }); // Show general error
      setIsFlowLoading(false);
    }
  };


  if (!isStoreHydrated || items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>{!isStoreHydrated ? 'Cargando carrito...' : 'Tu carrito está vacío. No puedes proceder al checkout.'}</p>
        {isStoreHydrated && items.length === 0 && (
            <a href="/tienda" className="mt-4 inline-block text-sm underline">Volver a la tienda</a>
        )}
      </div>
    );
  }

  return (
    // Añadir max-w-[100rem] y mx-auto al contenedor principal
    <div className="bg-gray-50 p-8 rounded-lg shadow-sm mx-auto">
      {/* Contenedor principal Flex para dos columnas en pantallas medianas y superiores */}
      <div className="md:flex md:gap-8 lg:gap-12">

        {/* Columna Izquierda: Formulario */}
        <div className="md:w-3/5 lg:w-2/3 mb-8 md:mb-0"> {/* Añadir margen inferior en móvil */}
          <h2 className="text-xl font-medium mb-8">Información de Envío y Contacto</h2> {/* Increased margin bottom */}
          {/* --- Customer Details Form Fields --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"> {/* Quitar mb-6 de aquí */}
            {/* First Name */}
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre(s)</label>
              <input
                type="text" id="first-name" value={firstName}
                // Clear specific error on change
                onChange={(e) => { setFirstName(e.target.value); setFormErrors(prev => ({ ...prev, firstName: '' })); }}
                required
                // Apply red border if error exists for this field
                className={`w-full px-3 py-2 border ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {/* Show error message if exists */}
              {formErrors.firstName && <span className="text-xs text-red-600 mt-1">{formErrors.firstName}</span>}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Apellido(s)</label>
              <input
                type="text" id="last-name" value={lastName}
                onChange={(e) => { setLastName(e.target.value); setFormErrors(prev => ({ ...prev, lastName: '' })); }}
                required
                className={`w-full px-3 py-2 border ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {formErrors.lastName && <span className="text-xs text-red-600 mt-1">{formErrors.lastName}</span>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email" id="customer-email" value={customerEmail}
                onChange={(e) => { setCustomerEmail(e.target.value); setFormErrors(prev => ({ ...prev, customerEmail: '' })); }}
                placeholder="tu@correo.com" required
                className={`w-full px-3 py-2 border ${formErrors.customerEmail ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {formErrors.customerEmail && <span className="text-xs text-red-600 mt-1">{formErrors.customerEmail}</span>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <div className="relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <span className="text-gray-500 sm:text-sm">+56</span>
                 </div>
                 <input
                   type="tel" id="phone" value={phone}
                   onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setFormErrors(prev => ({ ...prev, phone: '' })); }}
                   placeholder="9xxxxxxxx" required maxLength={9}
                   className={`w-full pl-10 pr-3 py-2 border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                 />
              </div>
              {formErrors.phone && <span className="text-xs text-red-600 mt-1">{formErrors.phone}</span>}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Dirección (Calle y Número)</label>
              <input
                type="text" id="address" value={address}
                onChange={(e) => { setAddress(e.target.value); setFormErrors(prev => ({ ...prev, address: '' })); }}
                placeholder="Ej: Av. Siempre Viva 742" required
                className={`w-full px-3 py-2 border ${formErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {formErrors.address && <span className="text-xs text-red-600 mt-1">{formErrors.address}</span>}
            </div>

             {/* Region Select */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Región</label>
              <select
                id="region" value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setCommune(''); // Reset commune
                  setFormErrors(prev => ({ ...prev, region: '', commune: '' })); // Clear related errors
                }}
                required
                className={`w-full px-3 py-2 border ${formErrors.region ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              >
                <option value="">Selecciona una región...</option>
                {/* Filter out empty key from data object */}
                {availableRegions.filter(r => r).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {formErrors.region && <span className="text-xs text-red-600 mt-1">{formErrors.region}</span>}
            </div>

            {/* Commune Select */}
            <div>
              <label htmlFor="commune" className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
              <select
                id="commune" value={commune}
                onChange={(e) => {
                  setCommune(e.target.value);
                  setFormErrors(prev => ({ ...prev, commune: '' })); // Clear error
                }}
                required
                disabled={!region || availableCommunes.length === 0} // Disable if no region or no communes for region
                className={`w-full px-3 py-2 border ${formErrors.commune ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!region || availableCommunes.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">{region ? 'Selecciona una comuna...' : 'Selecciona una región primero'}</option>
                {availableCommunes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {formErrors.commune && <span className="text-xs text-red-600 mt-1">{formErrors.commune}</span>}
            </div>

            {/* Observations */}
            <div className="md:col-span-2">
              <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">Observación para el transportista (Opcional)</label>
              <textarea
                id="observations" value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3} placeholder="Ej: Dejar en conserjería, timbre malo..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
          {/* --- End Customer Details --- */}

          {/* General Form Error Message Area */}
          {formErrors.general && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-medium">Error:</p>
                <p>{formErrors.general}</p>
            </div>
          )}
        </div> {/* Fin Columna Izquierda */}

        {/* Columna Derecha: Resumen y Pago */}
        {/* Added md:border-l, md:border-gray-300, md:pl-8, lg:pl-12 for vertical separator */}
        <div className="md:w-2/5 lg:w-1/3 md:border-l md:border-gray-300 md:pl-8 lg:pl-12">
          <h2 className="text-xl font-medium mb-6">Resumen del Pedido</h2>
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
                  <td className="text-right py-3">${formatPriceCLP(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-b">
                <td className="py-2 text-right text-gray-600">Subtotal</td>
                <td className="text-right py-2">${formatPriceCLP(subtotal)}</td>
              </tr>
              <tr>
                <td className="py-2 text-right text-gray-600">Envío</td>
                <td className="text-right py-2">${formatPriceCLP(shipping)}</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-3 text-right">Total</td>
                <td className="text-right py-3">${formatPriceCLP(total)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Selecciona tu método de pago:</h3>
            <div className="space-y-4">
              {/* --- Standard Button for Mercado Pago --- */}
              <button
                type="button"
                onClick={fetchPreferenceAndRedirect} // Use the renamed handler
                disabled={isLoading || isFlowLoading || !isFormValid} // Disable if loading MP, Flow, or form invalid
                className={`w-full bg-sky-500 hover:bg-sky-600 text-white border-none px-8 py-3 text-lg rounded-lg cursor-pointer flex items-center justify-center transition-colors ${isLoading || isFlowLoading || !isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Procesando...' : 'Pagar con Mercado Pago'}
              </button>
              {!isFormValid && <p className="text-center text-gray-400 text-sm">Completa tus datos para pagar con Mercado Pago.</p>}

              {/* Flow / Webpay Button */}
              <div> {/* Wrap button and paragraph */}
                <button
                  type="button"
                  onClick={handleFlowPaymentClick}
                  disabled={isFlowLoading || !isFormValid} // Deshabilitar si el form no es válido o está cargando
                  // Changed background to gray, added flex, items-center, justify-center
                  className={`w-full bg-slate-400 text-white border-none px-8 py-3 text-lg rounded-lg cursor-pointer flex items-center justify-center ${isFlowLoading || !isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isFlowLoading ? (
                    'Procesando...'
                  ) : (
                    <> {/* Use Fragment to group image and text */}
                      <img src="/assets/webpaydebito.svg" alt="Webpay" className="h-6 mr-2" /> {/* Added image */}
                      <span>Pagar con WebPay</span> {/* Changed text */}
                    </>
                  )}
                </button>
                {/* Added paragraph below button */}
                <p className="text-xs text-black text-center mt-2">
                  Pago Seguro realizado a través de Flow.cl
                </p>
              </div>
            </div>
          </div>
        </div> {/* Fin Columna Derecha */}

      </div> {/* Fin Contenedor Flex Principal */}
    </div> // Fin Contenedor General
  );
};

export default CheckoutForm;
