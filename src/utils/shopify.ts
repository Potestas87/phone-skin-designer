interface DesignInfo {
  designUrl: string;
  designId: string;
  phoneModel: string;
}

export async function addToCartWithDesign(
  variantId: string,
  design: DesignInfo
): Promise<void> {
  const isShopify = typeof window !== 'undefined' &&
    (window.location.hostname.includes('myshopify.com') ||
     document.querySelector('[data-shopify]'));

  if (!isShopify) {
    console.log('🎉 Design saved successfully!');
    console.log('Design ID:', design.designId);
    console.log('Design URL:', design.designUrl);
    console.log('Phone Model:', design.phoneModel);
    console.log('\n⚠️ Not running on Shopify - cart integration skipped');
    console.log('To test cart integration, deploy to a Shopify store');

    alert(
      `✅ Design Generated Successfully!\n\n` +
      `Design ID: ${design.designId}\n` +
      `Phone Model: ${design.phoneModel}\n\n` +
      `📁 Your design file is ready:\n${design.designUrl}\n\n` +
      `Note: Cart integration requires a Shopify store.\n` +
      `See SHOPIFY_INTEGRATION.md for setup instructions.`
    );

    return;
  }

  try {
    const formData = {
      id: variantId,
      quantity: 1,
      properties: {
        '_custom_design_url': design.designUrl,
        '_custom_design_id': design.designId,
        '_phone_model': design.phoneModel,
      },
    };

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Failed to add to cart');
    }

    const result = await response.json();
    console.log('Added to cart:', result);

    if (window.location.pathname !== '/cart') {
      window.location.href = '/cart';
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export function updateCartItemProperties(
  lineItemKey: string,
  properties: Record<string, string>
): Promise<Response> {
  return fetch('/cart/change.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: lineItemKey,
      properties,
    }),
  });
}

export async function getCart(): Promise<any> {
  const response = await fetch('/cart.js');
  return response.json();
}
